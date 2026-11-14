import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserAccount,
  WithdrawalRecord,
  UserNotification,
  AdminAuditLog,
  DailyStreakInfo,
  PaymentMethod,
  GameDefinition,
  UserGameHistoryRecord,
  GameZoneSettings,
  VIPTierLevel,
  VIPTierConfig,
  VIPSystemSettings,
  VIPMembershipStatus,
  WalletTransaction,
  SpinSegment,
  SpinRecord,
  DailyMission,
  ScratchCardConfig,
  ScratchCardPlay,
  Tournament,
  TournamentParticipant,
  AchievementBadge,
  PromoCode,
  SupportTicket,
  AdPlacementConfig,
  WithdrawalScheduleConfig,
  WithdrawalScheduleStatus,
} from '../types';
import {
  db,
  VIP_TIERS,
  SPIN_SEGMENTS,
  SCRATCH_CARDS,
  getEffectiveVipTier,
  getHighestVipTier,
  isVipMembershipExpired,
} from '../db/mockDb';
import { openAdMonetizationLink } from '../utils/adLinks';
import { evaluateWithdrawalSchedule } from '../utils/withdrawalScheduler';
import { SupportedLanguage, translateKey } from '../i18n/translations';

export type AppView =
  | 'home'
  | 'about'
  | 'how_it_works'
  | 'faq'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'responsible_gaming'
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'dashboard'
  | 'lucky_spin'
  | 'daily_missions'
  | 'scratch_cards'
  | 'tournaments'
  | 'achievements'
  | 'vip_membership'
  | 'earnings_analytics'
  | 'promo_code'
  | 'wallet'
  | 'withdraw'
  | 'refer'
  | 'watch_ads'
  | 'earn_more'
  | 'game_zone'
  | 'calendar'
  | 'public_profile'
  | 'security'
  | 'activity_feed'
  | 'vip_club'
  | 'reports'
  | 'gifts'
  | 'news'
  | 'live_support'
  | 'profile'
  | 'notifications'
  | 'settings'
  | 'history'
  | 'admin'
  | 'admin_login';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'bonus' | 'error';
}

interface AppContextType {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Multi-Language & i18n
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  availableLanguages: Array<{ language_code: string; language_name: string }>;
  t: (key: string, fallback?: string) => string;
  refreshTranslations: () => void;

  // Public Profile Navigation Target
  viewedProfileHandle: string | null;
  openPublicProfile: (handle?: string) => void;
  creditCalendarReward: (rewardType: string, rewardValue: number, title: string) => void;
  deductGiftPoints: (pointsCost: number, giftName: string) => boolean;

  // Auth & Session
  user: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => { success: boolean; error?: string };
  register: (
    name: string,
    email: string,
    phone: string,
    pass: string,
    refCode?: string
  ) => { success: boolean; error?: string; user?: UserAccount };
  verifyEmail: (code: string) => boolean;
  requestPasswordReset: (email: string) => { success: boolean; error?: string; tempCode?: string };
  resetPassword: (email: string, code: string, newPass: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<UserAccount>) => void;
  switchUser: (userId: string) => void;

  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Data & Ledger
  userWithdrawals: WithdrawalRecord[];
  userTransactions: WalletTransaction[];
  allTransactions: WalletTransaction[];
  userNotifications: UserNotification[];
  unreadNotificationCount: number;
  markNotificationsAsRead: () => void;

  // Wallet & Withdrawals
  minWithdrawal: number;
  withdrawalScheduleConfig: WithdrawalScheduleConfig;
  withdrawalScheduleStatus: WithdrawalScheduleStatus;
  refreshWithdrawalSchedule: () => void;
  adminUpdateWithdrawalSchedule: (updates: Partial<WithdrawalScheduleConfig>) => Promise<boolean>;
  submitWithdrawal: (
    method: PaymentMethod,
    amount: number,
    accountNumber: string,
    accountType?: any
  ) => Promise<{ success: boolean; error?: string }>;
  convertPointsToCash: (points: number) => { success: boolean; cash: number; error?: string };

  // Lucky Spin
  spinWheel: () => Promise<{ success: boolean; segment: SpinSegment; error?: string }>;
  userSpinHistory: SpinRecord[];

  // Daily Missions
  missions: DailyMission[];
  claimMission: (missionId: string) => { success: boolean; cash: number; points: number; error?: string };

  // Scratch Cards
  scratchCard: (cardId: string) => { success: boolean; play?: ScratchCardPlay; error?: string };
  userScratchHistory: ScratchCardPlay[];

  // Gaming Tournaments
  tournaments: Tournament[];
  joinTournament: (tournamentId: string) => { success: boolean; error?: string };
  recordTournamentScore: (tournamentId: string, score: number) => boolean;

  // Achievements & Badges
  achievements: AchievementBadge[];
  claimAchievement: (achievementId: string) => { success: boolean; points: number; cash: number; error?: string };

  // VIP Membership (30-Day Validity & No Downgrades)
  effectiveVipTier: VIPTierLevel;
  vipSystemSettings: VIPSystemSettings;
  vipTiersConfig: Record<VIPTierLevel, VIPTierConfig>;
  vipMembershipStatus: VIPMembershipStatus | null;
  refreshVipStatus: () => Promise<void>;
  purchaseVip: (
    tier: VIPTierLevel,
    paymentMethod: 'Wallet Balance',
    paymentReference: string
  ) => Promise<{ success: boolean; error?: string }>;
  upgradeVip: (tier: VIPTierLevel) => Promise<{ success: boolean; error?: string }>;

  // Promo Codes
  redeemPromoCode: (code: string) => { success: boolean; message?: string; error?: string };

  // Live Support Tickets
  tickets: SupportTicket[];
  userTickets: SupportTicket[];
  createTicket: (subject: string, category: any, message: string, priority?: any) => SupportTicket;
  replyTicket: (ticketId: string, message: string) => boolean;
  adminReplyTicket: (ticketId: string, message: string) => boolean;
  adminResolveTicket: (ticketId: string) => boolean;

  // Advertising & Monetization
  adPlacements: AdPlacementConfig[];
  recordAdImpression: (adId: string) => void;
  adminUpdateAdPlacement: (id: string, updates: Partial<AdPlacementConfig>) => void;

