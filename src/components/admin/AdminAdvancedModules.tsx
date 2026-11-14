import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Languages,
  Award,
  ShieldAlert,
  Bot,
  Activity,
  Crown,
  Sparkles,
  FileSpreadsheet,
  Gift,
  Newspaper,
  Smartphone,
  BarChart3,
  Plus,
  Trash2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

type SubModule =
  | 'analytics'
  | 'calendar'
  | 'i18n'
  | 'profiles'
  | 'security'
  | 'ai'
  | 'activity'
  | 'vip_club'
  | 'recommendations'
  | 'reports'
  | 'gifts'
  | 'news'
  | 'pwa';

export const AdminAdvancedModules: React.FC<{ initialModule?: SubModule }> = ({ initialModule = 'analytics' }) => {
  const { addToast, refreshTranslations } = useApp();
  const [module, setModule] = useState<SubModule>(initialModule);
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Form states
  const [calForm, setCalForm] = useState({
    event_date: new Date().toISOString().slice(0, 10),
    title: '',
    title_bn: '',
    description: '',
    event_type: 'special_event',
    reward_type: 'points',
    reward_value: 150,
    vip_only: false,
    required_tier: 'Bronze',
  });
  const [trForm, setTrForm] = useState({ key: '', language_code: 'bn', language_name: 'বাংলা', category: 'general', text_value: '' });
  const [newLang, setNewLang] = useState({ language_code: '', language_name: '' });
  const [vipForm, setVipForm] = useState({ title: '', title_bn: '', description: '', min_tier: 'Bronze', event_type: 'mission', reward_summary: '2x Points' });
  const [giftForm, setGiftForm] = useState({ name: '', name_bn: '', category: 'profile_frame', description: '', points_cost: 150, vip_only: false, is_seasonal: false });
  const [newsForm, setNewsForm] = useState({ category_id: 'cat-platform', title_en: '', title_bn: '', summary_en: '', content_en: '', is_featured: true, is_pinned: false });
  const [pushForm, setPushForm] = useState({ title: '', body: '', target_tier: 'All' });

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('lte_admin_token') || '';
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    return res;
  };

  const loadModule = async (mod: SubModule) => {
    setLoading(true);
    try {
      const endpointMap: Record<SubModule, string> = {
        analytics: '/api/admin/analytics/overview',
        calendar: '/api/admin/calendar/all',
        i18n: '/api/i18n/strings',
        profiles: '/api/admin/profiles/moderation',
        security: '/api/admin/security/center',
        ai: '/api/admin/ai/settings',
        activity: '/api/admin/activity/all',
        vip_club: '/api/admin/vip-club/all',
        recommendations: '/api/admin/recommendations/settings',
        reports: '/api/admin/reports/summary',
        gifts: '/api/admin/gifts/all',
        news: '/api/admin/news/all',
        pwa: '/api/admin/pwa/overview',
      };
      const res = await adminFetch(endpointMap[mod]);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModule(module);
  }, [module]);

  const modules: Array<{ id: SubModule; label: string; icon: any }> = [
    { id: 'analytics', label: 'Analytics Hub', icon: BarChart3 },
    { id: 'calendar', label: 'Reward Calendar', icon: CalendarDays },
    { id: 'i18n', label: 'Translations', icon: Languages },
    { id: 'profiles', label: 'Public Profiles', icon: Award },
    { id: 'security', label: 'Security & Fraud', icon: ShieldAlert },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
    { id: 'vip_club', label: 'VIP Clubhouse', icon: Crown },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
    { id: 'reports', label: 'Monthly Reports', icon: FileSpreadsheet },
    { id: 'gifts', label: 'Gift Center', icon: Gift },
    { id: 'news', label: 'News Center', icon: Newspaper },
    { id: 'pwa', label: 'PWA & Push', icon: Smartphone },
  ];

  const exportSecurityReport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LazyToEarn_Security_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Security Report Exported', 'Downloaded audit & fraud telemetry.', 'success');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Module Switcher Pills */}
      <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-slate-900 border border-slate-800">
        {modules.map((m) => {
          const Icon = m.icon;
          const active = module === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setModule(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                active ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          Loading module telemetry...
        </div>
      ) : (
        <>
          {/* 1. ANALYTICS OVERVIEW */}
          {module === 'analytics' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Calendar Claims', val: data.calendarClaims ?? 0, color: 'text-amber-400' },
                { label: 'Calendar Points Paid', val: data.calendarPoints ?? 0, color: 'text-emerald-400' },
                { label: 'AI Assistant Queries', val: data.aiQueries ?? 0, color: 'text-sky-400' },
                { label: 'Open Fraud Alerts', val: data.openFraud ?? 0, color: 'text-rose-400' },
                { label: 'Gift Collectibles Sent', val: data.giftTransfers ?? 0, color: 'text-purple-400' },
                { label: 'VIP Event Joins', val: data.vipJoins ?? 0, color: 'text-amber-300' },
                { label: 'Monthly Reports Gen.', val: data.reportsGenerated ?? 0, color: 'text-emerald-300' },
                { label: 'Public Showcases', val: data.publicProfiles ?? 0, color: 'text-sky-300' },
                { label: 'Published News', val: data.publishedNews ?? 0, color: 'text-white' },
                { label: 'PWA Push Subs', val: data.pushSubscribers ?? 0, color: 'text-emerald-400' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">{stat.label}</span>
                  <div className={`text-2xl font-black font-mono tabular-nums ${stat.color}`}>{stat.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* 2. CALENDAR ADMIN */}
          {module === 'calendar' && (
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/calendar/events', { method: 'POST', body: JSON.stringify(calForm) });
                  if (res.ok) {
                    addToast('Calendar Event Saved', calForm.title, 'success');
                    setCalForm({ ...calForm, title: '', title_bn: '', description: '' });
                    loadModule('calendar');
                  }
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs"
              >
                <h3 className="font-extrabold text-white text-sm">Create / Update Calendar Reward Event</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="date" value={calForm.event_date} onChange={(e) => setCalForm({ ...calForm, event_date: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  <input placeholder="Title (EN)" value={calForm.title} onChange={(e) => setCalForm({ ...calForm, title: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  <input placeholder="Title (Bangla)" value={calForm.title_bn} onChange={(e) => setCalForm({ ...calForm, title_bn: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                  <select value={calForm.event_type} onChange={(e) => setCalForm({ ...calForm, event_type: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white">
                    <option value="daily_login">Daily Login</option>
                    <option value="special_event">Special Event</option>
                    <option value="weekly_milestone">Weekly Milestone</option>
                    <option value="monthly_milestone">Monthly Milestone</option>
                    <option value="vip_exclusive">VIP Exclusive</option>
                  </select>
                  <select value={calForm.reward_type} onChange={(e) => setCalForm({ ...calForm, reward_type: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white">
                    <option value="points">Points</option>
                    <option value="promo_credit">Promo Credit ($)</option>
                    <option value="multiplier_boost">Multiplier Boost</option>
                  </select>
                  <input type="number" step="0.5" value={calForm.reward_value} onChange={(e) => setCalForm({ ...calForm, reward_value: Number(e.target.value) })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input type="checkbox" checked={calForm.vip_only} onChange={(e) => setCalForm({ ...calForm, vip_only: e.target.checked })} />
                    <span>VIP Exclusive Event</span>
                  </label>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Save Event
                  </button>
                </div>
              </form>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 max-h-80 overflow-y-auto text-xs">
                {(data.events || []).map((ev: any) => (
                  <div key={ev.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-amber-400 mr-2">{ev.event_date}</span>
                      <strong className="text-white">{ev.title}</strong>
                      <span className="ml-2 text-slate-400 font-mono">({ev.reward_type}: {ev.reward_value})</span>
                    </div>
                    <button
                      onClick={async () => {
                        await adminFetch(`/api/admin/calendar/events/${ev.id}`, { method: 'DELETE' });
                        loadModule('calendar');
                      }}
                      className="text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. TRANSLATIONS ADMIN */}
          {module === 'i18n' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await adminFetch('/api/admin/i18n/strings', { method: 'POST', body: JSON.stringify(trForm) });
                    if (res.ok) {
                      addToast('Translation Saved', `${trForm.key} (${trForm.language_code})`, 'success');
                      refreshTranslations();
                      loadModule('i18n');
                    }
                  }}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <h3 className="font-extrabold text-white text-sm">Edit / Add Translation String</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Key (e.g. nav.dashboard)" value={trForm.key} onChange={(e) => setTrForm({ ...trForm, key: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                    <input placeholder="Lang code (en / bn)" value={trForm.language_code} onChange={(e) => setTrForm({ ...trForm, language_code: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  </div>
                  <input placeholder="Translated text" value={trForm.text_value} onChange={(e) => setTrForm({ ...trForm, text_value: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer">Save Translation</button>
                </form>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await adminFetch('/api/admin/i18n/languages', { method: 'POST', body: JSON.stringify(newLang) });
                    if (res.ok) {
                      addToast('Language Added', newLang.language_name, 'success');
                      setNewLang({ language_code: '', language_name: '' });
                      refreshTranslations();
                      loadModule('i18n');
                    }
                  }}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                >
                  <h3 className="font-extrabold text-white text-sm">Add New Language &amp; Missing Key Detector</h3>
                  <div className="flex gap-2">
                    <input placeholder="Code (e.g. hi)" value={newLang.language_code} onChange={(e) => setNewLang({ ...newLang, language_code: e.target.value })} className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                    <input placeholder="Language Name (e.g. हिन्दी)" value={newLang.language_name} onChange={(e) => setNewLang({ ...newLang, language_name: e.target.value })} className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold cursor-pointer">Add</button>
                  </div>
                  <div className="text-slate-400">
                    Missing translation keys detected: <strong className="text-amber-400">{(data.missing || []).length}</strong>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. PUBLIC PROFILES MODERATION */}
          {module === 'profiles' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="font-extrabold text-white text-sm">Reported Public Profiles Queue ({(data.reports || []).length})</h3>
                {(data.reports || []).length === 0 ? (
                  <p className="text-slate-400">No open profile abuse reports.</p>
                ) : (
                  (data.reports || []).map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">Target: {r.target_user_id} · Status: {r.status}</div>
                        <div className="text-slate-400">{r.reason}</div>
                      </div>
                      <button
                        onClick={async () => {
                          await adminFetch('/api/admin/profiles/moderate', {
                            method: 'POST',
                            body: JSON.stringify({ reportId: r.id, targetUserId: r.target_user_id, hideProfile: true, status: 'Actioned' }),
                          });
                          addToast('Profile Moderated', 'Public showcase hidden.', 'info');
                          loadModule('profiles');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                      >
                        Hide Profile
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. SECURITY & FRAUD MONITORING CENTER */}
          {module === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-white">Fraud Alerts &amp; Suspicious Account Monitoring</h3>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const res = await adminFetch('/api/admin/security/scan', { method: 'POST' });
                      if (res.ok) {
                        const j = await res.json();
                        addToast('Security Scan Complete', `Detected ${j.newAlertsDetected} new anomalies.`, 'info');
                        loadModule('security');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Run Anomaly Scan
                  </button>
                  <button
                    onClick={exportSecurityReport}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {(data.fraudAlerts || []).map((a: any) => (
                  <div key={a.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                          RISK {a.risk_score}/100
                        </span>
                        <strong className="text-white">{a.user_name || a.user_id}</strong>
                        <span className="font-mono text-amber-400">{a.alert_type}</span>
                        <span className="text-slate-400">({a.status})</span>
                      </div>
                      <p className="text-slate-300">{a.evidence}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          await adminFetch(`/api/admin/security/alerts/${a.id}`, {
                            method: 'POST',
                            body: JSON.stringify({ status: 'Cleared', investigation_log: 'Cleared after admin verification' }),
                          });
                          loadModule('security');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={async () => {
                          await adminFetch(`/api/admin/security/alerts/${a.id}`, {
                            method: 'POST',
                            body: JSON.stringify({ status: 'Confirmed_Fraud', investigation_log: 'Confirmed suspicious behavior' }),
                          });
                          loadModule('security');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                      >
                        Confirm Fraud
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. AI ASSISTANT MANAGEMENT */}
          {module === 'ai' && data.settings && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await adminFetch('/api/admin/ai/settings', { method: 'PUT', body: JSON.stringify(data.settings) });
                if (res.ok) addToast('AI Settings Saved', 'Instructions and usage limits updated.', 'success');
              }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-white text-sm">AI Personal Assistant Controls (Total Queries: {data.totalMessages || 0})</h3>
                <label className="flex items-center gap-2 text-emerald-300 font-bold">
                  <input
                    type="checkbox"
                    checked={data.settings.is_enabled === 1}
                    onChange={(e) => setData({ ...data, settings: { ...data.settings, is_enabled: e.target.checked ? 1 : 0 } })}
                  />
                  <span>Assistant Enabled</span>
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Daily User Message Limit</label>
                <input
                  type="number"
                  value={data.settings.daily_message_limit}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, daily_message_limit: Number(e.target.value) } })}
                  className="w-36 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white block"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">System Instructions</label>
                <textarea
                  rows={3}
                  value={data.settings.system_instructions}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, system_instructions: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Platform FAQ Knowledge Base</label>
                <textarea
                  rows={4}
                  value={data.settings.faq_knowledge}
                  onChange={(e) => setData({ ...data, settings: { ...data.settings, faq_knowledge: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer">
                Save AI Configuration
              </button>
            </form>
          )}

          {/* 7. ACTIVITY FEED MODERATION */}
          {module === 'activity' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
              <h3 className="font-extrabold text-white text-sm">Moderate Live Activity Feed Items</h3>
              {(data.events || []).map((ev: any) => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="text-white">{ev.display_name}</strong>: <span className="text-slate-300">{ev.title}</span>
                  </div>
                  <button
                    onClick={async () => {
                      await adminFetch(`/api/admin/activity/${ev.id}/toggle`, { method: 'POST' });
                      loadModule('activity');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                      ev.is_hidden ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {ev.is_hidden ? 'Unhide' : 'Hide'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 8. VIP CLUBHOUSE ADMIN */}
          {module === 'vip_club' && (
            <div className="space-y-4 text-xs">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/vip-club/events', { method: 'POST', body: JSON.stringify(vipForm) });
                  if (res.ok) {
                    addToast('VIP Event Created', vipForm.title, 'success');
                    setVipForm({ ...vipForm, title: '', title_bn: '', description: '' });
                    loadModule('vip_club');
                  }
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <h3 className="font-extrabold text-white text-sm">Create VIP Clubhouse Event</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input placeholder="Event Title (EN)" value={vipForm.title} onChange={(e) => setVipForm({ ...vipForm, title: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  <select value={vipForm.min_tier} onChange={(e) => setVipForm({ ...vipForm, min_tier: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white">
                    <option value="Bronze">Bronze+</option>
                    <option value="Silver">Silver+</option>
                    <option value="Gold">Gold+</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                  <input placeholder="Reward Summary" value={vipForm.reward_summary} onChange={(e) => setVipForm({ ...vipForm, reward_summary: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                </div>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold cursor-pointer">Create VIP Event</button>
              </form>

              <div className="space-y-2">
                {(data.events || []).map((ev: any) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{ev.title}</strong> ({ev.min_tier}+ · {ev.participants_count} joined)
                    </div>
                    <button
                      onClick={async () => {
                        await adminFetch(`/api/admin/vip-club/events/${ev.id}`, { method: 'DELETE' });
                        loadModule('vip_club');
                      }}
                      className="text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. RECOMMENDATIONS SETTINGS */}
          {module === 'recommendations' && data.settings && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await adminFetch('/api/admin/recommendations/settings', { method: 'PUT', body: JSON.stringify(data.settings) });
                if (res.ok) addToast('Recommendation Engine Saved', 'Category weights updated.', 'success');
              }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs"
            >
              <h3 className="font-extrabold text-white text-sm">Smart Recommendation Engine Weights &amp; Toggles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { toggle: 'enable_calendar', weight: 'weight_calendar', label: 'Monthly Reward Calendar' },
                  { toggle: 'enable_missions', weight: 'weight_missions', label: 'Daily Missions' },
                  { toggle: 'enable_tournaments', weight: 'weight_tournaments', label: 'Gaming Tournaments' },
                  { toggle: 'enable_vip_perks', weight: 'weight_vip', label: 'VIP Clubhouse Perks' },
                  { toggle: 'enable_achievements', weight: 'weight_achievements', label: 'Achievements & Showcase' },
                ].map((row) => (
                  <div key={row.toggle} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-white font-semibold">
                      <input
                        type="checkbox"
                        checked={data.settings[row.toggle] === 1}
                        onChange={(e) => setData({ ...data, settings: { ...data.settings, [row.toggle]: e.target.checked ? 1 : 0 } })}
                      />
                      <span>{row.label}</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={data.settings[row.weight]}
                      onChange={(e) => setData({ ...data, settings: { ...data.settings, [row.weight]: Number(e.target.value) } })}
                      className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono text-right"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold cursor-pointer">Save Engine Settings</button>
            </form>
          )}

          {/* 10. MONTHLY REPORTS SUMMARY */}
          {module === 'reports' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <h3 className="font-extrabold text-white text-sm">Platform Monthly Reports Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Reports Generated</span>
                  <strong className="text-lg font-mono text-white">{data.totals?.total_reports || 0}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Withdrawable Total</span>
                  <strong className="text-lg font-mono text-emerald-400">${Number(data.totals?.sum_withdrawable || 0).toFixed(2)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Promo Credits Total</span>
                  <strong className="text-lg font-mono text-purple-400">${Number(data.totals?.sum_promo || 0).toFixed(2)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Withdrawals Paid</span>
                  <strong className="text-lg font-mono text-amber-400">${Number(data.totals?.sum_paid || 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* 11. GIFT CENTER INVENTORY CRUD */}
          {module === 'gifts' && (
            <div className="space-y-4 text-xs">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/gifts', { method: 'POST', body: JSON.stringify(giftForm) });
                  if (res.ok) {
                    addToast('Gift Collectible Added', giftForm.name, 'success');
                    setGiftForm({ ...giftForm, name: '', name_bn: '', description: '' });
                    loadModule('gifts');
                  }
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <h3 className="font-extrabold text-white text-sm">Add Non-Cash Digital Collectible Gift</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input placeholder="Gift Name (EN)" value={giftForm.name} onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  <select value={giftForm.category} onChange={(e) => setGiftForm({ ...giftForm, category: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white">
                    <option value="profile_frame">Profile Frame</option>
                    <option value="badge">Badge</option>
                    <option value="avatar_pack">Avatar Pack</option>
                    <option value="profile_theme">Profile Theme</option>
                    <option value="vip_gift">VIP Gift</option>
                  </select>
                  <input type="number" placeholder="Points Cost" value={giftForm.points_cost} onChange={(e) => setGiftForm({ ...giftForm, points_cost: Number(e.target.value) })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                </div>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold cursor-pointer">Save Gift Item</button>
              </form>

              <div className="space-y-2">
                {(data.catalog || []).map((g: any) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{g.name}</strong> ({g.category} · {g.points_cost} pts)
                    </div>
                    <button
                      onClick={async () => {
                        await adminFetch(`/api/admin/gifts/${g.id}`, { method: 'DELETE' });
                        loadModule('gifts');
                      }}
                      className="text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. NEWS CENTER CRUD */}
          {module === 'news' && (
            <div className="space-y-4 text-xs">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/news/articles', { method: 'POST', body: JSON.stringify(newsForm) });
                  if (res.ok) {
                    addToast('News Article Published', newsForm.title_en, 'success');
                    setNewsForm({ ...newsForm, title_en: '', title_bn: '', summary_en: '', content_en: '' });
                    loadModule('news');
                  }
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <h3 className="font-extrabold text-white text-sm">Publish Platform News Article</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={newsForm.category_id} onChange={(e) => setNewsForm({ ...newsForm, category_id: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white">
                    {(data.categories || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name_en}</option>
                    ))}
                  </select>
                  <input placeholder="Headline (English)" value={newsForm.title_en} onChange={(e) => setNewsForm({ ...newsForm, title_en: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                  <input placeholder="Headline (Bangla)" value={newsForm.title_bn} onChange={(e) => setNewsForm({ ...newsForm, title_bn: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                  <input placeholder="Summary" value={newsForm.summary_en} onChange={(e) => setNewsForm({ ...newsForm, summary_en: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                </div>
                <textarea rows={3} placeholder="Full article content..." value={newsForm.content_en} onChange={(e) => setNewsForm({ ...newsForm, content_en: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input type="checkbox" checked={newsForm.is_pinned} onChange={(e) => setNewsForm({ ...newsForm, is_pinned: e.target.checked })} />
                    <span>Pin to top</span>
                  </label>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer">Publish Article</button>
                </div>
              </form>

              <div className="space-y-2">
                {(data.articles || []).map((a: any) => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{a.title_en}</strong> <span className="text-slate-400 font-mono">({a.published_at.slice(0, 10)})</span>
                    </div>
                    <button
                      onClick={async () => {
                        await adminFetch(`/api/admin/news/articles/${a.id}`, { method: 'DELETE' });
                        loadModule('news');
                      }}
                      className="text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 13. PWA & PUSH NOTIFICATIONS */}
          {module === 'pwa' && data.settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/pwa/settings', { method: 'PUT', body: JSON.stringify(data.settings) });
                  if (res.ok) addToast('PWA Settings Saved', 'Mobile app settings updated.', 'success');
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <h3 className="font-extrabold text-white text-sm">PWA App Settings (Subscribers: {data.subscriptionsCount || 0})</h3>
                <label className="flex items-center gap-2 text-slate-200">
                  <input type="checkbox" checked={data.settings.install_prompt_enabled === 1} onChange={(e) => setData({ ...data, settings: { ...data.settings, install_prompt_enabled: e.target.checked ? 1 : 0 } })} />
                  <span>Enable In-App Install Prompt</span>
                </label>
                <label className="flex items-center gap-2 text-slate-200">
                  <input type="checkbox" checked={data.settings.offline_banner_enabled === 1} onChange={(e) => setData({ ...data, settings: { ...data.settings, offline_banner_enabled: e.target.checked ? 1 : 0 } })} />
                  <span>Show Offline Connectivity Indicator</span>
                </label>
                <label className="flex items-center gap-2 text-slate-200">
                  <input type="checkbox" checked={data.settings.push_notifications_enabled === 1} onChange={(e) => setData({ ...data, settings: { ...data.settings, push_notifications_enabled: e.target.checked ? 1 : 0 } })} />
                  <span>Enable Push Notifications</span>
                </label>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer">Save PWA Config</button>
              </form>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await adminFetch('/api/admin/pwa/broadcast', { method: 'POST', body: JSON.stringify(pushForm) });
                  if (res.ok) {
                    addToast('Push Broadcast Dispatched', pushForm.title, 'success');
                    setPushForm({ title: '', body: '', target_tier: 'All' });
                    loadModule('pwa');
                  }
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <h3 className="font-extrabold text-white text-sm">Send Push Notification Broadcast</h3>
                <input placeholder="Notification Title" value={pushForm.title} onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                <textarea rows={2} placeholder="Message body..." value={pushForm.body} onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white" required />
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold cursor-pointer">Send Broadcast</button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
