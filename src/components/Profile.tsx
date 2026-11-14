import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Phone,
  Wallet,
  Shield,
  ExternalLink,
  Save,
  CheckCircle2,
  KeyRound,
  Coins,
  Copy,
  Check,
  LogOut,
  Camera,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { BLOG_OFFICIAL_LINK, EARN_MORE_SHORT_LINK } from '../utils/adLinks';
import { AdBanner } from './AdBanner';
import { PaymentMethod } from '../types';

export const Profile: React.FC = () => {
  const { user, updateProfile, addToast, logout, referralLink, setCurrentView } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Payment Account Settings
  const [bkashNumber, setBkashNumber] = useState(user?.bkashNumber || '');
  const [nagadNumber, setNagadNumber] = useState(user?.nagadNumber || '');
  const [preferredMethod, setPreferredMethod] = useState<PaymentMethod>(
    user?.preferredPaymentMethod || 'bKash'
  );
  const [usdtWallet, setUsdtWallet] = useState(user?.usdtWallet || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-300">Please sign in to view your profile.</p>
        <button
          onClick={() => setCurrentView('login')}
          className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    addToast('Link Copied', 'Your referral link has been copied.', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    addToast('Code Copied', `Referral code ${user.referralCode} copied.`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      phone,
      avatarUrl,
      bkashNumber,
      nagadNumber,
      preferredPaymentMethod: preferredMethod,
      usdtWallet,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setSecurityMessage('New password must be at least 6 characters.');
      return;
    }
    updateProfile({ password: newPassword });
    setSecurityMessage('Password changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    addToast('Security Updated', 'Your account password was changed.', 'success');
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  ];

  return (
    <div className="space-y-6 pb-12">
      <AdBanner slot="leaderboard_728x90" label="Verified Account Partner" showBonusAction />

      {/* Main Profile Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={avatarUrl || user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
            />
            <button
              type="button"
              onClick={() => {
                const next = presetAvatars[(presetAvatars.indexOf(avatarUrl) + 1) % presetAvatars.length];
                setAvatarUrl(next);
                updateProfile({ avatarUrl: next });
              }}
              className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-lg cursor-pointer"
              title="Click to cycle profile avatar"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">{user.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {user.accountStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                Unique User ID: <strong className="text-amber-400">{user.id}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined: {user.registrationDate}
              </span>
            </div>
          </div>
        </div>

        {/* Secure Logout CTA */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={logout}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Secure Logout</span>
          </button>
        </div>
      </div>

      {/* Balance & Earnings Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Available Balance
          </span>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            ${user.availableBalance.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Min Cashout: $100.00
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total Lifetime Earnings
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            ${user.totalEarnings.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Ads + $10 Referrals
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total Withdrawals (Paid)
          </span>
          <div className="text-2xl font-mono font-bold text-purple-400 tabular-nums">
            ${user.totalWithdrawals.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Transferred to bKash/Nagad
          </span>
        </div>
      </div>

      {/* Referral Code & Personal Link */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Personal Referral Details ($10 / Invite)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Your Referral Code</span>
              <span className="font-mono font-bold text-white text-sm">{user.referralCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="truncate mr-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Personal Referral Link</span>
              <span className="font-mono text-xs text-amber-400 truncate block">{referralLink}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Edit Profile Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your personal identity and verified phone contact.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Payment Account Settings */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Payment Account Settings
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure default payment details for your dedicated withdrawal requests.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>bKash Number</span>
                    <span className="text-[10px] text-[#E2136E] font-bold">bKash</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 01712894520"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Nagad Number</span>
                    <span className="text-[10px] text-[#F7941D] font-bold">Nagad</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 01844910234"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferred Payment Method
                  </label>
                  <select
                    value={preferredMethod}
                    onChange={(e) => setPreferredMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
                  >
                    <option value="bKash">bKash (Personal / Agent)</option>
                    <option value="Nagad">Nagad (Personal / Agent)</option>
                    <option value="Crypto">Crypto (USDT TRC20 / BEP20)</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    USDT Wallet Address (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0x8b3... or TRC20 address"
                    value={usdtWallet}
                    onChange={(e) => setUsdtWallet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Account Changes</span>
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-400" />
              Change Password
            </h3>

            {securityMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {securityMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Account Verification
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Account ID:</span>
                <span className="text-amber-400 font-mono font-bold">{user.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold">{user.accountStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Email Verified:</span>
                <span className="text-emerald-400 font-semibold">Yes (Verified)</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
            <h4 className="text-sm font-bold text-white">Official Blogger Site</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connected external backend for <span className="text-amber-400 font-mono">lasytoearn.blogspot.com</span>.
            </p>
            <a
              href={BLOG_OFFICIAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              <span>Visit Official Blog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <AdBanner slot="rectangle_300x250" label="Sponsor Banner" showBonusAction />
        </div>
      </div>
    </div>
  );
};
