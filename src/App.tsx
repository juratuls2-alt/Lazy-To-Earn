import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationBar } from './components/NotificationBar';
import { Navbar } from './components/Navbar';
import { PublicNavbar } from './components/public/PublicNavbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Overview } from './components/Overview';
import { WatchAds } from './components/WatchAds';
import { EarnMore } from './components/EarnMore';
import { ReferralSystem } from './components/ReferralSystem';
import { WithdrawSection } from './components/WithdrawSection';
import { WithdrawalHistory } from './components/WithdrawalHistory';
import { Profile } from './components/Profile';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { NotificationsCenter } from './components/NotificationsCenter';
import { GameZone } from './components/GameZone';
import { LuckySpin } from './components/LuckySpin';
import { DailyMissions } from './components/DailyMissions';
import { ScratchCards } from './components/ScratchCards';
import { Tournaments } from './components/Tournaments';
import { Achievements } from './components/Achievements';
import { VipMembership } from './components/VipMembership';
import { EarningsAnalytics } from './components/EarningsAnalytics';
import { PromoCode } from './components/PromoCode';
import { WalletPage } from './components/WalletPage';
import { LiveSupport } from './components/LiveSupport';
import { ResponsibleGamingPage } from './components/public/ResponsibleGaming';
import { MonthlyRewardCalendar } from './components/MonthlyRewardCalendar';
import { PublicProfileView } from './components/PublicProfileView';
import { SecurityTrustCenter } from './components/SecurityTrustCenter';
import { LiveActivityFeed } from './components/LiveActivityFeed';
import { VipClubhouse } from './components/VipClubhouse';
import { MonthlyReportsCenter } from './components/MonthlyReportsCenter';
import { GiftCenter } from './components/GiftCenter';
import { PlatformNewsCenter } from './components/PlatformNewsCenter';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { OfflineIndicator } from './components/OfflineIndicator';

// Public Pages
import { LandingPage } from './components/public/LandingPage';
import { LoginPage } from './components/public/LoginPage';
import { SignupPage } from './components/public/SignupPage';
import { ForgotPasswordModal } from './components/public/ForgotPasswordModal';
import {
  AboutUsPage,
  HowItWorksPage,
  FAQPage,
  ContactUsPage,
  TermsPage,
  PrivacyPage,
} from './components/public/InfoPages';

