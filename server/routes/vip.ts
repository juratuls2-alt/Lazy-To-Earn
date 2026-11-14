import { Router, Request, Response, RequestHandler } from 'express';
import crypto from 'crypto';
import { sqlite } from '../db';

export const VIP_TIER_RANK: Record<string, number> = {
  Free: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
};

function makeVipHistId(): string {
  return `VIPH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export function getVipSystemSettings() {
  const row = sqlite.prepare('SELECT * FROM vip_system_settings WHERE id = 1').get() as any;
  return {
    validityDays: Number(row?.validity_days || 30),
    allowUpgrades: row?.allow_upgrades !== 0,
    allowRenewal: row?.allow_renewal !== 0,
    allowUpgradeWhileExpired: row?.allow_upgrade_while_expired !== 0,
    autoChargeEnabled: false as const,
  };
}

export function getVipTierConfigs() {
  const rows = sqlite.prepare('SELECT * FROM vip_tier_configs ORDER BY rank_order ASC').all() as any[];
  const tiers: Record<string, any> = {};
  for (const r of rows) {
    let perks: string[] = [];
    try {
      perks = JSON.parse(r.perks_json || '[]');
    } catch {
      perks = [];
    }
    tiers[r.tier] = {
      tier: r.tier,
      name: r.name,
      badgeColor: r.badge_color,
      priceMonthly: Number(r.price_monthly),
      multiplier: Number(r.multiplier),
      dailyFreeSpins: Number(r.daily_free_spins),
      dailyFreeScratches: Number(r.daily_free_scratches),
      referralBonus: Number(r.referral_bonus),
      payoutSpeed: r.payout_speed,
      perks,
    };
  }
  return tiers;
}

export function getEffectiveUserVip(userId: string) {
  const settings = getVipSystemSettings();
  const row = sqlite.prepare('SELECT * FROM user_vip_memberships WHERE user_id = ?').get(userId) as any;

  if (!row) {
    return {
      userId,
      effectiveTier: 'Free',
      lastPurchasedTier: 'Free',
      highestTier: 'Free',
      status: 'none' as const,
      activatedAt: undefined,
      expiresAt: undefined,
      remainingMs: 0,
      autoRenew: false as const,
      settings,
    };
  }

  const nowMs = Date.now();
  const expMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  let status: 'none' | 'active' | 'expired' = row.status || 'none';

  if (row.current_tier !== 'Free' && row.expires_at && expMs <= nowMs) {
    if (row.status !== 'expired') {
      sqlite
        .prepare("UPDATE user_vip_memberships SET status = 'expired', updated_at = datetime('now') WHERE user_id = ?")
        .run(userId);
      sqlite
        .prepare("UPDATE vip_membership_history SET status = 'expired' WHERE user_id = ? AND status = 'active' AND expires_at <= ?")
        .run(userId, new Date().toISOString());
    }
    status = 'expired';
  }

  const effectiveTier = status === 'active' ? row.current_tier : 'Free';
  const remainingMs = status === 'active' && expMs > nowMs ? expMs - nowMs : 0;

  return {
    userId,
    effectiveTier,
    lastPurchasedTier: row.current_tier || 'Free',
    highestTier: row.highest_tier || row.current_tier || 'Free',
    status,
    activatedAt: row.activated_at || undefined,
    expiresAt: row.expires_at || undefined,
    remainingMs,
    autoRenew: false as const,
    settings,
  };
}

export function createVipRouter(requireAdminAuth: RequestHandler): Router {
  const router = Router();

  // Public VIP config & tier benefits (strictly NO minimum withdrawal field)
  router.get('/vip/config', (_req: Request, res: Response) => {
    return res.json({
      settings: getVipSystemSettings(),
      tiers: getVipTierConfigs(),
    });
  });

  // Get user's live VIP status, countdown remaining, highest tier floor & permanent history
  router.get('/vip/status/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const status = getEffectiveUserVip(userId);
    const historyRows = sqlite
      .prepare('SELECT * FROM vip_membership_history WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as any[];

    const history = historyRows.map((h) => ({
      id: h.id,
      userId: h.user_id,
      actionType: h.action_type,
      fromTier: h.from_tier,
      toTier: h.to_tier,
      highestTierAfter: h.highest_tier_after,
      amountPaid: Number(h.amount_paid),
      paymentMethod: h.payment_method,
      paymentReference: h.payment_reference,
      paymentVerified: h.payment_verified === 1,
      validityDays: Number(h.validity_days),
      activatedAt: h.activated_at,
      expiresAt: h.expires_at,
      status: h.status,
      createdAt: h.created_at,
    }));

    return res.json({ ...status, history });
  });

  // Purchase, Renew, or Upgrade VIP Membership (30-Day Validity, Payment Verification, No Downgrades)
  router.post('/vip/purchase', (req: Request, res: Response) => {
    const {
      userId,
      targetTier,
      paymentMethod = 'Wallet Balance',
      paymentReference = '',
      paymentVerified = false,
      clientHighestTier,
      clientCurrentTier,
    } = req.body || {};

    if (!userId || !targetTier) {
      return res.status(400).json({ success: false, error: 'userId and targetTier are required.' });
    }

    if (paymentMethod !== 'Wallet Balance') {
      return res.status(400).json({
        success: false,
        error: 'Only Wallet Balance is accepted as the payment method for VIP plans.',
      });
    }

    if (!paymentVerified || !String(paymentReference).trim()) {
      return res.status(402).json({
        success: false,
        error: 'Wallet payment verification is required before activating a 30-day VIP membership.',
      });
    }

    if (targetTier === 'Free' || !(targetTier in VIP_TIER_RANK)) {
      return res.status(403).json({
        success: false,
        error: 'Downgrading to Starter (Free) or invalid tiers is not permitted.',
      });
    }

    const tiers = getVipTierConfigs();
    const tierCfg = tiers[targetTier];
    if (!tierCfg) {
      return res.status(404).json({ success: false, error: 'Selected VIP tier does not exist.' });
    }

    const settings = getVipSystemSettings();
    const currentStatus = getEffectiveUserVip(userId);
    const highestTier =
      (VIP_TIER_RANK[clientHighestTier] || 0) > (VIP_TIER_RANK[currentStatus.highestTier] || 0)
        ? clientHighestTier
        : currentStatus.highestTier;
    const highestRank = VIP_TIER_RANK[highestTier] || 0;
    const targetRank = VIP_TIER_RANK[targetTier] || 0;
    const activeRank = VIP_TIER_RANK[currentStatus.effectiveTier] || 0;

    // Rule 1: Strict No Downgrades — during OR after membership expiration
    if (highestRank > 0 && targetRank < highestRank) {
      return res.status(403).json({
        success: false,
        error: `Downgrades are disabled. Your account previously reached ${highestTier} VIP, so you cannot switch to ${targetTier} VIP during or after your membership.`,
      });
    }

    let actionType: 'purchase' | 'renewal' | 'upgrade' = 'purchase';
    const isSameAsHighest = highestRank > 0 && targetRank === highestRank;
    const isUpgrade = highestRank > 0 && targetRank > highestRank;

    if (isSameAsHighest) {
      if (!settings.allowRenewal) {
        return res.status(403).json({
          success: false,
          error: 'VIP membership renewals are currently disabled by administrator.',
        });
      }
      actionType = 'renewal';
    } else if (isUpgrade) {
      if (!settings.allowUpgrades) {
        return res.status(403).json({
          success: false,
          error: 'VIP tier upgrades are currently disabled by administrator.',
        });
      }
      if (currentStatus.status === 'expired' && !settings.allowUpgradeWhileExpired) {
        return res.status(403).json({
          success: false,
          error: 'Upgrades while expired are disabled by administrator. Please renew your current tier first.',
        });
      }
      actionType = 'upgrade';
    }

    const now = new Date();
    const validityMs = settings.validityDays * 24 * 60 * 60 * 1000;
    let activatedAt = now.toISOString();
    let baseExpiryMs = now.getTime();

    // If renewing the exact same active tier early, add 30 days onto remaining active time
    if (actionType === 'renewal' && currentStatus.status === 'active' && currentStatus.expiresAt) {
      const existingExpMs = new Date(currentStatus.expiresAt).getTime();
      if (existingExpMs > now.getTime()) {
        baseExpiryMs = existingExpMs;
      }
    }

    const expiresAt = new Date(baseExpiryMs + validityMs).toISOString();
    const fromTier =
      currentStatus.status === 'active'
        ? currentStatus.effectiveTier
        : clientCurrentTier || currentStatus.lastPurchasedTier || 'Free';
    const newHighestTier = targetRank >= highestRank ? targetTier : highestTier;

    const tx = sqlite.transaction(() => {
      // Mark prior active history entries superseded
      sqlite
        .prepare("UPDATE vip_membership_history SET status = 'superseded' WHERE user_id = ? AND status = 'active'")
        .run(userId);

      sqlite
        .prepare(
          `INSERT INTO user_vip_memberships (
            user_id, current_tier, highest_tier, status, activated_at, expires_at, auto_renew, updated_at
          ) VALUES (?, ?, ?, 'active', ?, ?, 0, datetime('now'))
          ON CONFLICT(user_id) DO UPDATE SET
            current_tier = excluded.current_tier,
            highest_tier = excluded.highest_tier,
            status = 'active',
            activated_at = excluded.activated_at,
            expires_at = excluded.expires_at,
            auto_renew = 0,
            updated_at = datetime('now')`
        )
        .run(userId, targetTier, newHighestTier, activatedAt, expiresAt);

      sqlite
        .prepare(
          `INSERT INTO vip_membership_history (
            id, user_id, action_type, from_tier, to_tier, highest_tier_after,
            amount_paid, payment_method, payment_reference, payment_verified,
            validity_days, activated_at, expires_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'active')`
        )
        .run(
          makeVipHistId(),
          userId,
          actionType,
          fromTier,
          targetTier,
          newHighestTier,
          tierCfg.priceMonthly,
          paymentMethod,
          String(paymentReference).trim(),
          settings.validityDays,
          activatedAt,
          expiresAt
        );

      // Keep public profile tier badge synced if exists
      sqlite
        .prepare("UPDATE public_profiles SET vip_tier = ?, updated_at = datetime('now') WHERE user_id = ?")
        .run(targetTier, userId);
    });
    tx();

    const updated = getEffectiveUserVip(userId);
    const history = sqlite
      .prepare('SELECT * FROM vip_membership_history WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId);

    return res.json({
      success: true,
      actionType,
      amountPaid: tierCfg.priceMonthly,
      membership: updated,
      history,
      activeRank,
    });
  });

  // Record Promo VIP Pass cleanly in permanent history (still respects no downgrade)
  router.post('/vip/promo-activate', (req: Request, res: Response) => {
    const { userId, targetTier = 'Bronze', validityDays = 7, promoCode = 'VIPBOOST' } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const currentStatus = getEffectiveUserVip(userId);
    const highestRank = VIP_TIER_RANK[currentStatus.highestTier] || 0;
    const targetRank = VIP_TIER_RANK[targetTier] || 1;
    if (highestRank > targetRank) {
      return res.status(403).json({
        success: false,
        error: `Cannot apply ${targetTier} pass below your highest tier (${currentStatus.highestTier}).`,
      });
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(validityDays) * 86400000).toISOString();
    sqlite
      .prepare("UPDATE vip_membership_history SET status = 'superseded' WHERE user_id = ? AND status = 'active'")
      .run(userId);
    sqlite
      .prepare(
        `INSERT INTO user_vip_memberships (user_id, current_tier, highest_tier, status, activated_at, expires_at, auto_renew, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?, 0, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           current_tier=excluded.current_tier, highest_tier=excluded.highest_tier,
           status='active', activated_at=excluded.activated_at, expires_at=excluded.expires_at, auto_renew=0`
      )
      .run(userId, targetTier, targetTier, now.toISOString(), expiresAt);
    sqlite
      .prepare(
        `INSERT INTO vip_membership_history (
          id, user_id, action_type, from_tier, to_tier, highest_tier_after,
          amount_paid, payment_method, payment_reference, payment_verified,
          validity_days, activated_at, expires_at, status
        ) VALUES (?, ?, 'promo', ?, ?, ?, 0, 'Promo Code', ?, 1, ?, ?, ?, 'active')`
      )
      .run(makeVipHistId(), userId, currentStatus.effectiveTier, targetTier, targetTier, promoCode, validityDays, now.toISOString(), expiresAt);

    return res.json({ success: true, membership: getEffectiveUserVip(userId) });
  });

  // =========================================================
  // ADMIN VIP MANAGEMENT
  // =========================================================
  router.get('/admin/vip/overview', requireAdminAuth, (_req: Request, res: Response) => {
    const settings = getVipSystemSettings();
    const tiers = getVipTierConfigs();
    const rawMembers = sqlite.prepare('SELECT * FROM user_vip_memberships ORDER BY updated_at DESC').all() as any[];
    // Refresh expiration status on read
    const memberships = rawMembers.map((m) => getEffectiveUserVip(m.user_id));
    const history = sqlite.prepare('SELECT * FROM vip_membership_history ORDER BY created_at DESC LIMIT 100').all();
    return res.json({ settings, tiers, memberships, history });
  });

  router.put('/admin/vip/settings', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    const validityDays = Math.min(365, Math.max(1, Number(b.validityDays || 30)));
    sqlite
      .prepare(
        `UPDATE vip_system_settings
         SET validity_days = ?, allow_upgrades = ?, allow_renewal = ?, allow_upgrade_while_expired = ?,
             auto_charge_enabled = 0, updated_at = datetime('now')
         WHERE id = 1`
      )
      .run(
        validityDays,
        b.allowUpgrades ? 1 : 0,
        b.allowRenewal ? 1 : 0,
        b.allowUpgradeWhileExpired ? 1 : 0
      );
    return res.json({ success: true, settings: getVipSystemSettings() });
  });

  router.put('/admin/vip/tiers/:tier', requireAdminAuth, (req: Request, res: Response) => {
    const tier = String(req.params.tier);
    if (!(tier in VIP_TIER_RANK)) {
      return res.status(404).json({ error: 'Invalid VIP tier.' });
    }
    const b = req.body || {};
    const perks = Array.isArray(b.perks)
      ? b.perks.filter((p: string) => !/min.*withdraw|min.*payout/i.test(String(p)))
      : [];

    sqlite
      .prepare(
        `UPDATE vip_tier_configs
         SET name = ?, price_monthly = ?, multiplier = ?, daily_free_spins = ?, daily_free_scratches = ?,
             referral_bonus = ?, payout_speed = ?, perks_json = ?, updated_at = datetime('now')
         WHERE tier = ?`
      )
      .run(
        b.name || tier,
        Math.max(0, Number(b.priceMonthly ?? 0)),
        Math.max(1, Number(b.multiplier ?? 1)),
        Math.max(0, Number(b.dailyFreeSpins ?? 1)),
        Math.max(0, Number(b.dailyFreeScratches ?? 1)),
        Math.max(0, Number(b.referralBonus ?? 10)),
        b.payoutSpeed || '24-48 Hours',
        JSON.stringify(perks),
        tier
      );
    return res.json({ success: true, tiers: getVipTierConfigs() });
  });

  router.post('/admin/vip/grant', requireAdminAuth, (req: Request, res: Response) => {
    const { userId, targetTier, validityDays } = req.body || {};
    if (!userId || !targetTier || targetTier === 'Free' || !(targetTier in VIP_TIER_RANK)) {
      return res.status(400).json({ error: 'Valid userId and paid targetTier required.' });
    }
    const settings = getVipSystemSettings();
    const days = Math.min(365, Math.max(1, Number(validityDays || settings.validityDays || 30)));
    const cur = getEffectiveUserVip(userId);
    const highestRank = Math.max(VIP_TIER_RANK[cur.highestTier] || 0, VIP_TIER_RANK[targetTier] || 0);
    const highestTier =
      Object.keys(VIP_TIER_RANK).find((k) => VIP_TIER_RANK[k] === highestRank) || targetTier;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 86400000).toISOString();

    sqlite.prepare("UPDATE vip_membership_history SET status = 'superseded' WHERE user_id = ? AND status = 'active'").run(userId);
    sqlite
      .prepare(
        `INSERT INTO user_vip_memberships (user_id, current_tier, highest_tier, status, activated_at, expires_at, auto_renew, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?, 0, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           current_tier=excluded.current_tier, highest_tier=excluded.highest_tier,
           status='active', activated_at=excluded.activated_at, expires_at=excluded.expires_at, auto_renew=0`
      )
      .run(userId, targetTier, highestTier, now.toISOString(), expiresAt);

    sqlite
      .prepare(
        `INSERT INTO vip_membership_history (
          id, user_id, action_type, from_tier, to_tier, highest_tier_after,
          amount_paid, payment_method, payment_reference, payment_verified,
          validity_days, activated_at, expires_at, status
        ) VALUES (?, ?, 'admin_grant', ?, ?, ?, 0, 'Admin Grant', ?, 1, ?, ?, ?, 'active')`
      )
      .run(makeVipHistId(), userId, cur.effectiveTier, targetTier, highestTier, `ADM-${Date.now().toString(36).toUpperCase()}`, days, now.toISOString(), expiresAt);

    return res.json({ success: true, membership: getEffectiveUserVip(userId) });
  });

  return router;
}
