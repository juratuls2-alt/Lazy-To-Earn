import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Eye, EyeOff, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onUnlockSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onUnlockSuccess }) => {
  const { setCurrentView, addToast } = useApp();

  const [secretCode, setSecretCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.sessionToken) {
        // Store server-issued cryptographically secure temporary session token
        sessionStorage.setItem('lte_admin_token', data.sessionToken);
        sessionStorage.setItem('lte_admin_expires', data.expiresAt.toString());

        addToast('Admin Unlocked', 'Administrator Dashboard verified and unlocked.', 'success');
        onUnlockSuccess();
      } else {
        // Display exact requirement: "Invalid Secret Code. Access Denied."
        const msg = data.error || 'Invalid Secret Code. Access Denied.';
        setErrorMessage(msg);
        if (typeof data.attemptsRemaining === 'number') {
          setAttemptsRemaining(data.attemptsRemaining);
        }
      }
    } catch (err) {
      console.error('Server verification error:', err);
      setErrorMessage('Security verification error. Unable to contact authentication server.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6">
        {/* Back Link */}
        <button
          onClick={() => setCurrentView('home')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Lazy To Earn</span>
        </button>

        {/* Security Shield Card */}
        <div className="p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Subtle security glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Administrator Access
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted Area · Server-side Authorization Required
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-[11px] text-red-400/80 mt-0.5">
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining before 15-minute lock.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form containing ONLY the Secret Access Code */}
          <form onSubmit={handleUnlock} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Secret Access Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="Enter Administrator Secret Code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none text-white text-sm font-mono tracking-wider transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                  title={showCode ? 'Hide Secret Code' : 'Show Secret Code'}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="block text-[11px] text-slate-500 mt-1.5 font-mono">
                Server-authenticated &amp; rate-limited protection.
              </span>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isVerifying || !secretCode}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                isVerifying || !secretCode
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying with Server...' : 'Unlock Admin Dashboard'}</span>
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
            Protected under Lazy To Earn Security Protocol. Unrecognized attempts are logged to the audit repository.
          </div>
        </div>
      </div>
    </div>
  );
};
