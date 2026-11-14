import React, { useEffect, useState } from 'react';
import {
  Crown,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Save,
  RefreshCw,
  History,
  Users,
  Gift,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VIPTierConfig, VIPTierLevel, VIPSystemSettings } from '../../types';

const TIER_ORDER: VIPTierLevel[] = ['Free', 'Bronze', 'Silver', 'Gold', 'Platinum'];

export const AdminVipManager: React.FC = () => {
  const { allUsers, addToast, refreshVipStatus } = useApp();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const [settings, setSettings] = useState<VIPSystemSettings>({
    validityDays: 30,
    allowUpgrades: true,
    allowRenewal: true,
    allowUpgradeWhileExpired: true,
    autoChargeEnabled: false,
  });

  const [tiers, setTiers] = useState<Record<string, VIPTierConfig>>({});
  const [perksText, setPerksText] = useState<Record<string, string>>({});
  const [memberships, setMemberships] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const [grantUserId, setGrantUserId] = useState<string>(allUsers[0]?.id || 'LTE-782910');
  const [grantTier, setGrantTier] = useState<VIPTierLevel>('Gold');
  const [grantDays, setGrantDays] = useState<number>(30);

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('lte_admin_token') || '';
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  };

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/vip/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.tiers) {
          setTiers(data.tiers);
          const textMap: Record<string, string> = {};
          Object.entries(data.tiers).forEach(([k, v]: [string, any]) => {
            textMap[k] = Array.isArray(v.perks) ? v.perks.join('\n') : '';
          });
          setPerksText(textMap);
        }
        setMemberships(data.memberships || []);
        setHistory(data.history || []);
      }
    } catch {
      addToast('Load Failed', 'Could not load VIP manager settings from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await adminFetch('/api/admin/vip/settings', {
        method: 'PUT',
        body: JSON.stringify({
          validityDays: Number(settings.validityDays) || 30,
          allowUpgrades: settings.allowUpgrades,
          allowRenewal: settings.allowRenewal,
          allowUpgradeWhileExpired: settings.allowUpgradeWhileExpired,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Save Failed', data.error || 'Unable to update VIP settings.', 'error');
        return;
      }
      if (data.settings) setSettings(data.settings);
      await refreshVipStatus();
      addToast('VIP Rules Updated', 'Validity, renewal, and upgrade rules saved.', 'success');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTierFieldChange = (tierKey: VIPTierLevel, field: keyof VIPTierConfig, value: string | number) => {
    setTiers((prev) => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        [field]: value,
      },
    }));
  };

  const handleSaveTier = async (tierKey: VIPTierLevel) => {
    const cfg = tiers[tierKey];
    if (!cfg) return;
    setSavingTier(tierKey);
    try {
      const perks = (perksText[tierKey] || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !/min.*withdraw|min.*payout/i.test(line));

      const res = await adminFetch(`/api/admin/vip/tiers/${encodeURIComponent(tierKey)}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: cfg.name,
          priceMonthly: Number(cfg.priceMonthly) || 0,
          multiplier: Number(cfg.multiplier) || 1,
          dailyFreeSpins: Number(cfg.dailyFreeSpins) || 1,
          dailyFreeScratches: Number(cfg.dailyFreeScratches) || 1,
          referralBonus: Number(cfg.referralBonus) || 10,
          payoutSpeed: cfg.payoutSpeed,
          perks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Update Failed', data.error || `Failed to save ${tierKey} VIP.`, 'error');
        return;
      }
      if (data.tiers) {
        setTiers(data.tiers);
        setPerksText((prev) => ({
          ...prev,
          [tierKey]: Array.isArray(data.tiers[tierKey]?.perks) ? data.tiers[tierKey].perks.join('\n') : '',
        }));
      }
      await refreshVipStatus();
      addToast('VIP Tier Updated', `${cfg.name} pricing and privileges saved.`, 'success');
    } finally {
      setSavingTier(null);
    }
  };

  const handleAdminGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId.trim()) return;
    setGranting(true);
    try {
      const res = await adminFetch('/api/admin/vip/grant', {
        method: 'POST',
        body: JSON.stringify({
          userId: grantUserId.trim(),
          targetTier: grantTier,
          validityDays: Number(grantDays) || settings.validityDays || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast('Grant Failed', data.error || 'Could not grant VIP membership.', 'error');
        return;
      }
      addToast('VIP Granted', `${grantTier} VIP activated for ${grantUserId} (${grantDays} days).`, 'success');
      await loadOverview();
      await refreshVipStatus();
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-amber-950/30 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-mono font-bold uppercase">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>VIP Membership Policy &amp; Pricing Controller</span>
          </div>
          <h2 className="text-lg font-extrabold text-white">
            30-Day Validity, Upgrade Rules &amp; Tier Benefits
          </h2>
          <p className="text-xs text-slate-400">
            Configure VIP prices, validity period, manual renewal/upgrade rules, and tier perks. Downgrades &amp; auto-charges stay strictly disabled.
          </p>
        </div>

        <button
          onClick={loadOverview}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 1. Global Validity, Renewal & Upgrade Rules */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Validity Period, Renewal &amp; Upgrade Rules</span>
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auto-Charge: OFF</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Downgrades: Blocked</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              VIP Validity Duration (Days)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.validityDays}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, validityDays: Math.max(1, Number(e.target.value) || 30) }))
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm"
            />
            <span className="text-[10px] text-slate-500 block">Default: 30 days after verified payment</span>
          </div>

          <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowRenewal}
              onChange={(e) => setSettings((prev) => ({ ...prev, allowRenewal: e.target.checked }))}
              className="mt-1 accent-amber-500"
            />
            <div>
              <div className="text-xs font-bold text-white">Allow Manual Renewal</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Users can manually renew their current tier (or extend active days).
              </div>
            </div>
          </label>

          <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowUpgrades}
              onChange={(e) => setSettings((prev) => ({ ...prev, allowUpgrades: e.target.checked }))}
              className="mt-1 accent-amber-500"
            />
            <div>
              <div className="text-xs font-bold text-white">Allow Tier Upgrades</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Users can upgrade to higher tiers than their lifetime floor.
              </div>
            </div>
          </label>

          <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowUpgradeWhileExpired}
              onChange={(e) => setSettings((prev) => ({ ...prev, allowUpgradeWhileExpired: e.target.checked }))}
              className="mt-1 accent-amber-500"
            />
            <div>
              <div className="text-xs font-bold text-white">Upgrade After Expiry</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Allow expired VIPs to upgrade directly to a higher tier.
              </div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Downgrades and automatic recurring charges remain locked off system-wide.</span>
          </div>
          <button
            type="submit"
            disabled={savingSettings}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSettings ? 'Saving...' : 'Save VIP Policy'}</span>
          </button>
        </div>
      </form>

      {/* 2. VIP Tier Pricing & Benefits Editor (No Min Withdrawal Benefit) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span>VIP Plans: Prices &amp; Benefits Configuration</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Minimum withdrawal amount is excluded from all VIP plans and comparisons; standard platform cashout threshold applies uniformly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TIER_ORDER.map((tierKey) => {
            const cfg = tiers[tierKey];
            if (!cfg) return null;
            return (
              <div key={tierKey} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${cfg.badgeColor}`}>
                      {tierKey}
                    </span>
                    <input
                      type="text"
                      value={cfg.name}
                      onChange={(e) => handleTierFieldChange(tierKey, 'name', e.target.value)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-bold text-white"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingTier === tierKey}
                    onClick={() => handleSaveTier(tierKey)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{savingTier === tierKey ? 'Saving...' : 'Save Tier'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Price (30 Days USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={tierKey === 'Free'}
                      value={cfg.priceMonthly}
                      onChange={(e) => handleTierFieldChange(tierKey, 'priceMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Earning Multiplier</label>
                    <input
                      type="number"
                      step="0.05"
                      min={1}
                      value={cfg.multiplier}
                      onChange={(e) => handleTierFieldChange(tierKey, 'multiplier', parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Referral Bonus ($)</label>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={cfg.referralBonus}
                      onChange={(e) => handleTierFieldChange(tierKey, 'referralBonus', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Daily Free Spins</label>
                    <input
                      type="number"
                      min={0}
                      value={cfg.dailyFreeSpins}
                      onChange={(e) => handleTierFieldChange(tierKey, 'dailyFreeSpins', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Daily Scratches</label>
                    <input
                      type="number"
                      min={0}
                      value={cfg.dailyFreeScratches}
                      onChange={(e) => handleTierFieldChange(tierKey, 'dailyFreeScratches', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Payout SLA</label>
                    <input
                      type="text"
                      value={cfg.payoutSpeed}
                      onChange={(e) => handleTierFieldChange(tierKey, 'payoutSpeed', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    VIP Benefit Perks (one per line — minimum withdrawal notes excluded)
                  </label>
                  <textarea
                    rows={3}
                    value={perksText[tierKey] || ''}
                    onChange={(e) => setPerksText((prev) => ({ ...prev, [tierKey]: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 font-sans"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Admin VIP Grant */}
      <form onSubmit={handleAdminGrant} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>Grant / Activate Verified VIP Pass</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Target Member ID</label>
            <input
              type="text"
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
              placeholder="LTE-782910"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">VIP Tier</label>
            <select
              value={grantTier}
              onChange={(e) => setGrantTier(e.target.value as VIPTierLevel)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
            >
              <option value="Bronze">Bronze VIP</option>
              <option value="Silver">Silver VIP</option>
              <option value="Gold">Gold VIP</option>
              <option value="Platinum">Platinum VIP</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={grantDays}
              onChange={(e) => setGrantDays(Math.max(1, Number(e.target.value) || 30))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
            />
          </div>
          <button
            type="submit"
            disabled={granting}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer disabled:opacity-50"
          >
            {granting ? 'Activating...' : 'Activate VIP Pass'}
          </button>
        </div>
      </form>

      {/* 4. Member VIP Statuses & Permanent Purchase/Upgrade History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Tracked Member Subscriptions ({memberships.length})</span>
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {memberships.length === 0 ? (
              <p className="text-xs text-slate-500">No tracked server VIP subscriptions yet.</p>
            ) : (
              memberships.map((m) => (
                <div key={m.userId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-white font-bold">{m.userId}</div>
                    <div className="text-[10px] text-slate-400">
                      Effective: <strong className="text-purple-300">{m.effectiveTier}</strong> · Floor: <strong className="text-amber-300">{m.highestTier}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : m.status === 'expired'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {String(m.status).toUpperCase()}
                    </span>
                    {m.expiresAt && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(m.expiresAt).toISOString().slice(0, 10)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>Permanent VIP Purchase &amp; Upgrade Ledger ({history.length})</span>
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No permanent VIP purchase logs yet.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    <div className="text-white font-bold">
                      {h.user_id} · {String(h.action_type).toUpperCase()} ({h.from_tier} → {h.to_tier})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Ref: {h.payment_reference} · {h.validity_days}d · Status: {h.status}
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-emerald-400 font-bold">
                    ${Number(h.amount_paid || 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
