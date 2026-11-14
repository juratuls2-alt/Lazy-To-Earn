import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  ArrowRight,
  ShieldCheck,
  Tv,
  Users,
  Wallet,
  Sparkles,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AdBanner } from '../AdBanner';
import { BLOG_OFFICIAL_LINK, EARN_MORE_SHORT_LINK, openAdMonetizationLink } from '../../utils/adLinks';

export const LandingPage: React.FC = () => {
  const { setCurrentView, switchUser } = useApp();

  return (
    <div className="space-y-12 pb-16">
      {/* Top Banner Ad */}
      <AdBanner slot="leaderboard_728x90" label="Sponsor Leaderboard (728x90)" showBonusAction />

      {/* Hero Section */}
      <section className="relative p-6 sm:p-10 lg:p-14 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 shadow-2xl overflow-hidden text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official External Account &amp; Payment Gateway for Blogger</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Earn Daily Cash Watching Ads &amp; Inviting Friends
        </h1>

        <p className="text-sm sm:text-base text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed">
          The premier monetization platform for <span className="text-amber-400 font-semibold">lasytoearn.blogspot.com</span>. Earn up to $10.00 for every referral, enjoy daily streak bonuses, and withdraw directly to <strong className="text-white">bKash</strong>, <strong className="text-white">Nagad</strong>, and <strong className="text-white">Crypto</strong>.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setCurrentView('signup')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Free Account (+$5 Bonus)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentView('login')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors border border-slate-700 cursor-pointer"
          >
            Sign In to Existing Account
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Minimum Cashout: $100.00
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            $10.00 Per Referral
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            0% Withdrawal Fee on bKash/Nagad
          </span>
        </div>
      </section>

      {/* 3 Steps: How It Works */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">How Lazy To Earn Works</h2>
          <p className="text-xs text-slate-400 mt-1">Start earning in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-extrabold mb-3">
              1
            </div>
            <h3 className="font-bold text-white text-base mb-1">Create Account</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register with your email and phone number. Instantly receive a $5.00 starter bonus and a unique User ID.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-extrabold mb-3">
              2
            </div>
            <h3 className="font-bold text-white text-base mb-1">Watch Ads &amp; Refer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Watch high-paying network ads, build your 7-day multiplier streak up to 2.0x, and invite friends for $10 each.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-extrabold mb-3">
              3
            </div>
            <h3 className="font-bold text-white text-base mb-1">Cash Out ($100 Min)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once your available balance reaches $100.00, submit a withdrawal to bKash, Nagad, or Crypto wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Account Switcher Banner (Directly showcases strict data isolation requirement) */}
      <section className="max-w-5xl mx-auto p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified User Data Isolation Demo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any profile below to verify that User A, User B, and User C only see their own private payout history:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => switchUser('LTE-782910')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 text-left transition-colors cursor-pointer group"
          >
            <div className="font-bold text-xs text-white group-hover:text-amber-400">User A: Tanvir</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">2 Paid ($225 total)</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Balance: $145.50</div>
          </button>

          <button
            onClick={() => switchUser('LTE-419082')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 text-left transition-colors cursor-pointer group"
          >
            <div className="font-bold text-xs text-white group-hover:text-amber-400">User B: Nafisa</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">1 Pending ($110)</div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Balance: $110.00</div>
          </button>

          <button
            onClick={() => switchUser('LTE-639104')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 text-left transition-colors cursor-pointer group"
          >
            <div className="font-bold text-xs text-white group-hover:text-amber-400">User C: Mahin</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">0 Payout Records</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Balance: $25.00</div>
          </button>

          <button
            onClick={() => setCurrentView('admin_login')}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-colors cursor-pointer group"
          >
            <div className="font-bold text-xs text-amber-400">Administrator Access</div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">Secret Code Login</div>
            <div className="text-[10px] text-amber-300 font-mono mt-0.5">Server Protected</div>
          </button>
        </div>
      </section>

      {/* Banner Ads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        <AdBanner slot="rectangle_300x250" label="Sponsor Ad" showBonusAction />
        <AdBanner slot="banner_468x60" label="Partner Format" showBonusAction />
      </div>
    </div>
  );
};