  // Daily Streak & Ads
  streak: DailyStreakInfo;
  claimDailyBonus: () => number;
  recordAdWatched: (baseReward: number) => { earned: number; multiplier: number };
  claimEarnMoreBonus: () => void;
  recordGameReward: (isWin: boolean, gameName: string) => number;

  // Games & Arcade
  games: GameDefinition[];
  userGameHistory: UserGameHistoryRecord[];
  allGameHistory: UserGameHistoryRecord[];
  gameSettings: GameZoneSettings;
  recordGameSession: (
    gameId: string,
    gameName: string,
    score: number,
    isWin: boolean,
    durationSeconds: number
  ) => { success: boolean; reward: number; error?: string };
  adminUpdateGame: (game: GameDefinition) => void;
  adminAddGame: (game: GameDefinition) => void;
  adminDeleteGame: (id: string) => void;
  adminToggleGame: (id: string) => void;
  adminUpdateGameSettings: (settings: Partial<GameZoneSettings>) => void;

  // Referrals
  referralLink: string;
  topReferrers: ReturnType<typeof db.getTopReferrers>;
  addSimulatedReferral: () => void;
  previewReferralLink: (code?: string) => void;

  // Admin capabilities
  allUsers: UserAccount[];
  allWithdrawals: WithdrawalRecord[];
  adminAuditLogs: AdminAuditLog[];
  adminApproveWithdrawal: (id: string) => void;
  adminPayWithdrawal: (id: string, ref: string) => void;
  adminRejectWithdrawal: (id: string, reason: string) => void;
  adminSendNotification: (targetUserId: string, title: string, message: string) => void;
  adminToggleUserStatus: (userId: string) => void;

