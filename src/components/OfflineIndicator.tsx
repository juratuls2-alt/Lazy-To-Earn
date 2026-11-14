import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, swNeedsRefresh, applySwUpdate } = usePWAInstall();
  const { t } = useApp();

  if (isOnline && !swNeedsRefresh) return null;

  return (
    <div className="w-full px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-center gap-3 bg-slate-900 border-b border-amber-500/40 text-amber-300">
      {!isOnline && (
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t('common.offline_banner')}</span>
        </div>
      )}
      {swNeedsRefresh && (
        <button
          onClick={applySwUpdate}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Update Available — Reload App</span>
        </button>
      )}
    </div>
  );
};
