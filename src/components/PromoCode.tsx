import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  Copy,
  Tag,
  ShieldCheck,
  Coins,
  Crown,
  AlertCircle,
} from 'lucide-react';

export const PromoCode: React.FC = () => {
  const { redeemPromoCode, addToast } = useApp();
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const sampleCodes = [
    { code: 'LAZY2026', reward: '$5.00 Instant Cash', desc: 'Welcome bonus for all registered members' },
    { code: 'POINTS100', reward: '200 Reward Points', desc: 'Use for tournament buy-ins & spins' },
    { code: 'VIPBOOST', reward: '7-Day Bronze VIP Pass', desc: '+25% earnings multiplier upgrade' },
  ];

  const handleRedeem = (codeToUse?: string) => {
    const target = (codeToUse || inputCode).trim();
    if (!target) {
      setMessage({ text: 'Please enter a valid promotional code.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    setTimeout(() => {
      const res = redeemPromoCode(target);
      setLoading(false);
      if (res.success) {
        setMessage({ text: res.message || 'Promo code applied!', type: 'success' });
        setInputCode('');
      } else {
        setMessage({ text: res.error || 'Failed to redeem code.', type: 'error' });
      }
    }, 500);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('Code Copied', `${code} copied to clipboard!`, 'info');
    setInputCode(code);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              <span>Special Rewards</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Server Validated</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Redeem Promotional Code 🎁
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Have a voucher code or special community coupon? Enter it below to claim instant cash bonuses, reward points, and VIP trials.
          </p>
        </div>
      </div>

      {/* Redemption Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Enter Promo Code
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Tag className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. LAZY2026"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:border-amber-400 outline-none uppercase tracking-wider"
              />
            </div>
            <button
              onClick={() => handleRedeem()}
              disabled={loading || !inputCode.trim()}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'REDEEM NOW'}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-fadeIn ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted validation with duplicate redemption prevention</span>
          </span>
          <span>1 redemption per account</span>
        </div>
      </div>

      {/* Featured Community Promo Codes */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Active Official Promo Codes</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleCodes.map((item) => (
            <div
              key={item.code}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                    {item.code}
                  </span>
                  <button
                    onClick={() => handleCopy(item.code)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                    title="Copy code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-bold text-white text-xs mt-2">{item.reward}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>

              <button
                onClick={() => handleRedeem(item.code)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Apply Code
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
