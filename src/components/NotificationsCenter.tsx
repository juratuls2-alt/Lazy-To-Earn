import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCircle2, DollarSign, Sparkles, Clock, Check } from 'lucide-react';
import { AdBanner } from './AdBanner';

export const NotificationsCenter: React.FC = () => {
  const { userNotifications, markNotificationsAsRead, unreadNotificationCount } = useApp();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Ad */}
      <AdBanner slot="leaderboard_728x90" label="Sponsor Leaderboard" showBonusAction />

      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Bell className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white">Notifications Center</h1>
              <p className="text-xs text-slate-400">
                Personal alerts regarding your account, withdrawals, streaks, and referral bonuses.
              </p>
            </div>
          </div>
        </div>

        {unreadNotificationCount > 0 && (
          <button
            onClick={markNotificationsAsRead}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/70">
        {userNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No Notifications Yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Updates about your withdrawals and daily bonuses will appear here.
            </p>
          </div>
        ) : (
          userNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                notif.isRead ? 'bg-slate-900/40' : 'bg-slate-950/80 border-l-2 border-l-amber-400'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'payment'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : notif.type === 'referral'
                    ? 'bg-sky-500/10 text-sky-400'
                    : notif.type === 'bonus'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {notif.type === 'payment' ? (
                  <DollarSign className="w-4 h-4" />
                ) : notif.type === 'referral' ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-white">{notif.title}</h4>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {notif.date}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdBanner slot="rectangle_300x250" label="Sponsor Ad" showBonusAction />
        <AdBanner slot="banner_468x60" label="Partner Sponsor" showBonusAction />
      </div>
    </div>
  );
};