  // Toasts
  toasts: ToastItem[];
  addToast: (title: string, message: string, type?: 'success' | 'info' | 'bonus' | 'error') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MULTIPLIERS = [1.0, 1.1, 1.25, 1.4, 1.6, 1.8, 2.0];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lte_theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('lte_theme', next);
      if (next === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  // Session initialization
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const sessionUserId = localStorage.getItem('lte_session_user_id');
    if (sessionUserId) {
      return db.getUserById(sessionUserId) || null;
    }
    return db.getUserById('LTE-782910') || null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('ref')) return 'signup';
      if (p.get('profile')) return 'public_profile';
    }
    return 'dashboard';
  });

  const [viewedProfileHandle, setViewedProfileHandle] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('profile');
    }
    return null;
  });

  const openPublicProfile = (handle?: string) => {
    setViewedProfileHandle(handle || currentUser?.id || null);
    setCurrentView('public_profile');
  };

  // Multi-Language State
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lte_lang') || 'en';
    }
    return 'en';
  });
  const [translationOverrides, setTranslationOverrides] = useState<Record<string, Record<string, string>>>({});
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ language_code: string; language_name: string }>>([
    { language_code: 'en', language_name: 'English' },
    { language_code: 'bn', language_name: 'বাংলা' },
  ]);

  const refreshTranslations = () => {
    fetch('/api/i18n/strings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.dictionaries) setTranslationOverrides(data.dictionaries);
        if (Array.isArray(data?.languages) && data.languages.length > 0) {
          setAvailableLanguages(data.languages);
        }
      })
      .catch(() => {});
  };

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lte_lang', lang);
      document.documentElement.lang = lang;
    }
    if (currentUser) {
      fetch('/api/i18n/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, languageCode: lang }),
      }).catch(() => {});
    }
  };

  const t = (key: string, fallback?: string) => translateKey(language, key, translationOverrides, fallback);

  const creditCalendarReward = (rewardType: string, rewardValue: number, title: string) => {
    if (!currentUser) return;
    if (rewardType === 'points') {
      currentUser.points = (currentUser.points || 0) + Math.round(rewardValue);
      db.saveUser(currentUser);
      db.addTransaction(currentUser.id, 'credit', 'bonus', 0, `Calendar Reward: ${title} (+${rewardValue} pts)`, Math.round(rewardValue));
    } else if (rewardType === 'cash' || rewardType === 'promo_credit') {
      currentUser.availableBalance = +(currentUser.availableBalance + rewardValue).toFixed(2);
      currentUser.totalEarnings = +(currentUser.totalEarnings + rewardValue).toFixed(2);
      currentUser.todayEarnings = +(currentUser.todayEarnings + rewardValue).toFixed(2);
      db.saveUser(currentUser);
      db.addTransaction(currentUser.id, 'credit', rewardType === 'promo_credit' ? 'promo' : 'bonus', rewardValue, `Calendar Reward: ${title}`);
    } else if (rewardType === 'multiplier_boost') {
      setStreak((prev) => ({ ...prev, multiplier: Math.max(prev.multiplier, rewardValue) }));
    }
    setCurrentUser({ ...currentUser });
    notifyDbChange();
  };

  const deductGiftPoints = (pointsCost: number, giftName: string): boolean => {
    if (!currentUser) return false;
    if ((currentUser.points || 0) < pointsCost) {
      addToast('Insufficient Points', `Need ${pointsCost} points to send ${giftName}.`, 'error');
      return false;
    }
    currentUser.points = (currentUser.points || 0) - pointsCost;
    db.saveUser(currentUser);
    db.addTransaction(currentUser.id, 'debit', 'bonus', 0, `Sent Non-Cash Collectible Gift: ${giftName}`, -pointsCost);
    setCurrentUser({ ...currentUser });
    notifyDbChange();
    return true;
  };

  // DB Sync Trigger
  const [dbVersion, setDbVersion] = useState<number>(0);
  const notifyDbChange = () => setDbVersion((v) => v + 1);

  // Daily Streak
  const [streak, setStreak] = useState<DailyStreakInfo>(() => {
    const saved = localStorage.getItem('lte_streak');
    return saved
      ? JSON.parse(saved)
      : {
          currentDay: 4,
          multiplier: 1.4,
          lastClaimDate: '',
          streakActive: true,
          adsWatchedToday: 3,
          adsTargetToday: 5,
        };
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [scheduleTick, setScheduleTick] = useState<number>(0);

  const [vipSystemSettings, setVipSystemSettings] = useState<VIPSystemSettings>({
    validityDays: 30,
    allowUpgrades: true,
    allowRenewal: true,
    allowUpgradeWhileExpired: true,
    autoChargeEnabled: false,
  });
  const [vipTiersConfig, setVipTiersConfig] = useState<Record<VIPTierLevel, VIPTierConfig>>(VIP_TIERS);
  const [vipMembershipStatus, setVipMembershipStatus] = useState<VIPMembershipStatus | null>(null);

  const refreshVipStatus = async () => {
    try {
      const cfgRes = await fetch('/api/vip/config');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.settings) setVipSystemSettings(cfgData.settings);
        if (cfgData.tiers) setVipTiersConfig((prev) => ({ ...prev, ...cfgData.tiers }));
      }
      if (currentUser?.id) {
        const stRes = await fetch(`/api/vip/status/${encodeURIComponent(currentUser.id)}`);
        if (stRes.ok) {
          const stData: VIPMembershipStatus = await stRes.json();
          setVipMembershipStatus(stData);
          if (stData.status !== 'none') {
            const latest = db.getUserById(currentUser.id);
            if (latest) {
              const targetStatus = stData.status;
              const targetTier = stData.status === 'active' ? stData.effectiveTier : stData.lastPurchasedTier;
              let changed = false;
              if (latest.vipStatus !== targetStatus) {
                latest.vipStatus = targetStatus;
                changed = true;
              }
              if (stData.highestTier && latest.highestVipTier !== stData.highestTier) {
                latest.highestVipTier = stData.highestTier;
                changed = true;
              }
              if (stData.activatedAt && latest.vipStartedAt !== stData.activatedAt) {
                latest.vipStartedAt = stData.activatedAt;
                changed = true;
              }
              if (stData.expiresAt && latest.vipExpiresAt !== stData.expiresAt) {
                latest.vipExpiresAt = stData.expiresAt;
                latest.vipExpiryDate = stData.expiresAt.split('T')[0];
                changed = true;
              }
              if (targetTier && latest.vipTier !== targetTier) {
                latest.vipTier = targetTier;
                changed = true;
              }
              if (changed) {
                db.saveUser(latest);
                setCurrentUser({ ...latest });
              }
            }
          }
        }
      } else {
        setVipMembershipStatus(null);
      }
    } catch {
      // Fall back gracefully to local state
    }
  };

  // Sync backend withdrawal schedule, VIP config & translations on mount
  useEffect(() => {
    fetch('/api/withdrawals/schedule')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config) {
          db.updateWithdrawalScheduleConfig(data.config);
          notifyDbChange();
        }
      })
      .catch(() => {});

    refreshTranslations();
    refreshVipStatus();
  }, [currentUser?.id]);

  const withdrawalScheduleConfig = db.getWithdrawalScheduleConfig();
  const minWithdrawal = withdrawalScheduleConfig.minWithdrawal || 100.0;

  // Persist session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('lte_session_user_id', currentUser.id);
    } else {
      localStorage.removeItem('lte_session_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('lte_streak', JSON.stringify(streak));
  }, [streak]);

  // Toast Helper
  const addToast = (title: string, message: string, type: 'success' | 'info' | 'bonus' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Auth Actions ---
  const login = (email: string, pass: string, rememberMe = true): { success: boolean; error?: string } => {
    const found = db.getUserByEmail(email.trim());
    if (!found) {
      return { success: false, error: 'No account found with this email address.' };
    }
    if (found.password !== pass) {
      return { success: false, error: 'Incorrect password. Please try again or use Forgot Password.' };
    }
    if (found.accountStatus === 'Suspended') {
      return { success: false, error: 'Your account is suspended by platform administration. Contact support.' };
    }

    // Refresh daily login mission
    const today = new Date().toISOString().split('T')[0];
    if (found.lastDailyLoginDate !== today) {
      found.lastDailyLoginDate = today;
      found.spinsUsedToday = 0;
      found.scratchesUsedToday = 0;
      found.todayEarnings = 0;
      db.saveUser(found);
      db.updateMissionProgress('mis_daily_login', 1);
    }

    setCurrentUser(found);
    if (rememberMe) {
      localStorage.setItem('lte_session_user_id', found.id);
    }
    addToast('Welcome Back!', `Signed in as ${found.name}`, 'success');
    setCurrentView(found.role === 'admin' ? 'admin' : 'dashboard');
    notifyDbChange();
    return { success: true };
  };

  const register = (
    name: string,
    email: string,
    phone: string,
    pass: string,
    refCode?: string
  ): { success: boolean; error?: string; user?: UserAccount } => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please login instead.' };
    }

    const uniqueId = `LTE-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRefCode = name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() + Math.floor(10 + Math.random() * 90);

    const cleanRef = refCode?.trim();
    const matchedReferrer = cleanRef
      ? db.getUsers().find((u) => u.referralCode.toLowerCase() === cleanRef.toLowerCase())
      : undefined;

    const newUser: UserAccount = {
      id: uniqueId,
      name: name.trim(),
      email: cleanEmail,
      password: pass,
      phone: phone.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      referralCode: newRefCode,
      referredBy: matchedReferrer ? matchedReferrer.referralCode : cleanRef || undefined,
      registrationDate: new Date().toISOString().split('T')[0],
      accountStatus: 'Active',
      emailVerified: true,
      role: 'user',
      availableBalance: 5.0, // Starter $5 gift
      pendingBalance: 0,
      totalEarnings: 5.0,
      lifetimeEarnings: 5.0,
      todayEarnings: 5.0,
      points: 200,
      referralEarnings: 0,
      adEarnings: 0,
      totalWithdrawals: 0,
      vipTier: 'Free',
      spinsUsedToday: 0,
      scratchesUsedToday: 0,
      adsWatchedToday: 0,
      lastDailyLoginDate: new Date().toISOString().split('T')[0],
      bkashNumber: phone.trim(),
      nagadNumber: '',
      preferredPaymentMethod: 'bKash',
      usdtWallet: '',
    };

    db.saveUser(newUser);

    // Initial transaction
    db.addTransaction(newUser.id, 'credit', 'bonus', 5.0, 'Welcome Starter Gift', 200);

    if (matchedReferrer && matchedReferrer.email !== cleanEmail) {
      const bonus = (vipTiersConfig[getEffectiveVipTier(matchedReferrer)] || VIP_TIERS.Free).referralBonus;
      matchedReferrer.availableBalance = +(matchedReferrer.availableBalance + bonus).toFixed(2);
      matchedReferrer.totalEarnings = +(matchedReferrer.totalEarnings + bonus).toFixed(2);
      matchedReferrer.referralEarnings = +(matchedReferrer.referralEarnings + bonus).toFixed(2);
      db.saveUser(matchedReferrer);
      db.addReferralRecord({
        id: 'REF-' + Math.floor(1000 + Math.random() * 9000),
        referrerId: matchedReferrer.id,
        referredUserId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        date: newUser.registrationDate,
        reward: bonus,
        status: 'Verified',
      });
      db.createNotification(
        matchedReferrer.id,
        `Referral Reward! +$${bonus.toFixed(2)}`,
        `${name} joined using your referral link. $${bonus.toFixed(2)} has been credited to your balance!`,
        'referral'
      );
      db.addTransaction(matchedReferrer.id, 'credit', 'referral', bonus, `Referral reward from ${name}`);
      db.updateMissionProgress('mis_invite_friend', 1);
    }

    setCurrentUser(newUser);
    localStorage.setItem('lte_session_user_id', newUser.id);
    addToast('Account Created! 🎉', 'Welcome to Lazy To Earn! Starter bonus of $5.00 + 200 points credited.', 'bonus');
    setCurrentView('dashboard');
    notifyDbChange();
    return { success: true, user: newUser };
  };

  const verifyEmail = (_code: string): boolean => {
    if (!currentUser) return false;
    currentUser.emailVerified = true;
    db.saveUser(currentUser);
    setCurrentUser({ ...currentUser });
    notifyDbChange();
    addToast('Email Verified!', 'Your account email has been successfully verified.', 'success');
    return true;
  };

  const requestPasswordReset = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = db.getUserByEmail(cleanEmail);
    if (!found) {
      return { success: false, error: 'No account found with this email address.' };
    }
    const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
    addToast('Reset Code Sent', `Verification code sent to ${cleanEmail}. (Code: ${tempCode})`, 'info');
    return { success: true, tempCode };
  };

  const resetPassword = (email: string, _code: string, newPass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = db.getUserByEmail(cleanEmail);
    if (!found) return { success: false, error: 'User not found.' };
    found.password = newPass;
    db.saveUser(found);
    addToast('Password Changed', 'Your password has been updated. Please sign in.', 'success');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lte_session_user_id');
    addToast('Signed Out', 'You have been safely signed out.', 'info');
    setCurrentView('login');
    notifyDbChange();
  };

  const updateProfile = (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    db.saveUser(updated);
    setCurrentUser(updated);
    notifyDbChange();
    addToast('Profile Updated', 'Your settings and wallet information have been saved.', 'success');
  };

  const switchUser = (userId: string) => {
    const found = db.getUserById(userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('lte_session_user_id', found.id);
      addToast('Profile Switched', `Viewing platform as ${found.name} (${found.id})`, 'info');
      notifyDbChange();
    }
  };

  // --- Lucky Spin Wheel ---
  const spinWheel = async () => {
    if (!currentUser) {
      return { success: false, segment: SPIN_SEGMENTS[0], error: 'Please sign in to spin.' };
    }

    try {
      // 1. Try server verification API first
      const res = await fetch('/api/spin/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, vipTier: getEffectiveVipTier(currentUser) }),
      });
      if (res.ok) {
        const data = await res.json();
        // Sync with local DB service
        const localResult = db.spinWheel(currentUser.id);
        const refreshed = db.getUserById(currentUser.id);
        if (refreshed) setCurrentUser(refreshed);
        notifyDbChange();
        db.updateMissionProgress('mis_lucky_spin', 1);

        if (data.type === 'cash') {
          confetti({ particleCount: 70, spread: 80 });
          addToast('Lucky Spin Winner! 🎡', `You won ${data.label}! Credited to your cash balance.`, 'bonus');
        } else if (data.type === 'points') {
          addToast('Points Won! 🎡', `+${data.value} points added to your rewards wallet!`, 'bonus');
        }
        return { success: true, segment: localResult.segment };
      }
    } catch (_err) {
      // Fallback to local DB server calculation
    }

    const localRes = db.spinWheel(currentUser.id);
    const refreshed = db.getUserById(currentUser.id);
    if (refreshed) setCurrentUser(refreshed);
    notifyDbChange();
    db.updateMissionProgress('mis_lucky_spin', 1);
    return localRes;
  };

  // --- Daily Missions ---
  const claimMission = (missionId: string) => {
    if (!currentUser) return { success: false, cash: 0, points: 0, error: 'Sign in required' };
    const res = db.claimMission(currentUser.id, missionId);
    if (res.success) {
      const refreshed = db.getUserById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
      confetti({ particleCount: 60, spread: 70 });
      addToast('Mission Completed! 🎯', `Claimed +$${res.cash.toFixed(2)} cash and +${res.points} points!`, 'bonus');
      notifyDbChange();
    } else {
      addToast('Mission Error', res.error || 'Could not claim reward.', 'error');
    }
    return res;
  };

  // --- Scratch Cards ---
  const scratchCard = (cardId: string) => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const res = db.scratchCard(currentUser.id, cardId);
    if (res.success && res.play) {
      const refreshed = db.getUserById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
      db.updateMissionProgress('mis_scratch_card', 1);
      notifyDbChange();

      if (res.play.isWin) {
        confetti({ particleCount: 80, spread: 80 });
        addToast('Jackpot Match! 💎', `Won +$${res.play.prizeAmount.toFixed(2)} cash on ${res.play.tier.toUpperCase()} scratch card!`, 'bonus');
      } else {
        addToast('Better Luck Next Time', 'Matched 2 symbols. Scratch again to unlock instant cash!', 'info');
      }
    } else {
      addToast('Scratch Error', res.error || 'Cannot play card.', 'error');
    }
    return res;
  };

  // --- Tournaments ---
  const joinTournament = (tournamentId: string) => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const res = db.joinTournament(currentUser.id, tournamentId);
    if (res.success) {
      const refreshed = db.getUserById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
      notifyDbChange();
      addToast('Tournament Enrolled! 🏆', 'You are now entered on the live leaderboard. Play to climb ranks!', 'success');
    } else {
      addToast('Tournament Entry Failed', res.error || 'Could not join.', 'error');
    }
    return res;
  };

  const recordTournamentScore = (tournamentId: string, score: number) => {
    if (!currentUser) return false;
    const ok = db.recordTournamentScore(currentUser.id, tournamentId, score);
    if (ok) {
      notifyDbChange();
      addToast('Tournament Score Recorded', `New high score: ${score} pts registered!`, 'success');
    }
    return ok;
  };

  // --- Achievements ---
  const claimAchievement = (achievementId: string) => {
    if (!currentUser) return { success: false, points: 0, cash: 0, error: 'Sign in required' };
    const res = db.claimAchievement(currentUser.id, achievementId);
    if (res.success) {
      const refreshed = db.getUserById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
      confetti({ particleCount: 90, spread: 90 });
      addToast('Achievement Badge Claimed! 🎖️', `Unlocked +${res.points} points ${res.cash ? `and +$${res.cash.toFixed(2)} cash` : ''}!`, 'bonus');
      notifyDbChange();
    } else {
      addToast('Claim Failed', res.error || 'Unable to claim.', 'error');
    }
    return res;
  };

  // --- VIP Purchase / Renewal / Upgrade (30-Day Validity, Payment Verification, No Downgrades) ---
  const purchaseVip = async (
    tier: VIPTierLevel,
    paymentMethod: 'Wallet Balance',
    paymentReference: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };

    const tierCfg = vipTiersConfig[tier] || VIP_TIERS[tier];
    const highestTier = getHighestVipTier(currentUser);

    const localRes = db.upgradeVip(currentUser.id, tier, {
      validityDays: vipSystemSettings.validityDays || 30,
      priceOverride: tierCfg.priceMonthly,
      paymentMethod,
      paymentReference,
      allowUpgrades: vipSystemSettings.allowUpgrades,
      allowRenewal: vipSystemSettings.allowRenewal,
      allowUpgradeWhileExpired: vipSystemSettings.allowUpgradeWhileExpired,
    });

    if (!localRes.success) {
      addToast('Action Blocked', localRes.error || 'Could not process VIP membership.', 'error');
      return { success: false, error: localRes.error };
    }

    try {
      const apiRes = await fetch('/api/vip/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          targetTier: tier,
          paymentMethod,
          paymentReference,
          paymentVerified: true,
          clientHighestTier: highestTier,
          clientCurrentTier: getEffectiveVipTier(currentUser),
        }),
      });
      if (apiRes.ok) {
        await refreshVipStatus();
      }
    } catch {
      // Local state still persists
    }

    const refreshed = db.getUserById(currentUser.id);
    if (refreshed) setCurrentUser({ ...refreshed });
    confetti({ particleCount: 100, spread: 100 });
    const verb = localRes.actionType === 'renewal' ? 'Renewed' : localRes.actionType === 'upgrade' ? 'Upgraded' : 'Activated';
    addToast(
      `VIP ${verb}! 👑`,
      `${tierCfg.name} verified & active for ${vipSystemSettings.validityDays || 30} days. Auto-charge disabled.`,
      'bonus'
    );
    notifyDbChange();
    return { success: true };
  };

  const upgradeVip = async (tier: VIPTierLevel) => {
    return purchaseVip(tier, 'Wallet Balance', `WAL-${Date.now().toString(36).toUpperCase()}`);
  };

  // --- Points Conversion ---
  const convertPointsToCash = (pointsToConvert: number) => {
    if (!currentUser) return { success: false, cash: 0, error: 'Sign in required' };
    if (pointsToConvert < 500) {
      return { success: false, cash: 0, error: 'Minimum conversion is 500 points ($0.50 cash).' };
    }
    if (currentUser.points < pointsToConvert) {
      return { success: false, cash: 0, error: `You only have ${currentUser.points} points.` };
    }

    const cash = +(pointsToConvert / 1000).toFixed(2); // 1000 pts = $1.00
    currentUser.points -= pointsToConvert;
    currentUser.availableBalance = +(currentUser.availableBalance + cash).toFixed(2);
    currentUser.totalEarnings = +(currentUser.totalEarnings + cash).toFixed(2);
    db.saveUser(currentUser);
    db.addTransaction(currentUser.id, 'credit', 'bonus', cash, `Converted ${pointsToConvert} points to cash balance`);
    setCurrentUser({ ...currentUser });
    notifyDbChange();
    addToast('Points Converted! 🪙', `+$${cash.toFixed(2)} added to your available cashout balance.`, 'success');
    return { success: true, cash };
  };

  // --- Promo Codes ---
  const redeemPromoCode = (code: string) => {
    if (!currentUser) return { success: false, error: 'Sign in required' };
    const res = db.redeemPromoCode(currentUser.id, code);
    if (res.success) {
      const refreshed = db.getUserById(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
      confetti({ particleCount: 75, spread: 80 });
      addToast('Promo Code Redeemed! 🎁', res.message || 'Reward credited successfully.', 'bonus');
      notifyDbChange();
    } else {
      addToast('Promo Code Error', res.error || 'Code invalid.', 'error');
    }
    return res;
  };

  // --- Support Tickets ---
  const createTicket = (subject: string, category: any, message: string, priority: any = 'Medium') => {
    if (!currentUser) throw new Error('Sign in required');
    const t = db.createTicket(currentUser.id, subject, category, message, priority);
    addToast('Support Ticket Created', `Ticket #${t.id} submitted. Our agents are responding shortly.`, 'success');
    notifyDbChange();
    return t;
  };

  const replyTicket = (ticketId: string, message: string) => {
    if (!currentUser) return false;
    const ok = db.replyTicket(ticketId, 'user', currentUser.name, message);
    if (ok) {
      addToast('Reply Sent', 'Your message has been posted to the ticket.', 'info');
      notifyDbChange();
    }
    return ok;
  };

  const adminReplyTicket = (ticketId: string, message: string) => {
    const ok = db.replyTicket(ticketId, 'admin', 'Admin Staff', message);
    if (ok) {
      addToast('Staff Reply Sent', 'Admin response sent to user ticket.', 'success');
      notifyDbChange();
    }
    return ok;
  };

  const adminResolveTicket = (ticketId: string) => {
    const ok = db.updateTicketStatus(ticketId, 'Resolved');
    if (ok) {
      addToast('Ticket Resolved', `Ticket #${ticketId} marked as resolved.`, 'success');
      notifyDbChange();
    }
    return ok;
  };

  // --- Advertising ---
  const recordAdImpression = (adId: string) => {
    db.recordAdImpression(adId);
    notifyDbChange();
  };

  const adminUpdateAdPlacement = (id: string, updates: Partial<AdPlacementConfig>) => {
    db.updateAdPlacement(id, updates);
    notifyDbChange();
    addToast('Ad Network Updated', 'Ad placement script and parameters updated.', 'success');
  };

  // --- Withdrawals & Monthly Schedule ---
  const refreshWithdrawalSchedule = () => setScheduleTick((t) => t + 1);

  const adminUpdateWithdrawalSchedule = async (updates: Partial<WithdrawalScheduleConfig>): Promise<boolean> => {
    const updated = db.updateWithdrawalScheduleConfig(updates);
    try {
      const token = sessionStorage.getItem('lte_admin_token');
      if (token) {
        await fetch('/api/admin/withdrawal-schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updated),
        });
      }
    } catch {
      // keep local synced
    }
    notifyDbChange();
    refreshWithdrawalSchedule();
    addToast('Schedule Updated', 'Monthly withdrawal schedule configuration saved.', 'success');
    return true;
  };

  const submitWithdrawal = async (
    method: PaymentMethod,
    amount: number,
    accountNumber: string,
    accountType: any = 'Personal'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in required' };

    const freshUser = db.getUserById(currentUser.id) || currentUser;
    const effectiveTierForW = getEffectiveVipTier(freshUser);
    const currentUserWithdrawals = db.getUserWithdrawals(freshUser.id);
    const schedConfig = db.getWithdrawalScheduleConfig();
    const schedStatus = evaluateWithdrawalSchedule(
      schedConfig,
      effectiveTierForW,
      currentUserWithdrawals,
      freshUser.availableBalance
    );

    const hasPending = currentUserWithdrawals.some(
      (w) => w.status === 'Pending' || w.status === 'Processing' || w.status === 'Approved'
    );

    // Backend schedule & monthly quota enforcement
    try {
      const res = await fetch('/api/withdrawals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: freshUser.id,
          vipTier: effectiveTierForW,
          amount,
          usedThisMonthClient: schedStatus.usedThisMonth,
          hasPendingClient: hasPending,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.allowed) {
        return { success: false, error: data.error || 'Server rejected withdrawal request per monthly schedule.' };
      }
    } catch {
      // If network unreachable, local db.createWithdrawal enforces the exact same schedule rules
    }

    const result = db.createWithdrawal(freshUser, amount, method, accountNumber, accountType);
    if (result.success) {
      const refreshed = db.getUserById(freshUser.id);
      if (refreshed) setCurrentUser(refreshed);
      notifyDbChange();
      refreshWithdrawalSchedule();
      confetti({ particleCount: 90, spread: 80 });
      addToast('Withdrawal Submitted!', `$${amount.toFixed(2)} via ${method} is queued for admin approval.`, 'success');
    }
    return result;
  };

  // --- Streak & Ads ---
  const recordAdWatched = (baseReward: number) => {
    const mult = streak.multiplier;
    const earned = +(baseReward * mult).toFixed(2);

    if (currentUser) {
      currentUser.availableBalance = +(currentUser.availableBalance + earned).toFixed(2);
      currentUser.totalEarnings = +(currentUser.totalEarnings + earned).toFixed(2);
      currentUser.todayEarnings = +(currentUser.todayEarnings + earned).toFixed(2);
      currentUser.adEarnings = +(currentUser.adEarnings + earned).toFixed(2);
      currentUser.adsWatchedToday = (currentUser.adsWatchedToday || 0) + 1;
      db.saveUser(currentUser);
      db.addTransaction(currentUser.id, 'credit', 'ad', earned, 'Watched High-CPM Rewarded Advertisement');
      db.updateMissionProgress('mis_watch_ads', 1);
      setCurrentUser({ ...currentUser });
      notifyDbChange();
    }

    const nextAdsCount = streak.adsWatchedToday + 1;
    let nextDay = streak.currentDay;
    let nextMult = streak.multiplier;

    if (nextAdsCount >= streak.adsTargetToday && streak.currentDay < 7) {
      nextDay = Math.min(7, streak.currentDay + 1);
      nextMult = MULTIPLIERS[nextDay - 1];
      confetti({ particleCount: 60, spread: 70 });
      addToast('🔥 Streak Level Up!', `Unlocked Day ${nextDay} with ${nextMult}x Multiplier!`, 'bonus');
    }

    setStreak((prev) => ({
      ...prev,
      adsWatchedToday: nextAdsCount,
      currentDay: nextDay,
      multiplier: nextMult,
    }));

    return { earned, multiplier: mult };
  };

  const claimDailyBonus = (): number => {
    const today = new Date().toISOString().split('T')[0];
    if (streak.lastClaimDate === today) {
      addToast('Already Claimed', 'You already claimed your daily reward today. Return tomorrow!', 'info');
      return 0;
    }

    const bonusAmount = +(2.0 * streak.multiplier).toFixed(2);
    if (currentUser) {
      currentUser.availableBalance = +(currentUser.availableBalance + bonusAmount).toFixed(2);
      currentUser.totalEarnings = +(currentUser.totalEarnings + bonusAmount).toFixed(2);
      currentUser.todayEarnings = +(currentUser.todayEarnings + bonusAmount).toFixed(2);
      db.saveUser(currentUser);
      db.addTransaction(currentUser.id, 'credit', 'bonus', bonusAmount, 'Claimed Daily Streak Login Bonus');
      setCurrentUser({ ...currentUser });
      notifyDbChange();
    }

    setStreak((prev) => ({ ...prev, lastClaimDate: today }));
    confetti({ particleCount: 80, spread: 80 });
    addToast('Daily Bonus Claimed! 🎉', `+$${bonusAmount.toFixed(2)} added to your balance!`, 'bonus');
    return bonusAmount;
  };

  const claimEarnMoreBonus = () => {
    openAdMonetizationLink('earn_more');
    const reward = +(2.5 * streak.multiplier).toFixed(2);
    if (currentUser) {
      currentUser.availableBalance = +(currentUser.availableBalance + reward).toFixed(2);
      currentUser.totalEarnings = +(currentUser.totalEarnings + reward).toFixed(2);
      currentUser.todayEarnings = +(currentUser.todayEarnings + reward).toFixed(2);
      currentUser.adEarnings = +(currentUser.adEarnings + reward).toFixed(2);
      db.saveUser(currentUser);
      db.addTransaction(currentUser.id, 'credit', 'ad', reward, 'Earn More Sponsored Link Visit');
      setCurrentUser({ ...currentUser });
      notifyDbChange();
    }
    confetti({ particleCount: 40, spread: 60 });
    addToast('Earn More Credited!', `+$${reward.toFixed(2)} credited for sponsor link visit!`, 'bonus');
  };

  const recordGameReward = (isWin: boolean, gameName: string): number => {
    const reward = isWin ? 2.0 : 1.0;
    if (currentUser) {
      currentUser.availableBalance = +(currentUser.availableBalance + reward).toFixed(2);
      currentUser.totalEarnings = +(currentUser.totalEarnings + reward).toFixed(2);
      currentUser.todayEarnings = +(currentUser.todayEarnings + reward).toFixed(2);
      currentUser.adEarnings = +(currentUser.adEarnings + reward).toFixed(2);
      db.saveUser(currentUser);
      db.addTransaction(currentUser.id, 'credit', 'game', reward, `Game Reward: ${gameName}`);
      setCurrentUser({ ...currentUser });
      notifyDbChange();
    }
    if (isWin) {
      confetti({ particleCount: 70, spread: 70 });
      addToast('Victory! 🏆', `You won $2.00 playing ${gameName}! Balance updated.`, 'bonus');
    } else {
      addToast('Game Completed! 🎮', `Earned $1.00 reward playing ${gameName}! Balance updated.`, 'info');
    }
    return reward;
  };

  const recordGameSession = (
    gameId: string,
    gameName: string,
    score: number,
    isWin: boolean,
    durationSeconds: number
  ) => {
    if (!currentUser) {
      return { success: false, reward: 0, error: 'Must be logged in to claim game rewards.' };
    }

    const game = db.getGameById(gameId);
    const minTime = game?.minPlaySeconds || 5;

    if (durationSeconds < minTime) {
      addToast(
        'Round Disqualified',
        `Play duration too brief (${durationSeconds}s / min ${minTime}s required).`,
        'error'
      );
      return {
        success: false,
        reward: 0,
        error: `Active play must last at least ${minTime} seconds.`,
      };
    }

    const result = db.recordGamePlay(currentUser.id, gameId, gameName, score, isWin, durationSeconds);
    if (result.error) {
      addToast('Limit Reached', result.error, 'error');
      return { success: false, reward: 0, error: result.error };
    }

    currentUser.availableBalance = +(currentUser.availableBalance + result.reward).toFixed(2);
    currentUser.totalEarnings = +(currentUser.totalEarnings + result.reward).toFixed(2);
    currentUser.todayEarnings = +(currentUser.todayEarnings + result.reward).toFixed(2);
    db.saveUser(currentUser);
    setCurrentUser({ ...currentUser });
    notifyDbChange();

    if (isWin) {
      confetti({ particleCount: 85, spread: 75 });
      addToast('Victory! 🏆', `+$${result.reward.toFixed(2)} credited! Score: ${score}`, 'bonus');
    } else {
      addToast('Game Finished! 🎮', `+$${result.reward.toFixed(2)} consolation reward credited!`, 'info');
    }

    return { success: true, reward: result.reward };
  };

  const adminUpdateGame = (game: GameDefinition) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    db.saveGame(game);
    notifyDbChange();
    addToast('Game Saved', `${game.name} parameters updated.`, 'success');
  };

  const adminAddGame = (game: GameDefinition) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    db.saveGame(game);
    notifyDbChange();
    addToast('Game Created', `${game.name} added to arcade library.`, 'success');
  };

  const adminDeleteGame = (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const games = db.getGames().filter((g) => g.id !== id);
    localStorage.setItem('lte_db_games_v2', JSON.stringify(games));
    notifyDbChange();
    addToast('Game Deleted', `Game ID ${id} removed.`, 'info');
  };

  const adminToggleGame = (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    db.toggleGame(id);
    notifyDbChange();
  };

  const adminUpdateGameSettings = (settings: Partial<GameZoneSettings>) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    db.updateGameSettings(settings);
    notifyDbChange();
    addToast('Settings Saved', 'Arcade policy updated.', 'success');
  };

  const addSimulatedReferral = () => {
    if (!currentUser) return;
    const names = ['Shafiqul Alam', 'Farhana Yasmin', 'Habibur Rahman', 'Sadia Afrin', 'Mustafizur R.'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const bonus = (vipTiersConfig[getEffectiveVipTier(currentUser)] || VIP_TIERS.Free).referralBonus;

    currentUser.availableBalance = +(currentUser.availableBalance + bonus).toFixed(2);
    currentUser.totalEarnings = +(currentUser.totalEarnings + bonus).toFixed(2);
    currentUser.referralEarnings = +(currentUser.referralEarnings + bonus).toFixed(2);
    db.saveUser(currentUser);
    db.addReferralRecord({
      id: 'REF-' + Math.floor(1000 + Math.random() * 9000),
      referrerId: currentUser.id,
      referredUserId: 'LTE-' + Math.floor(100000 + Math.random() * 900000),
      name: randomName,
      email: `${randomName.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      date: new Date().toISOString().split('T')[0],
      reward: bonus,
      status: 'Verified',
    });
    db.addTransaction(currentUser.id, 'credit', 'referral', bonus, `Referral reward from ${randomName}`);
    db.updateMissionProgress('mis_invite_friend', 1);

    confetti({ particleCount: 70, spread: 80 });
    addToast('Referral Registered! 🎉', `${randomName} joined via your link! +$${bonus.toFixed(2)} credited.`, 'bonus');
    setCurrentUser({ ...currentUser });
    notifyDbChange();
  };

  const previewReferralLink = (code?: string) => {
    const activeCode = code || currentUser?.referralCode || '';
    if (typeof window !== 'undefined' && activeCode) {
      const url = new URL(window.location.href);
      url.searchParams.set('ref', activeCode);
      window.history.replaceState({}, '', url.toString());
    }
    setCurrentView('signup');
  };

  const adminApproveWithdrawal = (id: string) => {
    const refCode = 'AUTO-' + Math.floor(10000000 + Math.random() * 90000000);
    db.approveWithdrawal(id, refCode, currentUser?.email || 'admin@lazytoearn.com');
    notifyDbChange();
    addToast('Withdrawal Paid', `Marked as paid. Reference: ${refCode}`, 'success');
  };

  const adminPayWithdrawal = (id: string, ref: string) => {
    db.approveWithdrawal(id, ref, currentUser?.email || 'admin@lazytoearn.com');
    notifyDbChange();
    addToast('Payment Dispatched', `TrxID: ${ref} logged and user notified.`, 'success');
  };

  const adminRejectWithdrawal = (id: string, reason: string) => {
    db.rejectWithdrawal(id, reason, currentUser?.email || 'admin@lazytoearn.com');
    notifyDbChange();
    addToast('Withdrawal Rejected', `Reason logged and funds refunded.`, 'info');
  };

  const adminSendNotification = (targetUserId: string, title: string, message: string) => {
    db.createNotification(targetUserId, title, message, 'system');
    notifyDbChange();
    addToast('Notification Dispatched', `Alert sent to ${targetUserId}.`, 'success');
  };

  const adminToggleUserStatus = (userId: string) => {
    const target = db.getUserById(userId);
    if (!target) return;
    target.accountStatus = target.accountStatus === 'Active' ? 'Suspended' : 'Active';
    db.saveUser(target);
    notifyDbChange();
    addToast('User Status Updated', `${target.name} account is now ${target.accountStatus}.`, 'info');
  };

  const markNotificationsAsRead = () => {
    if (currentUser) {
      db.markAllNotificationsRead(currentUser.id);
      notifyDbChange();
    }
  };

  // Strict user isolation data queries
  const userWithdrawals = currentUser ? db.getUserWithdrawals(currentUser.id) : [];
  const userTransactions = currentUser ? db.getTransactions(currentUser.id) : [];
  const allTransactions = db.getTransactions();
  const userNotifications = currentUser ? db.getUserNotifications(currentUser.id) : [];
  const unreadNotificationCount = userNotifications.filter((n) => !n.isRead).length;
  const userGameHistory = currentUser ? db.getUserGameHistory(currentUser.id) : [];
  const userSpinHistory = currentUser ? db.getSpinHistory(currentUser.id) : [];
  const userScratchHistory = currentUser ? db.getScratchHistory(currentUser.id) : [];
  const userTickets = currentUser ? db.getUserTickets(currentUser.id) : [];
  const allGameHistory = db.getAllGameHistory();
  const games = db.getGames();
  const gameSettings = db.getGameSettings();
  const allUsers = db.getUsers();
  const allWithdrawals = db.getWithdrawals();
  const adminAuditLogs = db.getNotifications() as any; // fallback or audit
  const missions = db.getMissions();
  const tournaments = db.getTournaments();
  const achievements = db.getAchievements();
  const tickets = db.getTickets();
  const adPlacements = db.getAdPlacements();
  const topReferrers = db.getTopReferrers();

  // Keep dbVersion and scheduleTick read so schedule status recomputes cleanly
  void dbVersion;
  void scheduleTick;

  const effectiveVipTier: VIPTierLevel =
    vipMembershipStatus && vipMembershipStatus.status !== 'none'
      ? vipMembershipStatus.status === 'active'
        ? vipMembershipStatus.effectiveTier
        : 'Free'
      : getEffectiveVipTier(currentUser);

  const withdrawalScheduleStatus = evaluateWithdrawalSchedule(
    withdrawalScheduleConfig,
    effectiveVipTier,
    userWithdrawals,
    currentUser?.availableBalance || 0
  );

  const originUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://lasytoearn.blogspot.com';
  const referralLink = currentUser
    ? `${originUrl}/?ref=${currentUser.referralCode}`
    : `${originUrl}/`;

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        availableLanguages,
        t,
        refreshTranslations,
        viewedProfileHandle,
        openPublicProfile,
        creditCalendarReward,
        deductGiftPoints,
        user: currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        login,
        register,
        verifyEmail,
        requestPasswordReset,
        resetPassword,
        logout,
        updateProfile,
        switchUser,
        currentView,
        setCurrentView,
        userWithdrawals,
        userTransactions,
        allTransactions,
        userNotifications,
        unreadNotificationCount,
        markNotificationsAsRead,
        minWithdrawal,
        withdrawalScheduleConfig,
        withdrawalScheduleStatus,
        refreshWithdrawalSchedule,
        adminUpdateWithdrawalSchedule,
        submitWithdrawal,
        convertPointsToCash,
        spinWheel,
        userSpinHistory,
        missions,
        claimMission,
        scratchCard,
        userScratchHistory,
        tournaments,
        joinTournament,
        recordTournamentScore,
        achievements,
        claimAchievement,
        effectiveVipTier,
        vipSystemSettings,
        vipTiersConfig,
        vipMembershipStatus,
        refreshVipStatus,
        purchaseVip,
        upgradeVip,
        redeemPromoCode,
        tickets,
        userTickets,
        createTicket,
        replyTicket,
        adminReplyTicket,
        adminResolveTicket,
        adPlacements,
        recordAdImpression,
        adminUpdateAdPlacement,
        streak,
        claimDailyBonus,
        recordAdWatched,
        claimEarnMoreBonus,
        recordGameReward,
        games,
        userGameHistory,
        allGameHistory,
        gameSettings,
        recordGameSession,
        adminUpdateGame,
        adminAddGame,
        adminDeleteGame,
        adminToggleGame,
        adminUpdateGameSettings,
        referralLink,
        topReferrers,
        addSimulatedReferral,
        previewReferralLink,
        allUsers,
        allWithdrawals,
        adminAuditLogs,
        adminApproveWithdrawal,
        adminPayWithdrawal,
        adminRejectWithdrawal,
        adminSendNotification,
        adminToggleUserStatus,
        toasts,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
