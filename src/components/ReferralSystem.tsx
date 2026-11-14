import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Copy,
  Check,
  Share2,
  DollarSign,
  ShieldCheck,
  QrCode,
  MessageCircle,
  Send,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AdBanner } from './AdBanner';
import { TopReferrersLeaderboard } from './TopReferrersLeaderboard';

export const ReferralSystem: React.FC = () => {
  const { user, allUsers, referralLink, previewReferralLink, addToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const refCode = user?.referralCode || 'LAZY779X';
  const referralEarnings = user?.referralEarnings ?? 0;
  const referrals = allUsers.filter(
    (u) => u.referredBy?.toLowerCase() === refCode.toLowerCase()
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    addToast('Link Copied!', 'Share your link to earn $10.00 per referral!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    addToast('Code Copied!', `Referral code ${refCode} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareText = `Join Lazy To Earn! Watch ads, earn daily bonus, and withdraw to bKash, Nagad or Crypto ($100 min). Register with my link for a free $5 welcome bonus: ${referralLink}`;

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Lazy To Earn and cash out via bKash & Nagad!')}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Ad */}
      <AdBanner slot="leaderboard_728x90" label="Referral Program Sponsor" showBonusAction />

      {/* Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 border border-sky-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Earn $10.00 Per Valid Referral</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Invite Friends, Earn $10 Each
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Share your regular referral link. When someone joins with your link and starts watching ads, you automatically receive a full <strong className="text-amber-400">$10.00 cash bonus</strong>, and your friend gets a $5.00 welcome bonus!
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center shrink-0 min-w-[200px]">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Total Referral Earnings
            </span>
            <div className="text-3xl font-mono font-extrabold text-sky-400 tabular-nums my-1">
              ${referralEarnings.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400">
              {referrals.length} Invited Friends
            </span>
          </div>
        </div>

        {/* Regular Referral Link & Code Inputs */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Regular Link */}
          <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Your Regular Referral Link
            </label>
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent font-mono text-xs text-amber-400 focus:outline-none select-all"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => previewReferralLink(refCode)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Open this referral invite link on the signup page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Link</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Box 2: Referral Code */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-slate-400">
                Referral Code
              </label>
              <div className="text-base font-mono font-extrabold text-white mt-0.5 tracking-wider">
                {refCode}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Copy Referral Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* One-Click Social Sharing Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-2 font-medium">Quick Share:</span>
          <button
            onClick={shareWhatsApp}
            className="px-3 py-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={shareTelegram}
            className="px-3 py-1.5 rounded-lg bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#38bdf8] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </button>
          <button
            onClick={shareFacebook}
            className="px-3 py-1.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#60a5fa] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Facebook</span>
          </button>
          <button
            onClick={() => setShowQr(!showQr)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            <span>QR Code</span>
          </button>
        </div>

        {/* QR Code view */}
        {showQr && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center animate-in fade-in">
            <div className="p-3 bg-white rounded-lg shadow-md">
              {/* Dynamic QR using standard QR API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  referralLink
                )}`}
                alt="Referral QR Code"
                className="w-36 h-36"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Scan to sign up with code: <strong className="text-amber-400">{refCode}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Referral Program Rules & Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              $10.00 Direct Bonus
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Credited directly to your available balance for every invited user who registers with your link.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              $5.00 Friend Bonus
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Your invited friends start with a $5.00 welcome bonus to reach the $100 payout faster.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Instant Recognition
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No delays or fake caps. Withdraw your referral earnings via bKash, Nagad or Crypto anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Invited Friends Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Your Invited Referrals</h3>
            <p className="text-xs text-slate-400">
              Real-time ledger of registered accounts via your link.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {referrals.length} Total Users
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Joined Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No invited friends yet. Share your referral link above to start earning $10.00 per friend!
                  </td>
                </tr>
              ) : (
                referrals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div>{item.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{item.id}</div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-mono">{item.email}</td>
                    <td className="py-3 text-slate-400 font-mono">{item.registrationDate}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        {item.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      +$10.00
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Referrers Leaderboard */}
      <TopReferrersLeaderboard />

      {/* Ad Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdBanner slot="rectangle_300x250" label="Referral Network Sponsor" showBonusAction />
        <AdBanner slot="banner_468x60" label="Direct Monetization Link" showBonusAction />
      </div>
    </div>
  );
};
