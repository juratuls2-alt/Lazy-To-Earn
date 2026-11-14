import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const { t, addToast } = useApp();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (isInstalled) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Installed</span>
      </span>
    );
  }

  const handleClick = async () => {
    const res = await promptInstall();
    if (res === 'accepted') {
      addToast('Lazy To Earn Installed!', 'App added to your home screen for quick access.', 'success');
    } else if (res === 'ios_instructions') {
      setShowIosGuide(true);
    } else if (res === 'unavailable') {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all cursor-pointer ${
          compact
            ? 'px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs'
            : 'px-3.5 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-slate-950 text-xs shadow-md shadow-amber-500/15'
        }`}
        title={t('common.install_app')}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{canInstall ? t('common.install_app') : t('common.install_app')}</span>
      </button>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Install Lazy To Earn App</span>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>Install Lazy To Earn on your phone or desktop for fast mobile navigation &amp; offline view caching:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>
                  <strong className="text-white">Android / Desktop Chrome / Edge:</strong> Click the{' '}
                  <strong className="text-amber-400">Install App</strong> icon in your browser address bar or menu (&ldquo;Add to Home screen&rdquo;).
                </li>
                <li>
                  <strong className="text-white">iOS Safari:</strong> Tap the <strong className="text-amber-400">Share</strong> button and choose{' '}
                  <strong className="text-white">Add to Home Screen</strong>.
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
