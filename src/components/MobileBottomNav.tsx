import React from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Tv, Gamepad2, Users, Wallet, User, Bell } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, t } = useApp();

  interface TabItem {
    id: 'dashboard' | 'game_zone' | 'watch_ads' | 'refer' | 'withdraw' | 'notifications' | 'profile';
    label: string;
    icon: any;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'dashboard', label: t('nav.dashboard', 'Home'), icon: Coins },
    { id: 'game_zone', label: t('nav.games', 'Games'), icon: Gamepad2 },
    { id: 'watch_ads', label: t('nav.watch_ads', 'Ads'), icon: Tv },
    { id: 'refer', label: t('nav.refer', 'Refer $10'), icon: Users },
    { id: 'withdraw', label: t('nav.withdraw', 'Withdraw'), icon: Wallet },
    { id: 'profile', label: t('nav.profile', 'Profile'), icon: User },
  ];

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id as any)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer min-w-[48px] ${
              isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-md ${isActive ? 'bg-amber-500/20' : ''}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