import { BLOG_OFFICIAL_LINK } from './utils/adLinks';
import { Coins, ExternalLink, Shield } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, setCurrentView, isAuthenticated, user, addToast } = useApp();
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('lte_admin_token');
    }
    return false;
  });

  // Verify server session on mount or view change
  useEffect(() => {
    const token = sessionStorage.getItem('lte_admin_token');
    if (token) {
      fetch('/api/admin/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid) {
            sessionStorage.removeItem('lte_admin_token');
            setIsAdminUnlocked(false);
          } else {
            setIsAdminUnlocked(true);
          }
        })
        .catch(() => {
          // If server fails or offline, fall back to stored token
        });
    } else {
      setIsAdminUnlocked(false);
    }
  }, [currentView]);

  const handleAdminLock = async () => {
    const token = sessionStorage.getItem('lte_admin_token');
    if (token) {
      try {
        await fetch('/api/admin/lock', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    sessionStorage.removeItem('lte_admin_token');
    sessionStorage.removeItem('lte_admin_expires');
    setIsAdminUnlocked(false);
    addToast('Admin Locked', 'Administrator dashboard has been locked securely.', 'info');
    setCurrentView('admin_login');
  };

  const isPublicView = [
    'home',
    'about',
    'how_it_works',
    'faq',
    'contact',
    'terms',
    'privacy',
    'responsible_gaming',
    'login',
    'signup',
    'admin_login',
  ].includes(currentView);

  const requiresAuth = [
    'dashboard',
    'profile',
    'game_zone',
    'watch_ads',
    'earn_more',
    'refer',
    'withdraw',
    'history',
    'notifications',
    'settings',
    'lucky_spin',
    'daily_missions',
    'scratch_cards',
    'tournaments',
    'achievements',
    'vip_membership',
    'earnings_analytics',
    'promo_code',
    'wallet',
    'live_support',
    'calendar',
    'public_profile',
    'security',
    'activity_feed',
    'vip_club',
    'reports',
    'gifts',
    'news',
  ].includes(currentView);

  const shouldShowLoginGuard = requiresAuth && !isAuthenticated;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Offline & SW Update Indicator */}
      <OfflineIndicator />
      {/* Top Notification Bar with Ticker & Payout Goal Progress */}
      <NotificationBar />

      {/* Conditional Navbar */}
      {isPublicView && !isAuthenticated ? (
        <PublicNavbar />
      ) : isPublicView && isAuthenticated ? (
        <Navbar />
      ) : (
        <Navbar />
      )}

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20 lg:pb-12">
        {shouldShowLoginGuard ? (
          <LoginPage onOpenForgotPassword={() => setForgotPasswordOpen(true)} />
        ) : (
          <>
            {/* Public Pages */}
            {currentView === 'home' && <LandingPage />}
            {currentView === 'about' && <AboutUsPage />}
            {currentView === 'how_it_works' && <HowItWorksPage />}
            {currentView === 'faq' && <FAQPage />}
            {currentView === 'contact' && <ContactUsPage />}
            {currentView === 'terms' && <TermsPage />}
            {currentView === 'privacy' && <PrivacyPage />}
            {currentView === 'responsible_gaming' && <ResponsibleGamingPage />}
            {currentView === 'login' && (
              <LoginPage onOpenForgotPassword={() => setForgotPasswordOpen(true)} />
            )}
            {currentView === 'signup' && <SignupPage />}

            {/* Administrator Secret Code Login */}
            {currentView === 'admin_login' && (
              <AdminLoginPage
                onUnlockSuccess={() => {
                  setIsAdminUnlocked(true);
                  setCurrentView('admin');
                }}
              />
            )}

            {/* Authenticated Dashboard Pages */}
            {currentView === 'dashboard' && <Overview />}
            {currentView === 'game_zone' && <GameZone />}
            {currentView === 'profile' && <Profile />}
            {currentView === 'watch_ads' && <WatchAds />}
            {currentView === 'earn_more' && <EarnMore />}
            {currentView === 'refer' && <ReferralSystem />}
            {currentView === 'withdraw' && <WithdrawSection />}
            {currentView === 'history' && <WithdrawalHistory />}
            {currentView === 'notifications' && <NotificationsCenter />}
            {currentView === 'settings' && <Profile />}

            {/* 10+ Complete Platform Earning & Engagement Modules */}
            {currentView === 'lucky_spin' && <LuckySpin />}
            {currentView === 'daily_missions' && <DailyMissions />}
            {currentView === 'scratch_cards' && <ScratchCards />}
            {currentView === 'tournaments' && <Tournaments />}
            {currentView === 'achievements' && <Achievements />}
            {currentView === 'vip_membership' && <VipMembership />}
            {currentView === 'earnings_analytics' && <EarningsAnalytics />}
            {currentView === 'promo_code' && <PromoCode />}
            {currentView === 'wallet' && <WalletPage />}
            {currentView === 'live_support' && <LiveSupport />}
            {currentView === 'calendar' && <MonthlyRewardCalendar />}
            {currentView === 'public_profile' && <PublicProfileView />}
            {currentView === 'security' && <SecurityTrustCenter />}
            {currentView === 'activity_feed' && <LiveActivityFeed />}
            {currentView === 'vip_club' && <VipClubhouse />}
            {currentView === 'reports' && <MonthlyReportsCenter />}
            {currentView === 'gifts' && <GiftCenter />}
            {currentView === 'news' && <PlatformNewsCenter />}

            {/* Administrator Dashboard Protected by Secret Code Verification */}
            {currentView === 'admin' && (
              isAdminUnlocked ? (
                <AdminPanel onLockDashboard={handleAdminLock} />
              ) : (
                <AdminLoginPage
                  onUnlockSuccess={() => {
                    setIsAdminUnlocked(true);
                    setCurrentView('admin');
                  }}
                />
              )
            )}
          </>
        )}
      </main>

      {/* AI Personal Assistant Floating Widget */}
      <AIAssistantWidget />

      {/* Mobile Bottom Navigation Bar */}
      {isAuthenticated && <MobileBottomNav />}

      {/* Global Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-10 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">Lazy To Earn</span>
              <p className="text-[11px] text-slate-400">
                Official Account &amp; Payment Gateway for lasytoearn.blogspot.com
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <button
              onClick={() => setCurrentView('home')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('about')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button
              onClick={() => setCurrentView('how_it_works')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => setCurrentView('faq')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Contact Us
            </button>
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              onClick={() => setCurrentView('privacy')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() => setCurrentView('responsible_gaming')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Fair Play
            </button>
            <button
              onClick={() => setCurrentView(isAdminUnlocked ? 'admin' : 'admin_login')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              title="Administrator Secret Code Login"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </button>
            <a
              href={BLOG_OFFICIAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Official Blog</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <span>bKash</span>
            <span>·</span>
            <span>Nagad</span>
            <span>·</span>
            <span>USDT TRC20</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">Min Payout: $100.00</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>&copy; {new Date().getFullYear()} Lazy To Earn. All rights reserved. Strict personal data isolation enforced.</span>
          <span className="flex items-center gap-1">
            Official Portal:{' '}
            <a
              href={BLOG_OFFICIAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline font-mono"
            >
              https://lasytoearn.blogspot.com
            </a>
          </span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
