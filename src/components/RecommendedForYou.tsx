import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, CalendarDays, Trophy, Crown, Target, Award } from 'lucide-react';
import { useApp, AppView } from '../context/AppContext';

interface RecommendationItem {
  id: string;
  rec_type: string;
  title: string;
  reason: string;
  reward_preview: string;
  action_view: string;
  priority_score: number;
}

export const RecommendedForYou: React.FC = () => {
  const { user, language, t, setCurrentView, effectiveVipTier } = useApp();
  const [items, setItems] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(
      `/api/recommendations/${encodeURIComponent(user.id)}?vipTier=${encodeURIComponent(
        effectiveVipTier
      )}&lang=${encodeURIComponent(language)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.recommendations) setItems(data.recommendations);
      })
      .catch(() => {});
  }, [user?.id, effectiveVipTier, language]);

  if (!user || items.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'calendar':
        return CalendarDays;
      case 'tournament':
        return Trophy;
      case 'vip':
        return Crown;
      case 'achievement':
        return Award;
      default:
        return Target;
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/25 border border-sky-500/30 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{t('dashboard.recommended_title')}</span>
          </h3>
          <p className="text-xs text-slate-400">{t('dashboard.recommended_subtitle')}</p>
        </div>
        <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 w-fit">
          Smart Personalized Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.slice(0, 3).map((rec) => {
          const Icon = getIcon(rec.rec_type);
          return (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-sky-500/40 flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-black text-emerald-400">{rec.reward_preview}</span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">{rec.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{rec.reason}</p>
              </div>
              <button
                onClick={() => setCurrentView(rec.action_view as AppView)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-sky-500 hover:text-slate-950 border border-slate-700 hover:border-sky-400 text-xs font-bold text-sky-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Start Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
