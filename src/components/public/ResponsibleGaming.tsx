import React from 'react';
import { ShieldCheck, AlertCircle, HeartHandshake, CheckCircle2, Lock } from 'lucide-react';

export const ResponsibleGamingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16 text-slate-200">
      <div className="text-center space-y-3 py-6">
        <span className="px-3.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Fair Play &amp; Ethics</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Responsible Gaming Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Lazy To Earn is committed to providing a fun, transparent, and fair online rewards arcade.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-400" />
            <span>1. Entertainment-First Philosophy</span>
          </h2>
          <p className="text-slate-300">
            Lazy To Earn is an online engagement, gaming, and rewards platform designed purely for casual entertainment. Platform rewards, mission points, and tournament prizes are complementary incentives provided to active community members. We strictly advise users never to view online rewards as a primary source of livelihood or guaranteed employment.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-sky-400" />
            <span>2. Enforced Daily Play Limits</span>
          </h2>
          <p className="text-slate-300">
            To prevent excessive screen time and fatigue, our backend automatically enforces maximum daily game session thresholds (default: 50 arcade games and 40 mini games per user per day). Once this threshold is reached, gameplay is paused until the midnight reset.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>3. Anti-Cheat &amp; Provable Fairness</span>
          </h2>
          <p className="text-slate-300">
            All random events—including the Lucky Spin Wheel, Scratch Card symbol matches, and Tournament score verifications—are generated and verified server-side with cryptographic hashes. No client-side script or modified software can alter reward payouts or leaderboard standings.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>4. Self-Exclusion &amp; Account Protection</span>
          </h2>
          <p className="text-slate-300">
            If at any point you wish to take a break from the platform or self-exclude your account, you can submit a temporary cooling-off request via the Live Support desk. Our administrators will freeze your profile for 7, 30, or 90 days with zero penalty.
          </p>
        </section>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
          <strong>Community Safety Notice:</strong> For support or questions regarding gaming habits, please reach out to our 24/7 support team through the Live Support Center.
        </div>
      </div>
    </div>
  );
};
