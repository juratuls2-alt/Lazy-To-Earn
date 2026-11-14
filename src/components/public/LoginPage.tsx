import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AdBanner } from '../AdBanner';

interface LoginPageProps {
  onOpenForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenForgotPassword }) => {
  const { login, setCurrentView, switchUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const res = login(email, password, rememberMe);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Back to Home Link */}
        <button
          onClick={() => setCurrentView('home')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Homepage</span>
        </button>

        {/* Card */}
        <div className="p-7 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Logo & Welcome Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
              <Coins className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to your private Lazy To Earn account
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none text-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-none text-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'Signing In...' : 'Login to Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link to Signup */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              onClick={() => setCurrentView('signup')}
              className="text-amber-400 hover:underline font-semibold cursor-pointer"
            >
              Create a New Account
            </button>
          </div>

          {/* Quick Demo Switcher to test Individual Payout Isolation */}
          <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
              Test Individual Accounts &amp; Data Isolation:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => switchUser('LTE-782910')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 hover:border-amber-400/50 transition-colors cursor-pointer truncate"
              >
                👤 User A (Tanvir - 2 Paid)
              </button>
              <button
                type="button"
                onClick={() => switchUser('LTE-419082')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 hover:border-amber-400/50 transition-colors cursor-pointer truncate"
              >
                👤 User B (Nafisa - 1 Pending)
              </button>
              <button
                type="button"
                onClick={() => switchUser('LTE-639104')}
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-left border border-slate-800 hover:border-amber-400/50 transition-colors cursor-pointer truncate"
              >
                👤 User C (Mahin - 0 Payouts)
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('admin_login')}
                className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-left border border-amber-500/30 transition-colors cursor-pointer truncate font-bold"
              >
                🔑 Admin Secret Code Login
              </button>
            </div>
          </div>
        </div>

        {/* Small Ad Banner */}
        <AdBanner slot="mobile_320x50" label="Sponsor Link" showBonusAction />
      </div>
    </div>
  );
};
