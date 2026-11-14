import React, { useState } from 'react';
import { useApp, AppView } from '../context/AppContext';
import {
  Coins,
  Tv,
  Gamepad2,
  Users,
  Wallet,
  History,
  User,
  Bell,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Disc,
  CalendarCheck,
  Sparkles,
  Trophy,
  Award,
  Crown,
  TrendingUp,
  Tag,
  LifeBuoy,
  Sun,
  Moon,
  ChevronDown,
  CalendarDays,
  ShieldCheck,
  Activity,
  Gift,
  Newspaper,
  FileSpreadsheet,
  Languages,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    user,
    currentView,
    setCurrentView,
    logout,
    unreadNotificationCount,
    isAdmin,
    theme,
    toggleTheme,
    language,
    setLanguage,
    availableLanguages,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rewardsMenuOpen, setRewardsMenuOpen] = useState(false);

  const mainNavItems: Array<{ id: AppView; label: string; icon: any; badge?: number }> = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Coins },
    { id: 'calendar', label: t('nav.calendar'), icon: CalendarDays },
    { id: 'daily_missions', label: t('nav.missions'), icon: CalendarCheck },
    { id: 'tournaments', label: t('nav.tournaments'), icon: Trophy },
    { id: 'game_zone', label: t('nav.game_zone'), icon: Gamepad2 },
    { id: 'watch_ads', label: t('nav.watch_ads'), icon: Tv },
  ];

  const secondaryNavItems: Array<{ id: AppView; label: string; icon: any; badge?: number }> = [
    { id: 'vip_club', label: t('nav.vip_club'), icon: Crown },
    { id: 'activity_feed', label: t('nav.activity_feed'), icon: Activity },
    { id: 'public_profile', label: t('nav.public_profile'), icon: Award },
    { id: 'gifts', label: t('nav.gifts'), icon: Gift },
    { id: 'news', label: t('nav.news'), icon: Newspaper },
    { id: 'reports', label: t('nav.reports'), icon: FileSpreadsheet },
    { id: 'security', label: t('nav.security'), icon: ShieldCheck },
    { id: 'lucky_spin', label: t('nav.lucky_spin'), icon: Disc },
    { id: 'scratch_cards', label: t('nav.scratch_cards'), icon: Sparkles },
    { id: 'wallet', label: t('nav.wallet'), icon: Wallet },
    { id: 'withdraw', label: t('nav.withdraw'), icon: Coins },
    { id: 'vip_membership', label: t('nav.vip_membership'), icon: Crown },
    { id: 'earnings_analytics', label: t('nav.analytics'), icon: TrendingUp },
    { id: 'achievements', label: t('nav.public_profile'), icon: Award },
    { id: 'promo_code', label: t('nav.promo_code'), icon: Tag },
    { id: 'refer', label: t('nav.refer'), icon: Users },
    { id: 'live_support', label: t('nav.support'), icon: LifeBuoy },
    { id: 'profile', label: t('nav.profile'), icon: User },
    {
      id: 'notifications',
      label: t('nav.notifications'),
      icon: Bell,
      badge: unreadNotificationCount,
    },
  ];

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-amber-500/15 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Lazy To Earn
                {user?.vipTier && user.vipTier !== 'Free' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {user.vipTier}
                  </span>
                )}
              </span>
              <span className="block text-[10px] font-mono text-amber-400/90 -mt-0.5">
                {user ? `${user.id}` : 'Official Platform'}
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* More Rewards Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRewardsMenuOpen(!rewardsMenuOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rewardsMenuOpen || ['wallet', 'vip_membership', 'achievements', 'promo_code', 'earnings_analytics', 'live_support'].includes(currentView)
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{t('nav.more')}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {rewardsMenuOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-60 max-h-[75vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 space-y-1 z-50 text-xs animate-fadeIn"
                onMouseLeave={() => setRewardsMenuOpen(false)}
              >
                {secondaryNavItems.slice(0, 17).map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setCurrentView(sub.id);
                        setRewardsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                        currentView === sub.id ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <SubIcon className="w-4 h-4 text-slate-400" />
                        <span>{sub.label}</span>
                      </div>
                      {sub.badge ? (
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">
                          {sub.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Right Header Controls: Language, PWA Install, Theme, Points, Balance, Avatar, Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Selector */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-slate-200 font-bold outline-none cursor-pointer"
              aria-label="Select Language"
            >
              {availableLanguages.map((l) => (
                <option key={l.language_code} value={l.language_code} className="bg-slate-900 text-white">
                  {l.language_code.toUpperCase()} · {l.language_name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:block">
            <PWAInstallButton compact />
          </div>

          {/* Light/Dark Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Points Pill */}
          {user && (
            <button
              onClick={() => setCurrentView('wallet')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-amber-300 text-xs font-mono font-bold cursor-pointer transition-colors"
              title="Reward Points - Click to convert"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.points || 0} pts</span>
            </button>
          )}

          {/* Balance Widget */}
          {user && (
            <button
              onClick={() => setCurrentView('withdraw')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-colors text-left cursor-pointer shadow-sm group"
              title="Click to withdraw funds"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-[8px] text-slate-400 uppercase tracking-wider font-mono">
                  Cashout
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors tabular-nums">
                  ${user.availableBalance.toFixed(2)}
                </span>
              </div>
            </button>
          )}

          {/* Quick Notification Bell */}
          <button
            onClick={() => setCurrentView('notifications')}
            className="relative p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User profile avatar & Logout */}
          {user && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentView('profile')}
                className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 hover:border-amber-400 transition-colors cursor-pointer"
                title={`${user.name} - Open My Profile`}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-4 space-y-1.5 text-xs max-h-[80vh] overflow-y-auto">
          {[...mainNavItems, ...secondaryNavItems].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl ${
                  isActive ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-amber-400 hover:bg-slate-900 font-bold"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Management Dashboard</span>
            </button>
          )}

          <button
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-red-400 hover:bg-slate-900 font-bold pt-2 border-t border-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Secure Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};
