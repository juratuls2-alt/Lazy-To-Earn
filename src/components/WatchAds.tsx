import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Tv,
  Play,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Zap,
  Flame,
  Award,
} from 'lucide-react';
import { AdBanner } from './AdBanner';
import {
  AD_DIRECT_LINK_1,
  EARN_MORE_SHORT_LINK,
  openAdMonetizationLink,
} from '../utils/adLinks';
import confetti from 'canvas-confetti';

interface AdTask {
  id: string;
  title: string;
  category: string;
  baseReward: number;
  duration: number;
  url: string;
  description: string;
  badge?: string;
}

const AD_TASKS: AdTask[] = [
  {
    id: 'ad_1',
    title: 'High-CPM Partner Sponsor (Direct Pop)',
    category: 'Direct Network',
    baseReward: 1.50,
    duration: 10,
    url: AD_DIRECT_LINK_1,
    description: 'High revenue CPM direct link. View sponsor site and earn full reward.',
    badge: '🔥 Highest Payout',
  },
  {
    id: 'ad_2',
    title: 'Earn More Short Link (Official)',
    category: 'Fast Short Link',
    baseReward: 2.00,
    duration: 8,
    url: EARN_MORE_SHORT_LINK,
    description: 'Special verified short link with guaranteed $2.00+ base reward.',
    badge: '⚡ Instant Boost',
  },
  {
    id: 'ad_3',
    title: 'Global High Revenue Banner Ad (300x250)',
    category: 'Interactive Banner',
    baseReward: 1.25,
    duration: 10,
    url: EARN_MORE_SHORT_LINK,
    description: 'Engage with the high-revenue interactive banner display to qualify.',
  },
  {
    id: 'ad_4',
    title: 'Daily Sponsored Impression',
    category: 'Sponsored CPM',
    baseReward: 1.00,
    duration: 5,
    url: AD_DIRECT_LINK_1,
    description: 'Fast 5-second ad impression to keep your daily streak advancing.',
  },
  {
    id: 'ad_5',
    title: 'Crypto & Fintech Partner Ad',
    category: 'Partner Network',
    baseReward: 1.75,
    duration: 12,
    url: EARN_MORE_SHORT_LINK,
    description: 'Sponsored cryptocurrency trading and web3 gateway ad.',
    badge: '💎 Hot Offer',
  },
];

export const WatchAds: React.FC = () => {
  const { streak, recordAdWatched, addToast, user } = useApp();
  const balance = user?.availableBalance ?? 0;

  const [activeTask, setActiveTask] = useState<AdTask | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Timer logic for watching ads
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (isWatching && countdown === 0) {
      setIsWatching(false);
      setCanClaim(true);
      confetti({ particleCount: 50, spread: 60 });
    }
    return () => clearTimeout(timer);
  }, [isWatching, countdown]);

  const handleStartAd = (task: AdTask) => {
    // Open ad link per user requirement: "add this short link with every click"
    openAdMonetizationLink(task.url === AD_DIRECT_LINK_1 ? 'main' : 'earn_more');
    setActiveTask(task);
    setCountdown(task.duration);
    setIsWatching(true);
    setCanClaim(false);
  };

  const handleClaimReward = () => {
    if (!activeTask) return;
    const { earned, multiplier } = recordAdWatched(activeTask.baseReward);
    setCompletedTaskIds((prev) => [...prev, activeTask.id]);
    setCanClaim(false);
    setActiveTask(null);

    addToast(
      'Reward Credited! 💰',
      `+$${earned.toFixed(2)} ($${activeTask.baseReward} x ${multiplier}x Streak Multiplier) added to your balance!`,
      'bonus'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Ad - Leaderboard */}
      <AdBanner slot="leaderboard_728x90" label="Leaderboard High CPM Network" showBonusAction />

      {/* Header and Real-time Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Tv className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white">Watch Ads &amp; Earn</h1>
              <p className="text-xs text-slate-400">
                Watch sponsored network ads, click partner short links, and multiply rewards with your Daily Streak.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Earnings Metric Pill */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Live Balance</span>
            <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
              ${balance.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Multiplier</span>
              <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                {streak.multiplier}x Bonus
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Ad Viewing Modal / Banner Card */}
      {activeTask && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-500/50 shadow-2xl relative animate-in fade-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                Viewing Sponsored Ad
              </span>
              <h2 className="text-lg font-bold text-white">{activeTask.title}</h2>
              <p className="text-xs text-slate-400">{activeTask.description}</p>
            </div>

            {/* Countdown / Claim Button */}
            <div className="flex items-center gap-3">
              {isWatching ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-400 font-mono">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span className="font-bold text-base tabular-nums">{countdown}s</span>
                  <span className="text-xs text-slate-400">remaining</span>
                </div>
              ) : canClaim ? (
                <button
                  onClick={handleClaimReward}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 animate-bounce cursor-pointer"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>
                    Claim +${(activeTask.baseReward * streak.multiplier).toFixed(2)}
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Embedded High-CPM Banner Preview while timer counts down */}
          <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 mb-2 font-mono">
              Ad Network Frame (CPM Verification Active)
            </span>
            <AdBanner slot="rectangle_300x250" label="Active CPM View" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>
              Ad partner link opened in new tab. Keep this page open until countdown reaches 0 to claim.
            </span>
            <button
              onClick={() => openAdMonetizationLink('earn_more')}
              className="text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Reopen Sponsor Tab</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* List of Available Ad Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Available High-Revenue Ads
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {streak.adsWatchedToday} watched today · Resets every 24h
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AD_TASKS.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const totalEstimatedReward = (task.baseReward * streak.multiplier).toFixed(2);

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      {task.category} · {task.duration}s View
                    </span>
                    {task.badge && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {task.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5">{task.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{task.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">Reward</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                        +${totalEstimatedReward}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (${task.baseReward} x {streak.multiplier}x)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartAd(task)}
                    disabled={isWatching && activeTask?.id === task.id}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      isCompleted
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Watch Again</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Display Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdBanner slot="rectangle_300x250" label="Sponsor Rectangle (300x250)" showBonusAction />
        <AdBanner slot="banner_468x60" label="Sponsor Banner (468x60)" showBonusAction />
      </div>

      {/* Earn More Direct Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
            <Zap className="w-4 h-4" />
            High Paying Short Link Offer
          </span>
          <h3 className="text-base font-bold text-white mt-1">
            Want to accelerate your $100 payout goal?
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Click our official high revenue short link (<span className="text-amber-400 font-mono">{EARN_MORE_SHORT_LINK}</span>) to unlock bonus CPM tiers and get rewarded with every single click.
          </p>
        </div>

        <button
          onClick={() => {
            openAdMonetizationLink('earn_more');
            recordAdWatched(2.50);
            addToast('Earn More Bonus!', '+$2.50 credited for opening sponsor short link!', 'bonus');
          }}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Click Short Link &amp; Earn +$2.50</span>
        </button>
      </div>
    </div>
  );
};
