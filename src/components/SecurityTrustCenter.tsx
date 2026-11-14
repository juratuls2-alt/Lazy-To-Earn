import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  LogOut,
  Lock,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SecurityTrustCenter: React.FC = () => {
  const { user, t, addToast } = useApp();
  const [settings, setSettings] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [twoFaCode, setTwoFaCode] = useState('123456');
  const [newDeviceLabel, setNewDeviceLabel] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/security/overview/${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setLoginHistory(data.loginHistory || []);
        setTrustedDevices(data.trustedDevices || []);
        setIncidents(data.incidents || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [user?.id]);

  if (!user) return null;

  const handleToggle2FA = async () => {
    const nextEnabled = !(settings?.two_factor_enabled === 1);
    const res = await fetch('/api/security/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        enabled: nextEnabled,
        method: settings?.two_factor_method || 'authenticator',
        verificationCode: nextEnabled ? twoFaCode : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast('2FA Verification Failed', data.error || 'Enter a valid 6-digit code.', 'error');
      return;
    }
    addToast(
      nextEnabled ? '2FA Enabled' : '2FA Disabled',
      nextEnabled ? 'Two-factor protection is now active.' : 'Two-factor protection turned off.',
      nextEnabled ? 'success' : 'info'
    );
    await loadOverview();
  };

  const handleTrustDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceLabel.trim()) return;
    const res = await fetch('/api/security/devices/trust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        deviceLabel: newDeviceLabel.trim(),
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome Browser' : 'Web Browser',
      }),
    });
    if (res.ok) {
      setNewDeviceLabel('');
      addToast('Trusted Device Added', 'Device fingerprint registered safely.', 'success');
      await loadOverview();
    }
  };

  const handleRemoveDevice = async (id: string) => {
    await fetch(`/api/security/devices/${encodeURIComponent(id)}`, { method: 'DELETE' });
    addToast('Device Removed', 'Device removed from trusted list.', 'info');
    await loadOverview();
  };

  const handleRevokeSession = async (sessionId?: string, revokeAll = false) => {
    await fetch('/api/security/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, sessionId, revokeAll }),
    });
    addToast('Sessions Updated', revokeAll ? 'All other active sessions terminated.' : 'Session revoked.', 'success');
    await loadOverview();
  };

  const securityScore =
    (user.emailVerified ? 35 : 0) +
    (settings?.two_factor_enabled ? 40 : 0) +
    (trustedDevices.length > 0 ? 15 : 0) +
    (settings?.withdrawal_extra_verification ? 10 : 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Trust Account Protection</span>
          </div>
          <h1 className="text-2xl font-black text-white">{t('security.title')}</h1>
          <p className="text-xs text-slate-400">{t('security.subtitle')}</p>
        </div>

        <div className="px-5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Trust Score</span>
          <span className="text-2xl font-black font-mono text-emerald-400">{securityScore}%</span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">{t('common.loading')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2FA & Verification Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Two-Factor Authentication (2FA)</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  settings?.two_factor_enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                }`}
              >
                {settings?.two_factor_enabled ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Authenticator Setup Key</span>
                <span className="font-mono text-amber-300 font-bold">{settings?.two_factor_secret}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Verification Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified ({user.email})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Suspicious Withdrawal Verification</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {!settings?.two_factor_enabled && (
                <input
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  maxLength={6}
                  placeholder="6-digit code"
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono w-36"
                />
              )}
              <button
                onClick={handleToggle2FA}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  settings?.two_factor_enabled
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500/25'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {settings?.two_factor_enabled ? 'Disable 2FA' : 'Verify & Enable 2FA'}
              </button>
            </div>
          </div>

          {/* Trusted Devices */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>Trusted Devices</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trustedDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{dev.device_label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {dev.browser} · {dev.device_fingerprint}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(dev.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Remove Trusted Device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleTrustDevice} className="flex gap-2">
              <input
                value={newDeviceLabel}
                onChange={(e) => setNewDeviceLabel(e.target.value)}
                placeholder="Register current device label..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Trust</span>
              </button>
            </form>
          </div>

          {/* Active Sessions & Login History */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Login History &amp; Active Sessions</span>
              </h3>
              <button
                onClick={() => handleRevokeSession(undefined, true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Revoke All Other Sessions</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">Device / Browser</th>
                    <th className="py-2.5 px-3">IP &amp; Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 text-right">Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {loginHistory.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{log.device_name}</div>
                        <div className="text-[10px] text-slate-400">{log.browser}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {log.ip_address} · {log.location}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            log.status === 'Success'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {log.revoked ? 'Revoked' : log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{log.created_at}</td>
                      <td className="py-2.5 px-3 text-right">
                        {log.is_current_session ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">CURRENT</span>
                        ) : !log.revoked ? (
                          <button
                            onClick={() => handleRevokeSession(log.id)}
                            className="text-rose-400 hover:underline font-bold cursor-pointer"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Alerts & Incident Log */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Security Alerts &amp; Notifications</span>
            </h3>
            <div className="space-y-2">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{inc.incident_type}</div>
                    <div className="text-slate-400 text-[11px]">{inc.description}</div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{inc.created_at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
