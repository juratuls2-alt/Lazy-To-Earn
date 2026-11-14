import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  ExternalLink,
  Sparkles,
  CheckCircle,
  TrendingUp,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { AdBanner } from './AdBanner';
import {
  EARN_MORE_SHORT_LINK,
  AD_DIRECT_LINK_1,
  openAdMonetizationLink,
} from '../utils/adLinks';
import confetti from 'canvas-confetti';

interface QuickOffer {
  id: string;
  title: string;
  sponsor: string;
  reward: number;
  type: 'Short Link' | 'Direct CPM' | 'Partner Ad' | 'Survey Pop';
  link: string;
  estTime: string;
}

const OFFERS: QuickOffer[] = [
  {
    id: 'off_1',
    title: 'Visit Official Earn More Short Link',
    sponsor: 'High CPM Shortener',
    reward: 2.50,
    type: 'Short Link',
    link: EARN_MORE_SHORT_LINK,
    estTime: 'Instant',
  },
  {
    id: 'off_2',
    title: 'Engage with Direct CPM Monetization Link',
    sponsor: 'ProfitRateCPM',
    reward: 2.00,
    type: 'Direct CPM',
    link: AD_DIRECT_LINK_1,
    estTime: '5 sec',
  },
  {
    id: 'off_3',
    title: 'Explore High Revenue Partner Showcase',
    sponsor: 'High Revenue Format',
    reward: 1.75,
    type: 'Partner Ad',
    link: EARN_MORE_SHORT_LINK,
    estTime: 'Instant',
  },
  {
    id: 'off_4',
    title: 'Daily Premium Link Tap',
    sponsor: 'Verified Ad Network',
    reward: 2.25,
    type: 'Short Link',
    link: EARN_MORE_SHORT_LINK,
    estTime: 'Instant',
  },
];

export const EarnMore: React.FC = () => {
  const { streak, user, addToast, setCurrentView, recordAdWatched } = useApp();
  const balance = user?.availableBalance ?? 0;
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const handleCompleteOffer = (offer: QuickOffer) => {
    // Open link
    openAdMonetizationLink(offer.link === AD_DIRECT_LINK_1 ? 'main' : 'earn_more');

    // Credit reward with streak multiplier
    const { earned, multiplier } = recordAdWatched(offer.reward);
    setCompletedIds((prev) => [...prev, offer.id]);

    confetti({ particleCount: 50, spread: 60 });
    addToast(
      'Bonus Earned!',
      `+$${earned.toFixed(2)} (${offer.reward} x ${multiplier}x Streak) credited for visiting ${offer.sponsor}!`,
      'bonus'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Ad */}
      <AdBanner slot="leaderboard_728x90" label="Sponsor Hub (728x90)" showBonusAction />

      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-950/20 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white">Earn More Hub</h1>
              <p className="text-xs text-slate-400">
                Official short links and direct sponsored impressions with instant cash rewards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Available Balance</span>
            <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
              ${balance.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => setCurrentView('withdraw')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md cursor-pointer whitespace-nowrap"
          >
            Cash Out ($100 Min)
          </button>
        </div>
      </div>

      {/* Featured Earn More Short Link Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                Official Earn More Link
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                High CPM Guaranteed
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-2">
              Click &amp; Visit High Revenue Sponsor
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Every click on <code className="text-amber-400 font-mono">{EARN_MORE_SHORT_LINK}</code> automatically verifies your engagement and rewards you with real balance.
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-400 block">Reward per visit</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              +${(2.50 * streak.multiplier).toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-amber-400 block">
              Includes {streak.multiplier}x Streak
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="font-mono text-xs text-amber-400 truncate max-w-md w-full">
            {EARN_MORE_SHORT_LINK}
          </div>

          <button
            onClick={() => {
              openAdMonetizationLink('earn_more');
              recordAdWatched(2.50);
              confetti({ particleCount: 50, spread: 60 });
              addToast('Bonus Credited!', `+$${(2.50 * streak.multiplier).toFixed(2)} added to balance!`, 'bonus');
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Click &amp; Earn +${(2.50 * streak.multiplier).toFixed(2)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Grid of Micro-Offers */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Available Quick Earning Links
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OFFERS.map((offer) => {
            const isDone = completedIds.includes(offer.id);
            const totalCredit = (offer.reward * streak.multiplier).toFixed(2);

            return (
              <div
                key={offer.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-amber-400">
                      {offer.type}
                    </span>
                    <span className="font-mono text-slate-400">{offer.estTime}</span>
                  </div>

                  <h4 className="font-bold text-white text-sm mb-1">{offer.title}</h4>
                  <p className="text-xs text-slate-400">
                    Provided by {offer.sponsor}. Opens sponsor partner window.
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Earnings</span>
                    <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      +${totalCredit}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCompleteOffer(offer)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDone
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Repeat</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open &amp; Earn</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ad Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdBanner slot="rectangle_300x250" label="Sponsor Square (300x250)" showBonusAction />
        <AdBanner slot="banner_468x60" label="Partner Banner (468x60)" showBonusAction />
      </div>
    </div>
  );
};
