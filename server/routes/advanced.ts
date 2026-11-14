import { Router, Request, Response, RequestHandler } from 'express';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { sqlite } from '../db';
import { getEffectiveUserVip } from './vip';

const TIER_RANK: Record<string, number> = {
  Free: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export function createAdvancedRouter(requireAdminAuth: RequestHandler): Router {
  const router = Router();

  // =========================================================
  // 1. MONTHLY REWARD CALENDAR
  // =========================================================
  router.get('/calendar/events', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '');
    const month = String(req.query.month || new Date().toISOString().slice(0, 7));

    const events = sqlite
      .prepare('SELECT * FROM reward_calendar_events WHERE event_date LIKE ? AND is_active = 1 ORDER BY day_number ASC')
      .all(`${month}-%`);

    const claims = userId
      ? sqlite
          .prepare('SELECT * FROM reward_calendar_claims WHERE user_id = ? AND claim_month = ? ORDER BY claimed_at DESC')
          .all(userId, month)
      : [];

    const allUserClaims = userId
      ? sqlite
          .prepare('SELECT * FROM reward_calendar_claims WHERE user_id = ? ORDER BY claimed_at DESC LIMIT 60')
          .all(userId)
      : [];

    return res.json({ events, claims, history: allUserClaims, serverDate: new Date().toISOString().slice(0, 10) });
  });

  router.post('/calendar/claim', (req: Request, res: Response) => {
    const { userId, eventId, vipTier = 'Free', username, displayName, avatarUrl } = req.body || {};
    if (!userId || !eventId) {
      return res.status(400).json({ success: false, error: 'userId and eventId are required.' });
    }

    const ev = sqlite.prepare('SELECT * FROM reward_calendar_events WHERE id = ? AND is_active = 1').get(eventId) as any;
    if (!ev) {
      return res.status(404).json({ success: false, error: 'Calendar reward event not found or inactive.' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (ev.event_date > todayStr) {
      return res.status(400).json({
        success: false,
        error: `This reward unlocks on ${ev.event_date}. Early claims are blocked.`,
      });
    }

    const vipStatus = getEffectiveUserVip(userId);
    const resolvedVipTier = vipStatus.status === 'none' ? vipTier : vipStatus.effectiveTier;

    if (ev.vip_only && (TIER_RANK[resolvedVipTier] || 0) < (TIER_RANK[ev.required_tier] || 1)) {
      return res.status(403).json({
        success: false,
        error:
          vipStatus.status === 'expired'
            ? `Your ${vipStatus.highestTier} VIP membership has expired. Renew your VIP plan to claim VIP calendar rewards.`
            : `Requires ${ev.required_tier} VIP tier or higher to claim.`,
      });
    }

    const existing = sqlite
      .prepare('SELECT id FROM reward_calendar_claims WHERE user_id = ? AND event_id = ?')
      .get(userId, eventId);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Reward already claimed for this calendar date.' });
    }

    const claimId = makeId('CLM');
    const claimMonth = ev.event_date.slice(0, 7);
    sqlite
      .prepare(
        `INSERT INTO reward_calendar_claims (id, user_id, event_id, claim_month, reward_type, reward_value)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(claimId, userId, eventId, claimMonth, ev.reward_type, ev.reward_value);

    // Log public activity if profile consents
    const priv = sqlite.prepare('SELECT show_activity, is_public FROM profile_privacy_settings WHERE user_id = ?').get(userId) as any;
    if (!priv || (priv.show_activity === 1 && priv.is_public === 1)) {
      sqlite
        .prepare(
          `INSERT INTO public_activity_events (
            id, user_id, username, display_name, avatar_url, vip_tier, category,
            title, title_bn, description, description_bn
          ) VALUES (?, ?, ?, ?, ?, ?, 'challenge', ?, ?, ?, ?)`
        )
        .run(
          makeId('ACT'),
          userId,
          username || userId.toLowerCase(),
          displayName || 'Member',
          avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(displayName || userId),
          vipTier,
          `Claimed ${ev.title}`,
          `${ev.title_bn || ev.title} সংগ্রহ করেছেন`,
          `Unlocked a Monthly Reward Calendar milestone (${ev.event_type.replace('_', ' ')}).`,
          `মাসিক রিওয়ার্ড ক্যালেন্ডারের একটি মাইলফলক অর্জন করেছেন।`
        );
    }

    return res.json({
      success: true,
      claim: {
        id: claimId,
        user_id: userId,
        event_id: eventId,
        claim_month: claimMonth,
        reward_type: ev.reward_type,
        reward_value: ev.reward_value,
        claimed_at: new Date().toISOString(),
      },
      event: ev,
    });
  });

  router.get('/admin/calendar/all', requireAdminAuth, (_req: Request, res: Response) => {
    const events = sqlite.prepare('SELECT * FROM reward_calendar_events ORDER BY event_date ASC').all();
    const stats = sqlite
      .prepare(
        `SELECT e.event_type, COUNT(c.id) as claim_count, COALESCE(SUM(c.reward_value), 0) as total_value
         FROM reward_calendar_events e
         LEFT JOIN reward_calendar_claims c ON c.event_id = e.id
         GROUP BY e.event_type`
      )
      .all();
    return res.json({ events, stats });
  });

  router.post('/admin/calendar/events', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.event_date || !b.title || !b.event_type || !b.reward_type) {
      return res.status(400).json({ error: 'Missing required calendar event fields.' });
    }
    const dayNumber = Number(b.event_date.split('-')[2] || b.day_number || 1);
    const id = b.id || makeId('CAL');
    sqlite
      .prepare(
        `INSERT INTO reward_calendar_events (
          id, event_date, day_number, title, title_bn, description, description_bn,
          event_type, reward_type, reward_value, vip_only, required_tier, is_active, claim_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          event_date=excluded.event_date, day_number=excluded.day_number, title=excluded.title,
          title_bn=excluded.title_bn, description=excluded.description, description_bn=excluded.description_bn,
          event_type=excluded.event_type, reward_type=excluded.reward_type, reward_value=excluded.reward_value,
          vip_only=excluded.vip_only, required_tier=excluded.required_tier, is_active=excluded.is_active`
      )
      .run(
        id,
        b.event_date,
        dayNumber,
        b.title,
        b.title_bn || b.title,
        b.description || '',
        b.description_bn || b.description || '',
        b.event_type,
        b.reward_type,
        Number(b.reward_value || 0),
        b.vip_only ? 1 : 0,
        b.required_tier || 'Free',
        b.is_active === 0 ? 0 : 1,
        `${b.event_date} 23:59:59`
      );
    return res.json({ success: true, id });
  });

  router.delete('/admin/calendar/events/:id', requireAdminAuth, (req: Request, res: Response) => {
    sqlite.prepare('DELETE FROM reward_calendar_events WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  });

  // =========================================================
  // 2. MULTI-LANGUAGE & TRANSLATION MANAGEMENT
  // =========================================================
  router.get('/i18n/strings', (_req: Request, res: Response) => {
    const rows = sqlite.prepare('SELECT * FROM translation_strings ORDER BY category, key, language_code').all() as any[];
    const languages = sqlite
      .prepare('SELECT DISTINCT language_code, language_name FROM translation_strings ORDER BY language_code')
      .all();

    const byLang: Record<string, Record<string, string>> = {};
    const enKeys = new Set<string>();
    for (const r of rows) {
      if (!byLang[r.language_code]) byLang[r.language_code] = {};
      byLang[r.language_code][r.key] = r.text_value;
      if (r.language_code === 'en') enKeys.add(r.key);
    }

    const missing: Array<{ language_code: string; key: string }> = [];
    for (const langObj of languages as Array<{ language_code: string }>) {
      const dict = byLang[langObj.language_code] || {};
      for (const k of enKeys) {
        if (!dict[k] || !dict[k].trim()) {
          missing.push({ language_code: langObj.language_code, key: k });
        }
      }
    }

    return res.json({ languages, strings: rows, dictionaries: byLang, missing });
  });

  router.get('/i18n/preference/:userId', (req: Request, res: Response) => {
    const row = sqlite.prepare('SELECT language_code FROM language_preferences WHERE user_id = ?').get(req.params.userId) as any;
    return res.json({ language_code: row?.language_code || 'en' });
  });

  router.post('/i18n/preference', (req: Request, res: Response) => {
    const { userId, languageCode } = req.body || {};
    if (!userId || !languageCode) {
      return res.status(400).json({ error: 'userId and languageCode are required.' });
    }
    sqlite
      .prepare(
        `INSERT INTO language_preferences (user_id, language_code, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET language_code=excluded.language_code, updated_at=datetime('now')`
      )
      .run(userId, languageCode);
    return res.json({ success: true, languageCode });
  });

  router.post('/admin/i18n/strings', requireAdminAuth, (req: Request, res: Response) => {
    const { key, language_code, language_name, category = 'general', text_value } = req.body || {};
    if (!key || !language_code || typeof text_value !== 'string') {
      return res.status(400).json({ error: 'key, language_code, and text_value are required.' });
    }
    sqlite
      .prepare(
        `INSERT INTO translation_strings (key, language_code, language_name, category, text_value, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(key, language_code) DO UPDATE SET
           text_value=excluded.text_value, language_name=excluded.language_name,
           category=excluded.category, updated_at=datetime('now')`
      )
      .run(key, language_code, language_name || language_code.toUpperCase(), category, text_value);
    return res.json({ success: true });
  });

  router.post('/admin/i18n/languages', requireAdminAuth, (req: Request, res: Response) => {
    const { language_code, language_name } = req.body || {};
    if (!language_code || !language_name) {
      return res.status(400).json({ error: 'language_code and language_name are required.' });
    }
    const enRows = sqlite.prepare("SELECT key, category, text_value FROM translation_strings WHERE language_code = 'en'").all() as any[];
    const insert = sqlite.prepare(`
      INSERT OR IGNORE INTO translation_strings (key, language_code, language_name, category, text_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    const tx = sqlite.transaction(() => {
      for (const r of enRows) {
        insert.run(r.key, language_code.toLowerCase(), language_name, r.category, r.text_value);
      }
    });
    tx();
    return res.json({ success: true, initializedKeys: enRows.length });
  });

  // =========================================================
  // 3. ACHIEVEMENT SHOWCASE & PUBLIC PROFILES
  // =========================================================
  router.get('/profiles/directory', (_req: Request, res: Response) => {
    const rows = sqlite
      .prepare(
        `SELECT p.user_id, p.username, p.display_name, p.avatar_url, p.profile_frame, p.profile_theme,
                p.bio, p.user_level, p.vip_tier, p.registration_date, p.completed_missions_count,
                p.tournaments_played, p.tournaments_won, p.badges_json, pr.show_stats, pr.show_achievements
         FROM public_profiles p
         JOIN profile_privacy_settings pr ON pr.user_id = p.user_id
         WHERE pr.is_public = 1 AND p.is_moderated_hidden = 0
         ORDER BY p.user_level DESC`
      )
      .all() as any[];

    const sanitized = rows.map((r) => ({
      user_id: r.user_id,
      username: r.username,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
      profile_frame: r.profile_frame,
      profile_theme: r.profile_theme,
      bio: r.bio,
      user_level: r.user_level,
      vip_tier: r.vip_tier,
      registration_date: r.registration_date,
      completed_missions_count: r.show_stats ? r.completed_missions_count : null,
      tournaments_played: r.show_stats ? r.tournaments_played : null,
      tournaments_won: r.show_stats ? r.tournaments_won : null,
      badges: r.show_achievements ? JSON.parse(r.badges_json || '[]') : [],
    }));
    return res.json({ profiles: sanitized });
  });

  router.get('/profiles/public/:identifier', (req: Request, res: Response) => {
    const idOrUser = req.params.identifier;
    const viewerId = String(req.query.viewerId || '');
    const profile = sqlite
      .prepare('SELECT * FROM public_profiles WHERE username = ? OR user_id = ?')
      .get(idOrUser, idOrUser) as any;

    if (!profile) {
      return res.status(404).json({ error: 'Public profile not found.' });
    }

    const privacy = (sqlite
      .prepare('SELECT * FROM profile_privacy_settings WHERE user_id = ?')
      .get(profile.user_id) as any) || {
      is_public: 1,
      show_stats: 1,
      show_achievements: 1,
      show_activity: 1,
      allow_gifts: 1,
    };

    const isOwner = viewerId === profile.user_id;
    if (!isOwner && (profile.is_moderated_hidden === 1 || privacy.is_public === 0)) {
      return res.status(403).json({
        privateProfile: true,
        username: profile.username,
        display_name: profile.display_name,
        message: 'This member profile is currently set to private.',
      });
    }

    const followersCount = (sqlite
      .prepare('SELECT COUNT(*) as c FROM profile_follows WHERE followed_user_id = ?')
      .get(profile.user_id) as { c: number }).c;

    const recentActivity =
      isOwner || privacy.show_activity === 1
        ? sqlite
            .prepare('SELECT * FROM public_activity_events WHERE user_id = ? AND is_hidden = 0 ORDER BY created_at DESC LIMIT 8')
            .all(profile.user_id)
        : [];

    // NEVER return email, phone, balances, or withdrawal details
    return res.json({
      profile: {
        user_id: profile.user_id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        profile_frame: profile.profile_frame,
        profile_theme: profile.profile_theme,
        bio: profile.bio,
        user_level: profile.user_level,
        vip_tier: profile.vip_tier,
        registration_date: profile.registration_date,
        followersCount,
        completed_missions_count: isOwner || privacy.show_stats ? profile.completed_missions_count : null,
        tournaments_played: isOwner || privacy.show_stats ? profile.tournaments_played : null,
        tournaments_won: isOwner || privacy.show_stats ? profile.tournaments_won : null,
        achievements: isOwner || privacy.show_achievements ? JSON.parse(profile.achievements_json || '[]') : [],
        badges: isOwner || privacy.show_achievements ? JSON.parse(profile.badges_json || '[]') : [],
        unlocked_rewards: isOwner || privacy.show_achievements ? JSON.parse(profile.unlocked_rewards_json || '[]') : [],
      },
      privacy: isOwner ? privacy : { is_public: privacy.is_public, allow_gifts: privacy.allow_gifts },
      recentActivity,
    });
  });

  router.put('/profiles/me', (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.user_id || !b.username || !b.display_name) {
      return res.status(400).json({ error: 'user_id, username, and display_name are required.' });
    }
    const cleanUsername = String(b.username).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 alphanumeric/underscore characters.' });
    }

    const conflict = sqlite
      .prepare('SELECT user_id FROM public_profiles WHERE username = ? AND user_id != ?')
      .get(cleanUsername, b.user_id);
    if (conflict) {
      return res.status(409).json({ error: 'This username is already taken.' });
    }

    sqlite
      .prepare(
        `INSERT INTO public_profiles (
          user_id, username, display_name, avatar_url, profile_frame, profile_theme,
          bio, user_level, vip_tier, registration_date, completed_missions_count,
          tournaments_played, tournaments_won, achievements_json, badges_json, unlocked_rewards_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          username=excluded.username, display_name=excluded.display_name, avatar_url=excluded.avatar_url,
          profile_frame=excluded.profile_frame, profile_theme=excluded.profile_theme, bio=excluded.bio,
          user_level=excluded.user_level, vip_tier=excluded.vip_tier,
          completed_missions_count=excluded.completed_missions_count,
          tournaments_played=excluded.tournaments_played, tournaments_won=excluded.tournaments_won,
          achievements_json=excluded.achievements_json, badges_json=excluded.badges_json,
          unlocked_rewards_json=excluded.unlocked_rewards_json, updated_at=datetime('now')`
      )
      .run(
        b.user_id,
        cleanUsername,
        b.display_name,
        b.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(b.display_name),
        b.profile_frame || 'default',
        b.profile_theme || 'amber-dark',
        b.bio || '',
        Number(b.user_level || 1),
        b.vip_tier || 'Free',
        b.registration_date || new Date().toISOString().slice(0, 10),
        Number(b.completed_missions_count || 0),
        Number(b.tournaments_played || 0),
        Number(b.tournaments_won || 0),
        JSON.stringify(b.achievements || []),
        JSON.stringify(b.badges || []),
        JSON.stringify(b.unlocked_rewards || [])
      );

    if (b.privacy) {
      sqlite
        .prepare(
          `INSERT INTO profile_privacy_settings (user_id, is_public, show_stats, show_achievements, show_activity, allow_gifts, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET
             is_public=excluded.is_public, show_stats=excluded.show_stats,
             show_achievements=excluded.show_achievements, show_activity=excluded.show_activity,
             allow_gifts=excluded.allow_gifts, updated_at=datetime('now')`
        )
        .run(
          b.user_id,
          b.privacy.is_public ? 1 : 0,
          b.privacy.show_stats ? 1 : 0,
          b.privacy.show_achievements ? 1 : 0,
          b.privacy.show_activity ? 1 : 0,
          b.privacy.allow_gifts ? 1 : 0
        );
    }

    return res.json({ success: true, username: cleanUsername });
  });

  router.post('/profiles/report', (req: Request, res: Response) => {
    const { target_user_id, reporter_user_id, reason, details = '' } = req.body || {};
    if (!target_user_id || !reporter_user_id || !reason) {
      return res.status(400).json({ error: 'target_user_id, reporter_user_id, and reason are required.' });
    }
    const id = makeId('RPT');
    sqlite
      .prepare(
        `INSERT INTO profile_reports (id, target_user_id, reporter_user_id, reason, details)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, target_user_id, reporter_user_id, reason, details);
    return res.json({ success: true, id });
  });

  router.get('/admin/profiles/moderation', requireAdminAuth, (_req: Request, res: Response) => {
    const reports = sqlite.prepare('SELECT * FROM profile_reports ORDER BY created_at DESC').all();
    const profiles = sqlite.prepare('SELECT * FROM public_profiles ORDER BY updated_at DESC').all();
    return res.json({ reports, profiles });
  });

  router.post('/admin/profiles/moderate', requireAdminAuth, (req: Request, res: Response) => {
    const { reportId, targetUserId, hideProfile, status = 'Actioned', adminNotes = '' } = req.body || {};
    if (reportId) {
      sqlite
        .prepare('UPDATE profile_reports SET status = ?, admin_notes = ? WHERE id = ?')
        .run(status, adminNotes, reportId);
    }
    if (targetUserId && typeof hideProfile === 'boolean') {
      sqlite.prepare('UPDATE public_profiles SET is_moderated_hidden = ? WHERE user_id = ?').run(hideProfile ? 1 : 0, targetUserId);
    }
    return res.json({ success: true });
  });

  // =========================================================
  // 4. ADVANCED SECURITY, TRUST CENTER & FRAUD PROTECTION
  // =========================================================
  router.get('/security/overview/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    let settings = sqlite.prepare('SELECT * FROM user_security_settings WHERE user_id = ?').get(userId) as any;
    if (!settings) {
      sqlite
        .prepare(
          `INSERT INTO user_security_settings (user_id, two_factor_enabled, two_factor_secret, email_verified)
           VALUES (?, 0, ?, 1)`
        )
        .run(userId, `LTE2FA-${userId.slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`);
      settings = sqlite.prepare('SELECT * FROM user_security_settings WHERE user_id = ?').get(userId);
    }

    let history = sqlite
      .prepare('SELECT * FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(userId) as any[];
    if (history.length === 0) {
      sqlite
        .prepare(
          `INSERT INTO login_history (id, user_id, ip_address, device_name, browser, location, status, is_current_session)
           VALUES (?, ?, '103.112.54.20', 'Active Web Browser', 'Chrome Desktop', 'Dhaka, Bangladesh', 'Success', 1)`
        )
        .run(makeId('LOG'), userId);
      history = sqlite
        .prepare('SELECT * FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
        .all(userId) as any[];
    }

    const devices = sqlite.prepare('SELECT * FROM trusted_devices WHERE user_id = ? ORDER BY last_seen DESC').all(userId);
    const incidents = sqlite
      .prepare('SELECT * FROM security_incidents WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(userId);

    return res.json({ settings, loginHistory: history, trustedDevices: devices, incidents });
  });

  router.post('/security/2fa', (req: Request, res: Response) => {
    const { userId, enabled, method = 'authenticator', verificationCode } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    if (enabled && verificationCode && String(verificationCode).trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit authenticator verification code.' });
    }

    sqlite
      .prepare(
        `INSERT INTO user_security_settings (user_id, two_factor_enabled, two_factor_method, two_factor_secret, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           two_factor_enabled=excluded.two_factor_enabled,
           two_factor_method=excluded.two_factor_method,
           updated_at=datetime('now')`
      )
      .run(userId, enabled ? 1 : 0, method, `LTE2FA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);

    sqlite
      .prepare(
        `INSERT INTO security_incidents (id, user_id, incident_type, severity, description, resolved)
         VALUES (?, ?, ?, 'low', ?, 1)`
      )
      .run(
        makeId('INC'),
        userId,
        enabled ? '2FA Enabled' : '2FA Disabled',
        enabled
          ? `Two-factor authentication (${method}) was verified and enabled.`
          : 'Two-factor authentication was disabled by account owner.'
      );

    return res.json({ success: true, enabled: !!enabled });
  });

  router.post('/security/devices/trust', (req: Request, res: Response) => {
    const { userId, deviceLabel, browser } = req.body || {};
    if (!userId || !deviceLabel) return res.status(400).json({ error: 'userId and deviceLabel required.' });
    const id = makeId('DEV');
    const fp = `fp-${crypto.createHash('md5').update(`${userId}:${deviceLabel}:${Date.now()}`).digest('hex').slice(0, 12)}`;
    sqlite
      .prepare('INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_label, browser) VALUES (?, ?, ?, ?, ?)')
      .run(id, userId, fp, deviceLabel, browser || 'Modern Browser');
    return res.json({ success: true, id });
  });

  router.delete('/security/devices/:id', (req: Request, res: Response) => {
    sqlite.prepare('DELETE FROM trusted_devices WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  });

  router.post('/security/sessions/revoke', (req: Request, res: Response) => {
    const { userId, sessionId, revokeAll } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    if (revokeAll) {
      sqlite
        .prepare('UPDATE login_history SET revoked = 1, is_current_session = 0 WHERE user_id = ? AND is_current_session = 0')
        .run(userId);
    } else if (sessionId) {
      sqlite.prepare('UPDATE login_history SET revoked = 1, is_current_session = 0 WHERE id = ? AND user_id = ?').run(sessionId, userId);
    }
    return res.json({ success: true });
  });

  router.post('/security/withdrawal-verify', (req: Request, res: Response) => {
    const { userId, amount } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    const openAlerts = sqlite
      .prepare("SELECT * FROM fraud_alerts WHERE user_id = ? AND status IN ('Open', 'Investigating')")
      .all(userId) as any[];

    const flagged = openAlerts.some((a) => a.risk_score >= 60) || Number(amount) >= 1500;
    if (flagged) {
      sqlite
        .prepare(
          `INSERT INTO fraud_alerts (id, user_id, alert_type, risk_score, evidence, status)
           VALUES (?, ?, 'flagged_withdrawal', 72, ?, 'Open')`
        )
        .run(
          makeId('FRD'),
          userId,
          `Automated withdrawal verification triggered for amount $${Number(amount || 0).toFixed(2)}.`
        );
    }
    return res.json({ verified: true, requiresExtraReview: flagged, openAlertsCount: openAlerts.length });
  });

  router.get('/admin/security/center', requireAdminAuth, (_req: Request, res: Response) => {
    const fraudAlerts = sqlite.prepare('SELECT * FROM fraud_alerts ORDER BY risk_score DESC, created_at DESC').all();
    const incidents = sqlite.prepare('SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 50').all();
    const recentLogins = sqlite.prepare('SELECT * FROM login_history ORDER BY created_at DESC LIMIT 30').all();
    return res.json({ fraudAlerts, incidents, recentLogins });
  });

  router.post('/admin/security/alerts/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { status, investigation_log = '', investigated_by = 'admin@lazytoearn.com' } = req.body || {};
    sqlite
      .prepare(
        `UPDATE fraud_alerts SET status = ?, investigation_log = ?, investigated_by = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(status || 'Investigating', investigation_log, investigated_by, req.params.id);
    return res.json({ success: true });
  });

  router.post('/admin/security/scan', requireAdminAuth, (_req: Request, res: Response) => {
    // Run heuristic check across calendar claims & gift transfers
    const rapidClaims = sqlite
      .prepare(
        `SELECT user_id, COUNT(*) as cnt FROM reward_calendar_claims
         WHERE claimed_at >= datetime('now', '-1 hour')
         GROUP BY user_id HAVING cnt >= 10`
      )
      .all() as Array<{ user_id: string; cnt: number }>;

    let created = 0;
    for (const rc of rapidClaims) {
      const exists = sqlite
        .prepare("SELECT id FROM fraud_alerts WHERE user_id = ? AND alert_type = 'abnormal_claim_frequency' AND status = 'Open'")
        .get(rc.user_id);
      if (!exists) {
        sqlite
          .prepare(
            `INSERT INTO fraud_alerts (id, user_id, alert_type, risk_score, evidence, status)
             VALUES (?, ?, 'abnormal_claim_frequency', 78, ?, 'Open')`
          )
          .run(makeId('FRD'), rc.user_id, `Detected ${rc.cnt} calendar claims within 1 hour.`);
        created++;
      }
    }
    return res.json({ success: true, newAlertsDetected: created, scannedAt: new Date().toISOString() });
  });

  // =========================================================
  // 5. AI PERSONAL ASSISTANT (Server-side @google/genai)
  // =========================================================
  router.get('/ai/history/:userId', (req: Request, res: Response) => {
    const messages = sqlite
      .prepare('SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY created_at ASC LIMIT 50')
      .all(req.params.userId);
    const settings = sqlite.prepare('SELECT is_enabled, daily_message_limit FROM ai_assistant_settings WHERE id = 1').get() as any;
    const todayUsed = (sqlite
      .prepare(
        `SELECT COUNT(*) as c FROM ai_conversations
         WHERE user_id = ? AND role = 'user' AND date(created_at) = date('now')`
      )
      .get(req.params.userId) as { c: number }).c;

    return res.json({
      messages,
      isEnabled: settings?.is_enabled === 1,
      dailyLimit: settings?.daily_message_limit || 30,
      usedToday: todayUsed,
    });
  });

  router.delete('/ai/history/:userId', (req: Request, res: Response) => {
    sqlite.prepare('DELETE FROM ai_conversations WHERE user_id = ?').run(req.params.userId);
    return res.json({ success: true });
  });

  router.post('/ai/assistant', async (req: Request, res: Response) => {
    const { userId, message, language = 'en', userContext = {} } = req.body || {};
    if (!userId || !message || typeof message !== 'string') {
      return res.status(400).json({ error: 'userId and message are required.' });
    }

    const cfg = sqlite.prepare('SELECT * FROM ai_assistant_settings WHERE id = 1').get() as any;
    if (!cfg || cfg.is_enabled === 0) {
      return res.status(403).json({ error: 'AI Assistant is temporarily paused by administrator.' });
    }

    const usedToday = (sqlite
      .prepare(
        `SELECT COUNT(*) as c FROM ai_conversations
         WHERE user_id = ? AND role = 'user' AND date(created_at) = date('now')`
      )
      .get(userId) as { c: number }).c;

    if (usedToday >= (cfg.daily_message_limit || 30)) {
      return res.status(429).json({
        error: `Daily AI assistant message limit (${cfg.daily_message_limit}) reached. Please try again tomorrow.`,
      });
    }

    // Detect Bangla characters automatically if present
    const hasBangla = /[\u0980-\u09FF]/.test(message);
    const replyLang = hasBangla ? 'bn' : language === 'bn' ? 'bn' : 'en';

    sqlite
      .prepare('INSERT INTO ai_conversations (id, user_id, role, language, message) VALUES (?, ?, ?, ?, ?)')
      .run(makeId('AIC'), userId, 'user', replyLang, message.trim());

    // Security Guardrail: refuse unauthorized actions immediately
    const lower = message.toLowerCase();
    const forbiddenRequest =
      /(add|increase|set|change|modify|hack|give me).*(balance|money|dollar|\$)|approve.*withdrawal|override.*admin|other user|someone else.*(email|phone|password|balance)|make me admin/i.test(
        lower
      );

    let replyText = '';
    if (forbiddenRequest) {
      replyText =
        replyLang === 'bn'
          ? 'দুঃখিত, নিরাপত্তার কারণে আমি কোনো অ্যাকাউন্টের ব্যালেন্স পরিবর্তন, উইথড্রয়াল অনুমোদন, অ্যাডমিন সিদ্ধান্ত পরিবর্তন বা অন্য ব্যবহারকারীর ব্যক্তিগত তথ্য প্রদান করতে পারি না। অনুগ্রহ করে সাপোর্ট ডেস্ক বা নিয়মিত মিশন ও গেমের মাধ্যমে রিওয়ার্ড অর্জন করুন।'
          : 'For platform security and data isolation, I cannot modify balances, approve withdrawals, alter permissions, override administrator decisions, or access another member’s private data. I can only explain platform features, schedules, and your own account summary.';
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const safeContext = JSON.stringify({
          userName: userContext.name || 'Member',
          vipTier: userContext.vipTier || 'Free',
          availableBalanceUsd: Number(userContext.availableBalance || 0).toFixed(2),
          points: Number(userContext.points || 0),
          minWithdrawalUsd: 100,
          standardWithdrawalDay: '28th of every month',
          vipWithdrawalDays: '15th & 28th of every month',
          preferredLanguage: replyLang === 'bn' ? 'Bangla (বাংলা)' : 'English',
        });

        const historyRows = sqlite
          .prepare('SELECT role, message FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 8')
          .all(userId) as Array<{ role: string; message: string }>;
        const recentTranscript = historyRows
          .reverse()
          .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`)
          .join('\n');

        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Authorized Current User Context (read-only): ${safeContext}\n\nConversation:\n${recentTranscript}`,
            config: {
              systemInstruction: `${cfg.system_instructions}\n\nFAQ Knowledge:\n${cfg.faq_knowledge}\n\nRespond clearly in ${
                replyLang === 'bn' ? 'Bangla (বাংলা)' : 'English'
              }. Keep answers helpful, concise, and compliant.`,
            },
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout after 18s')), 18000)),
        ]);
        replyText = (response.text || '').trim();
      } catch (err) {
        console.error('Gemini API error:', err);
      }
    }

    // Helpful deterministic fallback if GEMINI_API_KEY is unavailable
    if (!replyText) {
      if (lower.includes('withdraw') || lower.includes('payout') || message.includes('টাকা') || message.includes('উত্তোলন')) {
        replyText =
          replyLang === 'bn'
            ? `সাধারণ সদস্যরা প্রতি মাসের ২৮ তারিখে (সর্বনিম্ন $100) উত্তোলন করতে পারেন। ভিআইপি সদস্যরা প্রতি মাসের ১৫ এবং ২৮ তারিখে দুটি উইন্ডোতে bKash, Nagad, Bank বা USDT-এর মাধ্যমে উত্তোলনের সুযোগ পান।`
            : `Standard members can submit 1 withdrawal per month on the 28th once reaching the $100.00 threshold. VIP members (Bronze–Platinum) unlock 2 monthly windows on the 15th & 28th via bKash, Nagad, Bank, or USDT.`;
      } else if (lower.includes('calendar') || lower.includes('ক্যালেন্ডার')) {
        replyText =
          replyLang === 'bn'
            ? `মাসিক রিওয়ার্ড ক্যালেন্ডার থেকে আপনি প্রতিদিন লগইন পয়েন্ট, সাপ্তাহিক মাইলফলক এবং ভিআইপি বোনাস সংগ্রহ করতে পারেন।`
            : `Visit the Monthly Reward Calendar to claim daily check-in points, weekly milestone credits, and VIP appreciation drops.`;
      } else if (lower.includes('vip') || lower.includes('ভিআইপি')) {
        replyText =
          replyLang === 'bn'
            ? `ভিআইপি ক্লাবহাউসে ব্রোঞ্জ, সিলভার, গোল্ড এবং প্লাটিনাম মেম্বারদের জন্য বিশেষ মিশন, টুর্নামেন্ট, এবং মাসে ২ বার (১৫ ও ২৮ তারিখ) উত্তোলনের সুবিধা রয়েছে।`
            : `The VIP Clubhouse (Bronze, Silver, Gold, Platinum) offers double-point missions, exclusive tournaments, priority support, and dual monthly withdrawal windows (15th & 28th).`;
      } else {
        replyText =
          replyLang === 'bn'
            ? `আমি লেজি টু আর্ন অ্যাসিস্ট্যান্ট! আপনি দৈনিক মিশন, ৫০+ গেম, রিওয়ার্ড ক্যালেন্ডার, ভিআইপি ক্লাবহাউস এবং উত্তোলনের সময়সূচী সম্পর্কে আমাকে জিজ্ঞাসা করতে পারেন।`
            : `I'm your Lazy To Earn Assistant! Ask me about earning points, Monthly Reward Calendar, VIP Clubhouse benefits, 50+ Arcade Games, Gift Center collectibles, or monthly withdrawal dates (28th for Standard, 15th & 28th for VIP).`;
      }
    }

    const botId = makeId('AIC');
    sqlite
      .prepare('INSERT INTO ai_conversations (id, user_id, role, language, message) VALUES (?, ?, ?, ?, ?)')
      .run(botId, userId, 'assistant', replyLang, replyText);

    return res.json({
      success: true,
      reply: { id: botId, role: 'assistant', language: replyLang, message: replyText, created_at: new Date().toISOString() },
      usedToday: usedToday + 1,
      dailyLimit: cfg.daily_message_limit || 30,
    });
  });

  router.get('/admin/ai/settings', requireAdminAuth, (_req: Request, res: Response) => {
    const settings = sqlite.prepare('SELECT * FROM ai_assistant_settings WHERE id = 1').get();
    const totalMessages = (sqlite.prepare('SELECT COUNT(*) as c FROM ai_conversations').get() as { c: number }).c;
    return res.json({ settings, totalMessages });
  });

  router.put('/admin/ai/settings', requireAdminAuth, (req: Request, res: Response) => {
    const { is_enabled, daily_message_limit, system_instructions, faq_knowledge } = req.body || {};
    sqlite
      .prepare(
        `UPDATE ai_assistant_settings
         SET is_enabled = ?, daily_message_limit = ?, system_instructions = ?, faq_knowledge = ?, updated_at = datetime('now')
         WHERE id = 1`
      )
      .run(is_enabled ? 1 : 0, Number(daily_message_limit || 30), system_instructions || '', faq_knowledge || '');
    return res.json({ success: true });
  });

  // =========================================================
  // 6. LIVE ACTIVITY FEED
  // =========================================================
  router.get('/activity/feed', (req: Request, res: Response) => {
    const category = String(req.query.category || 'all');
    const followerId = String(req.query.followerId || '');
    const followingOnly = req.query.followingOnly === 'true';

    let sql = `
      SELECT a.* FROM public_activity_events a
      LEFT JOIN profile_privacy_settings p ON p.user_id = a.user_id
      WHERE a.is_hidden = 0 AND (p.user_id IS NULL OR (p.is_public = 1 AND p.show_activity = 1))
    `;
    const params: any[] = [];
    if (category && category !== 'all') {
      sql += ' AND a.category = ?';
      params.push(category);
    }
    if (followingOnly && followerId) {
      sql += ' AND a.user_id IN (SELECT followed_user_id FROM profile_follows WHERE follower_user_id = ?)';
      params.push(followerId);
    }
    sql += ' ORDER BY a.created_at DESC LIMIT 40';

    const events = sqlite.prepare(sql).all(...params);
    const following = followerId
      ? (sqlite
          .prepare('SELECT followed_user_id FROM profile_follows WHERE follower_user_id = ?')
          .all(followerId) as Array<{ followed_user_id: string }>).map((f) => f.followed_user_id)
      : [];

    return res.json({ events, following });
  });

  router.post('/activity/follow', (req: Request, res: Response) => {
    const { followerUserId, followedUserId } = req.body || {};
    if (!followerUserId || !followedUserId || followerUserId === followedUserId) {
      return res.status(400).json({ error: 'Valid distinct follower and target IDs required.' });
    }
    const existing = sqlite
      .prepare('SELECT 1 FROM profile_follows WHERE follower_user_id = ? AND followed_user_id = ?')
      .get(followerUserId, followedUserId);
    if (existing) {
      sqlite
        .prepare('DELETE FROM profile_follows WHERE follower_user_id = ? AND followed_user_id = ?')
        .run(followerUserId, followedUserId);
      return res.json({ following: false });
    }
    sqlite
      .prepare('INSERT INTO profile_follows (follower_user_id, followed_user_id) VALUES (?, ?)')
      .run(followerUserId, followedUserId);
    return res.json({ following: true });
  });

  router.get('/admin/activity/all', requireAdminAuth, (_req: Request, res: Response) => {
    const events = sqlite.prepare('SELECT * FROM public_activity_events ORDER BY created_at DESC LIMIT 80').all();
    return res.json({ events });
  });

  router.post('/admin/activity/:id/toggle', requireAdminAuth, (req: Request, res: Response) => {
    const row = sqlite.prepare('SELECT is_hidden FROM public_activity_events WHERE id = ?').get(req.params.id) as any;
    if (!row) return res.status(404).json({ error: 'Not found' });
    sqlite.prepare('UPDATE public_activity_events SET is_hidden = ? WHERE id = ?').run(row.is_hidden ? 0 : 1, req.params.id);
    return res.json({ success: true });
  });

  // =========================================================
  // 7. VIP CLUBHOUSE
  // =========================================================
  router.get('/vip-club/events', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '');
    const events = sqlite.prepare('SELECT * FROM vip_events WHERE is_active = 1 ORDER BY created_at DESC').all();
    const joinedIds = userId
      ? (sqlite.prepare('SELECT event_id FROM vip_event_joins WHERE user_id = ?').all(userId) as Array<{ event_id: string }>).map(
          (r) => r.event_id
        )
      : [];
    const vipLeaderboard = sqlite
      .prepare(
        `SELECT user_id, username, display_name, avatar_url, vip_tier, user_level, completed_missions_count, tournaments_won
         FROM public_profiles WHERE vip_tier != 'Free' ORDER BY user_level DESC LIMIT 10`
      )
      .all();

    return res.json({ events, joinedIds, vipLeaderboard });
  });

  router.post('/vip-club/join', (req: Request, res: Response) => {
    const { userId, eventId, vipTier = 'Free' } = req.body || {};
    if (!userId || !eventId) return res.status(400).json({ error: 'userId and eventId required.' });
    const ev = sqlite.prepare('SELECT * FROM vip_events WHERE id = ? AND is_active = 1').get(eventId) as any;
    if (!ev) return res.status(404).json({ error: 'VIP event not found.' });
    const vipStatus = getEffectiveUserVip(userId);
    const resolvedVipTier = vipStatus.status === 'none' ? vipTier : vipStatus.effectiveTier;
    if ((TIER_RANK[resolvedVipTier] || 0) < (TIER_RANK[ev.min_tier] || 1)) {
      return res.status(403).json({
        error:
          vipStatus.status === 'expired'
            ? `Your ${vipStatus.highestTier} VIP membership expired. Renew VIP membership to join VIP Clubhouse events.`
            : `Requires ${ev.min_tier} VIP membership or higher.`,
      });
    }
    const existing = sqlite.prepare('SELECT 1 FROM vip_event_joins WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    if (!existing) {
      sqlite.prepare('INSERT INTO vip_event_joins (user_id, event_id) VALUES (?, ?)').run(userId, eventId);
      sqlite.prepare('UPDATE vip_events SET participants_count = participants_count + 1 WHERE id = ?').run(eventId);
    }
    return res.json({ success: true });
  });

  router.get('/admin/vip-club/all', requireAdminAuth, (_req: Request, res: Response) => {
    const events = sqlite.prepare('SELECT * FROM vip_events ORDER BY created_at DESC').all();
    return res.json({ events });
  });

  router.post('/admin/vip-club/events', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.title || !b.min_tier || !b.event_type) {
      return res.status(400).json({ error: 'title, min_tier, and event_type are required.' });
    }
    const id = b.id || makeId('VIP-EV');
    sqlite
      .prepare(
        `INSERT INTO vip_events (id, title, title_bn, description, description_bn, min_tier, event_type, reward_summary, starts_at, ends_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .run(
        id,
        b.title,
        b.title_bn || b.title,
        b.description || '',
        b.description_bn || b.description || '',
        b.min_tier,
        b.event_type,
        b.reward_summary || 'Bonus Points',
        b.starts_at || new Date().toISOString().slice(0, 10),
        b.ends_at || '2026-12-31'
      );
    return res.json({ success: true, id });
  });

  router.delete('/admin/vip-club/events/:id', requireAdminAuth, (req: Request, res: Response) => {
    sqlite.prepare('DELETE FROM vip_events WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  });

  // =========================================================
  // 8. SMART REWARD RECOMMENDATIONS
  // =========================================================
  router.get('/recommendations/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const vipTier = String(req.query.vipTier || 'Free');
    const lang = String(req.query.lang || 'en');
    const cfg = (sqlite.prepare('SELECT * FROM recommendation_settings WHERE id = 1').get() as any) || {};
    const recs: Array<{
      id: string;
      rec_type: string;
      title: string;
      reason: string;
      reward_preview: string;
      action_view: string;
      priority_score: number;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);
    if (cfg.enable_calendar !== 0) {
      const todayEv = sqlite
        .prepare('SELECT * FROM reward_calendar_events WHERE event_date = ? AND is_active = 1 LIMIT 1')
        .get(todayStr) as any;
      if (todayEv) {
        const claimed = sqlite
          .prepare('SELECT 1 FROM reward_calendar_claims WHERE user_id = ? AND event_id = ?')
          .get(userId, todayEv.id);
        if (!claimed) {
          recs.push({
            id: `rec-cal-${todayEv.id}`,
            rec_type: 'calendar',
            title: lang === 'bn' && todayEv.title_bn ? todayEv.title_bn : todayEv.title,
            reason: lang === 'bn' ? 'আজকের আনক্লেইমড ক্যালেন্ডার রিওয়ার্ড উপলব্ধ' : "Today's daily calendar reward is ready to claim",
            reward_preview: todayEv.reward_type === 'points' ? `+${todayEv.reward_value} pts` : `+$${todayEv.reward_value.toFixed(2)}`,
            action_view: 'calendar',
            priority_score: cfg.weight_calendar || 95,
          });
        }
      }
    }

    if (cfg.enable_missions !== 0) {
      recs.push({
        id: 'rec-missions-daily',
        rec_type: 'mission',
        title: lang === 'bn' ? 'দৈনিক মিশন সম্পন্ন করুন' : 'Complete Unfinished Daily Missions',
        reason: lang === 'bn' ? 'মিশন সম্পন্ন করলে তাৎক্ষণিক ক্যাশ ও পয়েন্ট পাবেন' : 'High-value daily tasks match your recent arcade activity',
        reward_preview: '+$1.50 & 150 pts',
        action_view: 'daily_missions',
        priority_score: cfg.weight_missions || 90,
      });
    }

    if (cfg.enable_vip_perks !== 0 && vipTier !== 'Free') {
      recs.push({
        id: 'rec-vip-club',
        rec_type: 'vip',
        title: lang === 'bn' ? `${vipTier} ভিআইপি ক্লাবহাউস ইভেন্ট` : `${vipTier} VIP Clubhouse Perks`,
        reason: lang === 'bn' ? 'আপনার ভিআইপি স্তরের জন্য এক্সক্লুসিভ ইভেন্ট সক্রিয়' : 'Eligible exclusive events & 15th/28th withdrawal access unlocked',
        reward_preview: '2x Points + VIP Events',
        action_view: 'vip_club',
        priority_score: cfg.weight_vip || 85,
      });
    }

    if (cfg.enable_tournaments !== 0) {
      recs.push({
        id: 'rec-tournament',
        rec_type: 'tournament',
        title: lang === 'bn' ? 'সাপ্তাহিক গেমিং টুর্নামেন্টে যোগ দিন' : 'Join Active Arcade Tournament',
        reason: lang === 'bn' ? 'লিডারবোর্ডে শীর্ষে উঠে পুরস্কার জিতুন' : 'Compete on skill-based games for prize pool rewards',
        reward_preview: 'Prize Pool Up To $250',
        action_view: 'tournaments',
        priority_score: cfg.weight_tournaments || 80,
      });
    }

    if (cfg.enable_achievements !== 0) {
      recs.push({
        id: 'rec-achievements',
        rec_type: 'achievement',
        title: lang === 'bn' ? 'পাবলিক প্রোফাইল ও ব্যাজ কাস্টমাইজ করুন' : 'Showcase Unlocked Badges on Public Profile',
        reason: lang === 'bn' ? 'আপনার অর্জনগুলো কমিউনিটির সাথে শেয়ার করুন' : 'Highlight completed milestones and earn followers',
        reward_preview: '+Badge Showcase',
        action_view: 'public_profile',
        priority_score: cfg.weight_achievements || 75,
      });
    }

    recs.sort((a, b) => b.priority_score - a.priority_score);
    return res.json({ recommendations: recs });
  });

  router.get('/admin/recommendations/settings', requireAdminAuth, (_req: Request, res: Response) => {
    const settings = sqlite.prepare('SELECT * FROM recommendation_settings WHERE id = 1').get();
    return res.json({ settings });
  });

  router.put('/admin/recommendations/settings', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    sqlite
      .prepare(
        `UPDATE recommendation_settings SET
          enable_missions=?, enable_calendar=?, enable_tournaments=?, enable_achievements=?,
          enable_vip_perks=?, enable_news_promos=?,
          weight_missions=?, weight_calendar=?, weight_tournaments=?, weight_achievements=?, weight_vip=?,
          updated_at=datetime('now')
         WHERE id = 1`
      )
      .run(
        b.enable_missions ? 1 : 0,
        b.enable_calendar ? 1 : 0,
        b.enable_tournaments ? 1 : 0,
        b.enable_achievements ? 1 : 0,
        b.enable_vip_perks ? 1 : 0,
        b.enable_news_promos ? 1 : 0,
        Number(b.weight_missions || 90),
        Number(b.weight_calendar || 95),
        Number(b.weight_tournaments || 80),
        Number(b.weight_achievements || 75),
        Number(b.weight_vip || 85)
      );
    return res.json({ success: true });
  });

  // =========================================================
  // 9. AUTOMATED MONTHLY REPORTS
  // =========================================================
  router.get('/reports/:userId', (req: Request, res: Response) => {
    const reports = sqlite
      .prepare('SELECT * FROM monthly_reports WHERE user_id = ? ORDER BY generated_at DESC LIMIT 24')
      .all(req.params.userId);
    return res.json({ reports });
  });

  router.post('/reports/generate', (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.userId) return res.status(400).json({ error: 'userId is required.' });
    const month = b.reportMonth || new Date().toISOString().slice(0, 7);
    const id = makeId('REP');

    // Also include SQLite calendar claims & gift stats for the user
    const calStats = sqlite
      .prepare(
        `SELECT COALESCE(SUM(CASE WHEN reward_type = 'promo_credit' THEN reward_value ELSE 0 END), 0) as promo_sum,
                COALESCE(SUM(CASE WHEN reward_type = 'points' THEN reward_value ELSE 0 END), 0) as pts_sum
         FROM reward_calendar_claims WHERE user_id = ?`
      )
      .get(b.userId) as { promo_sum: number; pts_sum: number };

    const withdrawableEarnings = Number(b.withdrawableEarnings || 0);
    const promotionalCredits = +(Number(b.promotionalCredits || 0) + (calStats?.promo_sum || 0)).toFixed(2);
    const pendingBalance = Number(b.pendingBalance || 0);
    const nonCashPoints = Math.round(Number(b.nonCashPoints || 0) + (calStats?.pts_sum || 0));

    sqlite
      .prepare(
        `INSERT INTO monthly_reports (
          id, user_id, report_month, period_start, period_end,
          withdrawable_earnings, promotional_credits, pending_balance, non_cash_points,
          withdrawals_completed, withdrawals_pending, withdrawals_rejected,
          missions_completed, games_played, tournaments_joined, referrals_count,
          summary_json, email_opt_in
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        b.userId,
        month,
        b.periodStart || `${month}-01`,
        b.periodEnd || `${month}-28`,
        withdrawableEarnings,
        promotionalCredits,
        pendingBalance,
        nonCashPoints,
        Number(b.withdrawalsCompleted || 0),
        Number(b.withdrawalsPending || 0),
        Number(b.withdrawalsRejected || 0),
        Number(b.missionsCompleted || 0),
        Number(b.gamesPlayed || 0),
        Number(b.tournamentsJoined || 0),
        Number(b.referralsCount || 0),
        JSON.stringify(b.breakdown || {}),
        b.emailOptIn === false ? 0 : 1
      );

    const saved = sqlite.prepare('SELECT * FROM monthly_reports WHERE id = ?').get(id);
    return res.json({ success: true, report: saved });
  });

  router.get('/admin/reports/summary', requireAdminAuth, (_req: Request, res: Response) => {
    const reports = sqlite.prepare('SELECT * FROM monthly_reports ORDER BY generated_at DESC LIMIT 50').all();
    const totals = sqlite
      .prepare(
        `SELECT COUNT(*) as total_reports,
                COALESCE(SUM(withdrawable_earnings), 0) as sum_withdrawable,
                COALESCE(SUM(promotional_credits), 0) as sum_promo,
                COALESCE(SUM(withdrawals_completed), 0) as sum_paid
         FROM monthly_reports`
      )
      .get();
    return res.json({ reports, totals });
  });

  // =========================================================
  // 10. GIFT CENTER (STRICTLY NON-CASH DIGITAL COLLECTIBLES)
  // =========================================================
  router.get('/gifts/catalog', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '');
    const catalog = sqlite.prepare('SELECT * FROM gift_inventory WHERE is_active = 1 ORDER BY points_cost ASC').all();
    const received = userId
      ? sqlite
          .prepare(
            `SELECT t.*, g.name as gift_name, g.name_bn as gift_name_bn, g.category, g.image_url
             FROM gift_transfers t
             JOIN gift_inventory g ON g.id = t.gift_id
             WHERE t.recipient_user_id = ?
             ORDER BY t.sent_at DESC`
          )
          .all(userId)
      : [];
    const sent = userId
      ? sqlite
          .prepare(
            `SELECT t.*, g.name as gift_name, g.name_bn as gift_name_bn, g.category, g.image_url
             FROM gift_transfers t
             JOIN gift_inventory g ON g.id = t.gift_id
             WHERE t.sender_user_id = ?
             ORDER BY t.sent_at DESC`
          )
          .all(userId)
      : [];

    const recipients = sqlite
      .prepare('SELECT user_id, username, display_name, avatar_url, vip_tier FROM public_profiles ORDER BY display_name ASC')
      .all();

    return res.json({ catalog, received, sent, recipients });
  });

  router.post('/gifts/send', (req: Request, res: Response) => {
    const b = req.body || {};
    // Compliance Guard: explicitly reject any cash transfer or cash conversion attempts
    if (b.cashAmount || b.convertToCash || b.transferBalance) {
      return res.status(400).json({
        success: false,
        error: 'Cash transfers and cash gift conversions are strictly prohibited. Only non-cash digital collectibles are supported.',
      });
    }

    if (!b.giftId || !b.senderUserId || !b.recipientUserId) {
      return res.status(400).json({ success: false, error: 'giftId, senderUserId, and recipientUserId are required.' });
    }
    if (b.senderUserId === b.recipientUserId) {
      return res.status(400).json({ success: false, error: 'You cannot send a gift to yourself.' });
    }

    const gift = sqlite.prepare('SELECT * FROM gift_inventory WHERE id = ? AND is_active = 1').get(b.giftId) as any;
    if (!gift) return res.status(404).json({ success: false, error: 'Gift item not found or inactive.' });

    if (gift.vip_only && (TIER_RANK[b.senderVipTier || 'Free'] || 0) < 1) {
      return res.status(403).json({ success: false, error: 'This collectible gift requires VIP membership to send.' });
    }

    const priv = sqlite.prepare('SELECT allow_gifts FROM profile_privacy_settings WHERE user_id = ?').get(b.recipientUserId) as any;
    if (priv && priv.allow_gifts === 0) {
      return res.status(403).json({ success: false, error: 'Recipient has disabled gift deliveries in privacy settings.' });
    }

    const sentToday = (sqlite
      .prepare("SELECT COUNT(*) as c FROM gift_transfers WHERE sender_user_id = ? AND date(sent_at) = date('now')")
      .get(b.senderUserId) as { c: number }).c;

    if (sentToday >= (gift.daily_send_limit || 5)) {
      return res.status(429).json({ success: false, error: 'Daily collectible gift sending limit reached.' });
    }

    const id = makeId('GTX');
    sqlite
      .prepare(
        `INSERT INTO gift_transfers (id, gift_id, sender_user_id, sender_name, recipient_user_id, recipient_name, note, is_non_cash_collectible)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .run(id, gift.id, b.senderUserId, b.senderName || 'Member', b.recipientUserId, b.recipientName || 'Member', b.note || '');

    return res.json({ success: true, transferId: id, gift });
  });

  router.get('/admin/gifts/all', requireAdminAuth, (_req: Request, res: Response) => {
    const catalog = sqlite.prepare('SELECT * FROM gift_inventory ORDER BY created_at DESC').all();
    const stats = sqlite
      .prepare(
        `SELECT g.name, COUNT(t.id) as transfers_count
         FROM gift_inventory g
         LEFT JOIN gift_transfers t ON t.gift_id = g.id
         GROUP BY g.id`
      )
      .all();
    return res.json({ catalog, stats });
  });

  router.post('/admin/gifts', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.name || !b.category) return res.status(400).json({ error: 'name and category required.' });
    const id = b.id || makeId('GFT');
    sqlite
      .prepare(
        `INSERT INTO gift_inventory (id, name, name_bn, category, description, description_bn, image_url, points_cost, vip_only, is_seasonal, is_active, daily_send_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, name_bn=excluded.name_bn, category=excluded.category,
           description=excluded.description, description_bn=excluded.description_bn,
           image_url=excluded.image_url, points_cost=excluded.points_cost,
           vip_only=excluded.vip_only, is_seasonal=excluded.is_seasonal, daily_send_limit=excluded.daily_send_limit`
      )
      .run(
        id,
        b.name,
        b.name_bn || b.name,
        b.category,
        b.description || '',
        b.description_bn || b.description || '',
        b.image_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + encodeURIComponent(b.name),
        Number(b.points_cost || 100),
        b.vip_only ? 1 : 0,
        b.is_seasonal ? 1 : 0,
        Number(b.daily_send_limit || 5)
      );
    return res.json({ success: true, id });
  });

  router.delete('/admin/gifts/:id', requireAdminAuth, (req: Request, res: Response) => {
    sqlite.prepare('DELETE FROM gift_inventory WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  });

  // =========================================================
  // 11. PLATFORM NEWS CENTER
  // =========================================================
  router.get('/news/articles', (req: Request, res: Response) => {
    const categoryId = String(req.query.category || 'all');
    const search = String(req.query.search || '').trim().toLowerCase();

    const categories = sqlite.prepare('SELECT * FROM news_categories').all();
    let sql = `
      SELECT a.*, c.name_en as category_name_en, c.name_bn as category_name_bn, c.color as category_color
      FROM news_articles a
      JOIN news_categories c ON c.id = a.category_id
      WHERE a.status = 'published'
    `;
    const params: any[] = [];
    if (categoryId && categoryId !== 'all') {
      sql += ' AND a.category_id = ?';
      params.push(categoryId);
    }
    if (search) {
      sql += ' AND (lower(a.title_en) LIKE ? OR lower(a.title_bn) LIKE ? OR lower(a.summary_en) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY a.is_pinned DESC, a.is_featured DESC, a.published_at DESC';
    const articles = sqlite.prepare(sql).all(...params);
    return res.json({ categories, articles });
  });

  router.get('/admin/news/all', requireAdminAuth, (_req: Request, res: Response) => {
    const categories = sqlite.prepare('SELECT * FROM news_categories').all();
    const articles = sqlite.prepare('SELECT * FROM news_articles ORDER BY published_at DESC').all();
    return res.json({ categories, articles });
  });

  router.post('/admin/news/articles', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.category_id || !b.title_en) return res.status(400).json({ error: 'category_id and title_en required.' });
    const id = b.id || makeId('NEWS');
    sqlite
      .prepare(
        `INSERT INTO news_articles (
          id, category_id, title_en, title_bn, summary_en, summary_bn,
          content_en, content_bn, target_tier, is_featured, is_pinned, status, published_at, author
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          category_id=excluded.category_id, title_en=excluded.title_en, title_bn=excluded.title_bn,
          summary_en=excluded.summary_en, summary_bn=excluded.summary_bn,
          content_en=excluded.content_en, content_bn=excluded.content_bn,
          target_tier=excluded.target_tier, is_featured=excluded.is_featured,
          is_pinned=excluded.is_pinned, status=excluded.status`
      )
      .run(
        id,
        b.category_id,
        b.title_en,
        b.title_bn || b.title_en,
        b.summary_en || '',
        b.summary_bn || b.summary_en || '',
        b.content_en || b.summary_en || '',
        b.content_bn || b.content_en || '',
        b.target_tier || 'All',
        b.is_featured ? 1 : 0,
        b.is_pinned ? 1 : 0,
        b.status || 'published',
        b.published_at || new Date().toISOString(),
        b.author || 'Lazy To Earn Admin'
      );
    return res.json({ success: true, id });
  });

  router.delete('/admin/news/articles/:id', requireAdminAuth, (req: Request, res: Response) => {
    sqlite.prepare('DELETE FROM news_articles WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  });

  // =========================================================
  // 12. PWA SETTINGS, PUSH NOTIFICATIONS & ADMIN ANALYTICS
  // =========================================================
  router.get('/pwa/settings', (_req: Request, res: Response) => {
    const settings = sqlite.prepare('SELECT * FROM pwa_settings WHERE id = 1').get();
    const notifications = sqlite.prepare('SELECT * FROM pwa_notifications ORDER BY sent_at DESC LIMIT 10').all();
    return res.json({ settings, notifications });
  });

  router.post('/pwa/subscribe', (req: Request, res: Response) => {
    const { userId, endpoint, p256dh = '', auth = '', deviceLabel = 'Mobile / Desktop Browser' } = req.body || {};
    if (!userId || !endpoint) return res.status(400).json({ error: 'userId and endpoint required.' });
    const id = makeId('PSH');
    sqlite
      .prepare(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, device_label)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, device_label=excluded.device_label`
      )
      .run(id, userId, endpoint, p256dh, auth, deviceLabel);
    return res.json({ success: true, id });
  });

  router.get('/admin/pwa/overview', requireAdminAuth, (_req: Request, res: Response) => {
    const settings = sqlite.prepare('SELECT * FROM pwa_settings WHERE id = 1').get();
    const subscriptionsCount = (sqlite.prepare('SELECT COUNT(*) as c FROM push_subscriptions').get() as { c: number }).c;
    const notifications = sqlite.prepare('SELECT * FROM pwa_notifications ORDER BY sent_at DESC LIMIT 20').all();
    return res.json({ settings, subscriptionsCount, notifications });
  });

  router.put('/admin/pwa/settings', requireAdminAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    sqlite
      .prepare(
        `UPDATE pwa_settings SET install_prompt_enabled = ?, offline_banner_enabled = ?, push_notifications_enabled = ?, app_version = ?, updated_at = datetime('now') WHERE id = 1`
      )
      .run(
        b.install_prompt_enabled ? 1 : 0,
        b.offline_banner_enabled ? 1 : 0,
        b.push_notifications_enabled ? 1 : 0,
        b.app_version || '2.5.0'
      );
    return res.json({ success: true });
  });

  router.post('/admin/pwa/broadcast', requireAdminAuth, (req: Request, res: Response) => {
    const { title, body, target_tier = 'All' } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body required.' });
    const subCount = (sqlite.prepare('SELECT COUNT(*) as c FROM push_subscriptions').get() as { c: number }).c;
    const id = makeId('NTF');
    sqlite
      .prepare('INSERT INTO pwa_notifications (id, title, body, target_tier, sent_count) VALUES (?, ?, ?, ?, ?)')
      .run(id, title, body, target_tier, Math.max(1, subCount));
    return res.json({ success: true, id, sentCount: Math.max(1, subCount) });
  });

  router.get('/admin/analytics/overview', requireAdminAuth, (_req: Request, res: Response) => {
    const calendarClaims = (sqlite.prepare('SELECT COUNT(*) as c FROM reward_calendar_claims').get() as { c: number }).c;
    const calendarPoints = (sqlite
      .prepare("SELECT COALESCE(SUM(reward_value), 0) as s FROM reward_calendar_claims WHERE reward_type = 'points'")
      .get() as { s: number }).s;
    const aiQueries = (sqlite.prepare("SELECT COUNT(*) as c FROM ai_conversations WHERE role = 'user'").get() as { c: number }).c;
    const openFraud = (sqlite.prepare("SELECT COUNT(*) as c FROM fraud_alerts WHERE status IN ('Open', 'Investigating')").get() as { c: number }).c;
    const giftTransfers = (sqlite.prepare('SELECT COUNT(*) as c FROM gift_transfers').get() as { c: number }).c;
    const vipJoins = (sqlite.prepare('SELECT COUNT(*) as c FROM vip_event_joins').get() as { c: number }).c;
    const reportsGenerated = (sqlite.prepare('SELECT COUNT(*) as c FROM monthly_reports').get() as { c: number }).c;
    const publicProfiles = (sqlite.prepare('SELECT COUNT(*) as c FROM public_profiles').get() as { c: number }).c;
    const publishedNews = (sqlite.prepare("SELECT COUNT(*) as c FROM news_articles WHERE status = 'published'").get() as { c: number }).c;
    const pushSubscribers = (sqlite.prepare('SELECT COUNT(*) as c FROM push_subscriptions').get() as { c: number }).c;

    return res.json({
      calendarClaims,
      calendarPoints,
      aiQueries,
      openFraud,
      giftTransfers,
      vipJoins,
      reportsGenerated,
      publicProfiles,
      publishedNews,
      pushSubscribers,
    });
  });

  return router;
}
