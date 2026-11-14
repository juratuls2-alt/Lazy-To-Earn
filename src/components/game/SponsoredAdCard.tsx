import React from 'react';
import { ExternalLink, Sparkles, Megaphone, ShieldCheck } from 'lucide-react';
import { GAME_AD_URL } from '../../utils/adLinks';

interface SponsoredAdCardProps {
  placement?:
    | 'homepage'
    | 'pre_game'
    | 'between_sections'
    | 'game_result'
    | 'footer';
  variant?: 'standard' | 'compact' | 'hero' | 'horizontal';
  className?: string;
  subtitle?: string;
}

export const SponsoredAdCard: React.FC<SponsoredAdCardProps> = ({
  placement = 'homepage',
  variant = 'standard',
  className = '',
  subtitle,
}) => {
  const getContextualCopy = () => {
    switch (placement) {
      case 'pre_game':
        return {
          badge: 'Exclusive Sponsor',
          title: 'Special Gaming Sponsor Offer',
          desc: 'Explore premium entertainment apps, gaming offers, and high-paying reward campaigns.',
        };
      case 'game_result':
        return {
          badge: 'Partner Sponsor',
          title: 'Support Lazy To Earn Monetization',
          desc: 'Visit our sponsor to discover verified earning methods and exclusive member perks.',
        };
      case 'between_sections':
        return {
          badge: 'Official Sponsor',
          title: 'Trending Reward Opportunities',
          desc: 'Browse handpicked partner promotions and special deals curated for our community.',
        };
      case 'footer':
        return {
          badge: 'Verified Sponsor Network',
          title: 'Official Advertising Partner',
          desc: 'Lazy To Earn network monetization powered by verified high-performance advertising links.',
        };
      case 'homepage':
      default:
        return {
          badge: 'Sponsored Partner',
          title: 'Featured Sponsor Promotion',
          desc: 'Discover top-rated partner offers, online reward systems, and high CPM advertising campaigns.',
        };
    }
  };

  const copy = getContextualCopy();

  if (variant === 'compact') {
    return (
      <div
        className={`w-full bg-slate-900/90 border border-amber-500/30 rounded-xl p-3 sm:p-4 shadow-lg backdrop-blur-sm ${className}`}
        data-placement={placement}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Sponsored Advertisement
                </h4>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                  {copy.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium line-clamp-1">
                {subtitle || copy.desc}
              </p>
            </div>
          </div>

          <a
            href={GAME_AD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all hover:scale-[1.02] shrink-0 cursor-pointer"
            title="Opens sponsor ad in a new tab"
          >
            <span>Visit Advertisement</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/35 rounded-2xl p-4 sm:p-5 shadow-xl transition-all ${className}`}
      data-placement={placement}
    >
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar with clearly labeled Sponsored Advertisement tag */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-amber-400 flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            Sponsored Advertisement
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
            {copy.badge}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Verified Partner</span>
        </div>
      </div>

      {/* Card Content & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
            <span>{copy.title}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {subtitle || copy.desc}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">High CPM Network</span>
            <span>•</span>
            <span>uplcm.com/4/12238368</span>
            <span>•</span>
            <span className="text-amber-400/90">Safe external visit</span>
          </div>
        </div>

        {/* Visual separation - dedicated call-to-action area */}
        <div className="shrink-0 flex items-center">
          <a
            href={GAME_AD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all hover:scale-[1.02] cursor-pointer"
            title="Visit sponsored partner advertisement in a new tab"
          >
            <span>Visit Advertisement</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
