import {
  UserAccount,
  WithdrawalRecord,
  UserNotification,
  AdminAuditLog,
  ReferralRecord,
  GameDefinition,
  UserGameHistoryRecord,
  GameZoneSettings,
  VIPTierLevel,
  VIPTierConfig,
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
  TicketMessage,
  AdPlacementConfig,
  WithdrawalScheduleConfig,
} from '../types';
import { INITIAL_GAMES } from '../data/gamesList';
import { INITIAL_MINI_GAMES } from '../data/miniGamesList';
import {
  DEFAULT_WITHDRAWAL_SCHEDULE,
  evaluateWithdrawalSchedule,
} from '../utils/withdrawalScheduler';

const ALL_INITIAL_GAMES = [...INITIAL_GAMES, ...INITIAL_MINI_GAMES];

export function maskAccount(acc: string): string {
  if (!acc) return '';
  const clean = acc.trim();
  if (clean.length <= 6) return '****' + clean.slice(-2);
  return clean.slice(0, 4) + '****' + clean.slice(-3);
}

export const VIP_TIER_RANK: Record<VIPTierLevel, number> = {
  Free: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
};

export function isVipMembershipExpired(user?: Pick<UserAccount, 'vipTier' | 'vipExpiresAt' | 'vipExpiryDate' | 'vipStatus'> | null): boolean {
  if (!user || !user.vipTier || user.vipTier === 'Free') return false;
  if (user.vipStatus === 'expired') return true;
  if (user.vipExpiresAt) {
    return new Date(user.vipExpiresAt).getTime() <= Date.now();
  }
  if (user.vipExpiryDate) {
    const endOfDay = new Date(`${user.vipExpiryDate}T23:59:59Z`).getTime();
    return endOfDay <= Date.now();
  }
  return false;
}

export function getEffectiveVipTier(user?: Pick<UserAccount, 'vipTier' | 'vipExpiresAt' | 'vipExpiryDate' | 'vipStatus'> | null): VIPTierLevel {
  if (!user || !user.vipTier || user.vipTier === 'Free') return 'Free';
  if (isVipMembershipExpired(user)) return 'Free';
  return user.vipTier;
}

export function getHighestVipTier(user?: Pick<UserAccount, 'vipTier' | 'highestVipTier'> | null): VIPTierLevel {
  if (!user) return 'Free';
  const curRank = VIP_TIER_RANK[user.vipTier || 'Free'] || 0;
  const highRank = VIP_TIER_RANK[user.highestVipTier || 'Free'] || 0;
  return highRank >= curRank ? (user.highestVipTier || 'Free') : (user.vipTier || 'Free');
}

// VIP TIERS CONFIGURATION (No Minimum Withdrawal Benefit)
export const VIP_TIERS: Record<VIPTierLevel, VIPTierConfig> = {
  Free: {
    tier: 'Free',
    name: 'Starter Member',
    badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
    priceMonthly: 0,
    multiplier: 1.0,
    dailyFreeSpins: 1,
    dailyFreeScratches: 1,
    referralBonus: 10.0,
    payoutSpeed: '24-48 Hours',
    perks: ['Standard Ad Earnings', '1 Daily Free Spin', '1 Daily Free Scratch', 'Standard Support'],
  },
  Bronze: {
    tier: 'Bronze',
    name: 'Bronze VIP',
    badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
    priceMonthly: 9.99,
    multiplier: 1.25,
    dailyFreeSpins: 2,
    dailyFreeScratches: 2,
    referralBonus: 12.0,
    payoutSpeed: '12-24 Hours',
    perks: ['+25% Multiplier on All Tasks', '2 Daily Free Spins', '2 Daily Free Scratches', 'Priority Email Support'],
  },
  Silver: {
    tier: 'Silver',
    name: 'Silver VIP',
    badgeColor: 'bg-slate-500/30 text-slate-200 border-slate-400/50',
    priceMonthly: 19.99,
    multiplier: 1.5,
    dailyFreeSpins: 4,
    dailyFreeScratches: 3,
    referralBonus: 15.0,
    payoutSpeed: '6-12 Hours',
    perks: ['+50% Multiplier on All Tasks', '4 Daily Free Spins', '3 Daily Free Scratches', 'Exclusive Tournaments'],
  },
  Gold: {
    tier: 'Gold',
    name: 'Gold VIP',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    priceMonthly: 39.99,
    multiplier: 2.0,
    dailyFreeSpins: 7,
    dailyFreeScratches: 5,
    referralBonus: 20.0,
    payoutSpeed: '2-4 Hours',
    perks: ['2X Earnings on Everything', '7 Daily Free Spins', '5 Daily Free Scratches', 'VIP Priority Payout Channel'],
  },
  Platinum: {
    tier: 'Platinum',
    name: 'Platinum Elite VIP',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    priceMonthly: 79.99,
    multiplier: 2.5,
    dailyFreeSpins: 12,
    dailyFreeScratches: 8,
    referralBonus: 25.0,
    payoutSpeed: 'Instant (Under 1 Hour)',
    perks: ['2.5X Earnings Multiplier', '12 Daily Free Spins', '8 Daily Free Scratches', 'Instant Cashout Processing', 'Dedicated Support Manager'],
  },
};

// LUCKY SPIN SEGMENTS
export const SPIN_SEGMENTS: SpinSegment[] = [
  { id: 'seg_1', label: '$0.50 Cash', type: 'cash', value: 0.5, color: '#f59e0b', textColor: '#0f172a', probabilityWeight: 25 },
  { id: 'seg_2', label: '100 Points', type: 'points', value: 100, color: '#0ea5e9', textColor: '#ffffff', probabilityWeight: 20 },
  { id: 'seg_3', label: '$1.00 Cash', type: 'cash', value: 1.0, color: '#10b981', textColor: '#0f172a', probabilityWeight: 18 },
  { id: 'seg_4', label: 'Try Again', type: 'empty', value: 0, color: '#334155', textColor: '#94a3b8', probabilityWeight: 10 },
  { id: 'seg_5', label: '$2.00 Cash', type: 'cash', value: 2.0, color: '#ec4899', textColor: '#ffffff', probabilityWeight: 12 },
  { id: 'seg_6', label: '250 Points', type: 'points', value: 250, color: '#6366f1', textColor: '#ffffff', probabilityWeight: 8 },
  { id: 'seg_7', label: '$5.00 Cash', type: 'cash', value: 5.0, color: '#8b5cf6', textColor: '#ffffff', probabilityWeight: 5 },
  { id: 'seg_8', label: '1 Extra Spin', type: 'spin', value: 1, color: '#eab308', textColor: '#0f172a', probabilityWeight: 2 },
];

// DAILY MISSIONS SEED
export const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: 'mis_daily_login',
    title: 'Daily Check-in',
    description: 'Log into Lazy To Earn today and maintain your winning activity.',
    category: 'daily',
    targetCount: 1,
    currentCount: 1,
    rewardCash: 0.5,
    rewardPoints: 50,
    isCompleted: true,
    isClaimed: false,
    icon: 'CalendarCheck',
    actionView: 'dashboard',
  },
  {
    id: 'mis_watch_ads',
    title: 'Watch 3 Rewarded Ads',
    description: 'Support network sponsors by watching 3 full rewarded ads.',
    category: 'ads',
    targetCount: 3,
    currentCount: 2,
    rewardCash: 1.5,
    rewardPoints: 100,
    isCompleted: false,
    isClaimed: false,
    icon: 'Tv',
    actionView: 'watch_ads',
  },
  {
    id: 'mis_play_games',
    title: 'Play 2 Arcade or Mini Games',
    description: 'Complete at least 2 verified game sessions in the Game Zone.',
    category: 'games',
    targetCount: 2,
    currentCount: 1,
    rewardCash: 2.0,
    rewardPoints: 150,
    isCompleted: false,
    isClaimed: false,
    icon: 'Gamepad2',
    actionView: 'game_zone',
  },
  {
    id: 'mis_scratch_card',
    title: 'Reveal 1 Scratch Card',
    description: 'Try your luck by scratching any card in the Scratch Cards zone.',
    category: 'daily',
    targetCount: 1,
    currentCount: 0,
    rewardCash: 0.5,
    rewardPoints: 50,
    isCompleted: false,
    isClaimed: false,
    icon: 'Sparkles',
    actionView: 'scratch_cards',
  },
  {
    id: 'mis_lucky_spin',
    title: 'Spin the Lucky Wheel',
    description: 'Use your free daily spin on the Lucky Spin Wheel.',
    category: 'daily',
    targetCount: 1,
    currentCount: 0,
    rewardCash: 0.5,
    rewardPoints: 50,
    isCompleted: false,
    isClaimed: false,
    icon: 'Disc',
    actionView: 'lucky_spin',
  },
  {
    id: 'mis_invite_friend',
    title: 'Invite 1 New Friend',
    description: 'Share your referral link and have a friend register an account.',
    category: 'social',
    targetCount: 1,
    currentCount: 0,
    rewardCash: 10.0,
    rewardPoints: 500,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    actionView: 'refer',
  },
];

// SCRATCH CARDS CONFIGURATION
export const SCRATCH_CARDS: ScratchCardConfig[] = [
  {
    id: 'sc_bronze',
    tier: 'bronze',
    title: 'Bronze Starter Card',
    description: 'Free daily card with guaranteed entry rewards up to $3.00.',
    costPoints: 0,
    maxCashPrize: 3.0,
    cardColor: 'from-amber-900/60 via-amber-800/40 to-slate-900 border-amber-700/60',
    dailyLimit: 3,
  },
  {
    id: 'sc_silver',
    tier: 'silver',
    title: 'Silver Jackpot Scratch',
    description: 'Match 3 silver icons to win up to $10.00 cash instantly.',
    costPoints: 100,
    maxCashPrize: 10.0,
    cardColor: 'from-slate-700/60 via-slate-600/40 to-slate-900 border-slate-500/60',
    dailyLimit: 5,
  },
  {
    id: 'sc_gold',
    tier: 'gold',
    title: 'Golden Treasure Card',
    description: 'High-stake scratch card with prizes up to $25.00 cash.',
    costPoints: 250,
    maxCashPrize: 25.0,
    cardColor: 'from-amber-500/20 via-amber-600/30 to-slate-900 border-amber-500/60',
    dailyLimit: 5,
  },
  {
    id: 'sc_platinum',
    tier: 'platinum',
    title: 'Platinum Mega Vault',
    description: 'Exclusive high-roller scratch card with jackpot prizes up to $50.00.',
    costPoints: 500,
    maxCashPrize: 50.0,
    cardColor: 'from-purple-900/50 via-purple-700/30 to-slate-900 border-purple-500/60',
    dailyLimit: 3,
  },
];

// ACHIEVEMENTS SEED
export const INITIAL_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'ach_first_login',
    title: 'First Step',
    description: 'Create an account and successfully log in to Lazy To Earn.',
    category: 'onboarding',
    icon: 'LogIn',
    targetCount: 1,
    currentProgress: 1,
    isUnlocked: true,
    isClaimed: true,
    rewardPoints: 100,
    rewardCash: 1.0,
    dateUnlocked: '2026-10-14',
  },
  {
    id: 'ach_first_mission',
    title: 'Mission Pioneer',
    description: 'Complete your very first daily mission successfully.',
    category: 'missions',
    icon: 'CheckCircle2',
    targetCount: 1,
    currentProgress: 1,
    isUnlocked: true,
    isClaimed: false,
    rewardPoints: 150,
    dateUnlocked: '2026-11-10',
  },
  {
    id: 'ach_10_missions',
    title: 'Daily Grinder',
    description: 'Complete 10 daily missions across games and platform tasks.',
    category: 'missions',
    icon: 'Flame',
    targetCount: 10,
    currentProgress: 6,
    isUnlocked: false,
    isClaimed: false,
    rewardPoints: 300,
    rewardCash: 2.5,
  },
  {
    id: 'ach_50_missions',
    title: 'Mission Centurion',
    description: 'Achieve legendary status by finishing 50 platform missions.',
    category: 'missions',
    icon: 'Trophy',
    targetCount: 50,
    currentProgress: 14,
    isUnlocked: false,
    isClaimed: false,
    rewardPoints: 1000,
    rewardCash: 10.0,
  },
  {
    id: 'ach_first_withdrawal',
    title: 'Cashout Champion',
    description: 'Reach the $100 payout goal and complete your first withdrawal.',
    category: 'earning',
    icon: 'Coins',
    targetCount: 1,
    currentProgress: 1,
    isUnlocked: true,
    isClaimed: true,
    rewardPoints: 500,
    dateUnlocked: '2026-11-04',
  },
  {
    id: 'ach_first_referral',
    title: 'Community Builder',
    description: 'Refer your first friend and earn the verified $10 reward.',
    category: 'social',
    icon: 'UserPlus',
    targetCount: 1,
    currentProgress: 1,
    isUnlocked: true,
    isClaimed: true,
    rewardPoints: 250,
    dateUnlocked: '2026-10-18',
  },
  {
    id: 'ach_arcade_gladiator',
    title: 'Arcade Gladiator',
    description: 'Play 20 games in the Game Zone with verified score outcomes.',
    category: 'gaming',
    icon: 'Gamepad2',
    targetCount: 20,
    currentProgress: 12,
    isUnlocked: false,
    isClaimed: false,
    rewardPoints: 400,
    rewardCash: 3.0,
  },
  {
    id: 'ach_vip_royalty',
    title: 'VIP Royalty',
    description: 'Upgrade to any VIP membership tier to unlock maximum multipliers.',
    category: 'vip',
    icon: 'Crown',
    targetCount: 1,
    currentProgress: 0,
    isUnlocked: false,
    isClaimed: false,
    rewardPoints: 800,
    rewardCash: 5.0,
  },
];

// TOURNAMENTS SEED
export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn_01',
    title: 'Highway Speed Racer Championship',
    gameId: 'racing_highway',
    gameName: 'Highway Car Racing',
    category: 'Racing',
    status: 'Active',
    startDate: '2026-11-10 00:00',
    endDate: '2026-11-18 23:59',
    prizePool: 500.0,
    entryFeePoints: 50,
    firstPlacePrize: 250.0,
    secondPlacePrize: 150.0,
    thirdPlacePrize: 100.0,
    participantsCount: 84,
    bannerUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
    leaderboard: [
      {
        userId: 'LTE-419082',
        userName: 'Nafisa Sultana',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        score: 4820,
        rank: 1,
        reward: 250.0,
        playedAt: '2026-11-12 11:20',
      },
      {
        userId: 'LTE-782910',
        userName: 'Tanvir Hossain',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        score: 4410,
        rank: 2,
        reward: 150.0,
        playedAt: '2026-11-12 09:40',
      },
      {
        userId: 'LTE-639104',
        userName: 'Kazi Mahin',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        score: 3990,
        rank: 3,
        reward: 100.0,
        playedAt: '2026-11-11 18:30',
      },
      {
        userId: 'LTE-102938',
        userName: 'Rashedul Islam',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        score: 3650,
        rank: 4,
        reward: 0,
        playedAt: '2026-11-11 16:15',
      },
    ],
  },
  {
    id: 'tourn_02',
    title: 'Solitaire Master Grand Slam',
    gameId: 'cards_solitaire',
    gameName: 'Solitaire Classic',
    category: 'Cards',
    status: 'Upcoming',
    startDate: '2026-11-20 00:00',
    endDate: '2026-11-27 23:59',
    prizePool: 1000.0,
    entryFeePoints: 100,
    firstPlacePrize: 500.0,
    secondPlacePrize: 300.0,
    thirdPlacePrize: 200.0,
    participantsCount: 142,
    bannerUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
    leaderboard: [],
  },
  {
    id: 'tourn_03',
    title: 'Arcade Space Galaxy Cup',
    gameId: 'arcade_space_invaders',
    gameName: 'Space Invaders Retro',
    category: 'Arcade',
    status: 'Completed',
    startDate: '2026-11-01 00:00',
    endDate: '2026-11-08 23:59',
    prizePool: 250.0,
    entryFeePoints: 25,
    firstPlacePrize: 125.0,
    secondPlacePrize: 75.0,
    thirdPlacePrize: 50.0,
    participantsCount: 65,
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    leaderboard: [
      {
        userId: 'LTE-782910',
        userName: 'Tanvir Hossain',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        score: 6150,
        rank: 1,
        reward: 125.0,
        playedAt: '2026-11-08 21:10',
      },
      {
        userId: 'LTE-419082',
        userName: 'Nafisa Sultana',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        score: 5820,
        rank: 2,
        reward: 75.0,
        playedAt: '2026-11-08 19:45',
      },
    ],
  },
];

// PROMO CODES SEED
export const INITIAL_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo_1',
    code: 'LAZY2026',
    rewardType: 'cash',
    rewardValue: 5.0,
    maxUses: 500,
    usedCount: 142,
    expiresAt: '2026-12-31',
    isActive: true,
    description: 'Welcome promotional gift: Instant $5.00 cash added to your balance!',
    claimedUserIds: [],
  },
  {
    id: 'promo_2',
    code: 'POINTS100',
    rewardType: 'points',
    rewardValue: 200,
    maxUses: 1000,
    usedCount: 310,
    expiresAt: '2026-12-31',
    isActive: true,
    description: 'Claim 200 reward points for tournaments, spins, and scratch cards.',
    claimedUserIds: [],
  },
  {
    id: 'promo_3',
    code: 'VIPBOOST',
    rewardType: 'vip',
    rewardValue: 0,
    vipDurationDays: 7,
    maxUses: 200,
    usedCount: 88,
    expiresAt: '2026-12-31',
    isActive: true,
    description: '7-Day Free Bronze VIP Trial with +25% earnings multiplier!',
    claimedUserIds: [],
  },
];

// SUPPORT TICKETS SEED
export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-89210',
    userId: 'LTE-782910',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir@gmail.com',
    subject: 'bKash Withdrawal Confirmation Query',
    category: 'Payment & Withdrawal',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-11-04 14:30',
    updatedAt: '2026-11-04 15:12',
    messages: [
      {
        id: 'msg_1',
        sender: 'user',
        senderName: 'Tanvir Hossain',
        message: 'Hello, I requested a withdrawal of $120 via bKash. Could you please confirm the processing status?',
        timestamp: '2026-11-04 14:30',
      },
      {
        id: 'msg_2',
        sender: 'admin',
        senderName: 'LazyToEarn Admin',
        message: 'Dear Tanvir, your withdrawal has been verified and processed. Transaction Reference: BKX-9823019842. Thank you!',
        timestamp: '2026-11-04 15:12',
      },
    ],
  },
  {
    id: 'TCK-94182',
    userId: 'LTE-419082',
    userName: 'Nafisa Sultana',
    userEmail: 'nafisa@gmail.com',
    subject: 'Tournament Score Verification',
    category: 'Games & Tournaments',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2026-11-12 09:15',
    updatedAt: '2026-11-12 10:00',
    messages: [
      {
        id: 'msg_3',
        sender: 'user',
        senderName: 'Nafisa Sultana',
        message: 'I scored 4,820 points in Highway Car Racing. Can you please verify if my rank is updated on the live tournament leaderboard?',
        timestamp: '2026-11-12 09:15',
      },
      {
        id: 'msg_4',
        sender: 'admin',
        senderName: 'LazyToEarn Admin',
        message: 'Hi Nafisa! Your score is validated and you are currently Rank #1 in the Highway Speed Racer Championship.',
        timestamp: '2026-11-12 10:00',
      },
    ],
  },
];

// AD PLACEMENTS SEED
export const INITIAL_AD_PLACEMENTS: AdPlacementConfig[] = [
  {
    id: 'ad_header_banner',
    name: 'Top Leaderboard 728x90',
    format: 'header_banner',
    scriptSnippet: '<script src="https://pl32310388.profitableratecpmnetwork.com/7e/60/20/7e6020b4ec4907d45b489f6265069188.js"></script>',
    targetUrl: 'https://uplcm.com/4/11629954',
    pageTarget: 'all',
    impressions: 14820,
    clicks: 1290,
    estimatedRevenue: 185.4,
    active: true,
    frequencyCap: 10,
  },
  {
    id: 'ad_game_sponsored',
    name: 'Game Zone Direct Monetization',
    format: 'native',
    scriptSnippet: '<script src="https://pl32310391.profitableratecpmnetwork.com/94/5f/7b/945f7b30296195fae52417303f873b67.js"></script>',
    targetUrl: 'https://uplcm.com/4/12238368',
    pageTarget: 'games',
    impressions: 29400,
    clicks: 3120,
    estimatedRevenue: 412.8,
    active: true,
    frequencyCap: 20,
  },
  {
    id: 'ad_rewarded_video',
    name: 'High-CPM Rewarded Video Ad Stream',
    format: 'rewarded_video',
    scriptSnippet: '<!-- Verified Rewarded SDK Integration -->',
    targetUrl: 'https://uplcm.com/4/11629954',
    pageTarget: 'watch_ads',
    impressions: 8940,
    clicks: 1840,
    estimatedRevenue: 286.0,
    active: true,
    frequencyCap: 15,
  },
  {
    id: 'ad_footer_banner',
    name: 'Sticky Footer High-Viewability Banner',
    format: 'footer_banner',
    scriptSnippet: '<!-- Responsive Banner 320x50 / 728x90 -->',
    targetUrl: 'https://uplcm.com/4/12238368',
    pageTarget: 'all',
    impressions: 21500,
    clicks: 980,
    estimatedRevenue: 132.5,
    active: true,
    frequencyCap: 5,
  },
];

// TRANSACTIONS SEED
export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'TXN-INIT-01',
    userId: 'LTE-782910',
    type: 'debit',
    category: 'withdrawal',
    amount: 120.0,
    balanceAfter: 250.5,
    description: 'Withdrawal via bKash (Ref: BKX-9823019842)',
    date: '2026-11-04 15:10',
    status: 'Completed',
  },
  {
    id: 'TXN-INIT-02',
    userId: 'LTE-782910',
    type: 'credit',
    category: 'referral',
    amount: 10.0,
    balanceAfter: 145.5,
    description: 'Referral reward: Nafisa Sultana joined with your code',
    date: '2026-11-01 10:20',
    status: 'Completed',
  },
  {
    id: 'TXN-INIT-03',
    userId: 'LTE-782910',
    type: 'credit',
    category: 'tournament',
    amount: 125.0,
    balanceAfter: 135.5,
    description: 'Tournament 1st Prize in Arcade Space Galaxy Cup',
    date: '2026-11-08 21:15',
    status: 'Completed',
  },
];

// SEED USERS WITH FULL ATTRIBUTES
const SEED_USERS: UserAccount[] = [
  {
    id: 'LTE-782910',
    name: 'Tanvir Hossain',
    email: 'tanvir@gmail.com',
    password: 'password123',
    phone: '01712894520',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    referralCode: 'TANVIR77',
    registrationDate: '2026-10-14',
    accountStatus: 'Active',
    emailVerified: true,
    role: 'user',
    availableBalance: 145.5,
    pendingBalance: 0,
    totalEarnings: 370.5,
    lifetimeEarnings: 495.5,
    todayEarnings: 6.5,
    points: 1250,
    referralEarnings: 60.0,
    adEarnings: 165.0,
    totalWithdrawals: 225.0,
    vipTier: 'Silver',
    highestVipTier: 'Silver',
    vipStatus: 'active',
    vipStartedAt: '2026-11-09T08:00:00.000Z',
    vipExpiresAt: '2026-12-09T08:00:00.000Z',
    vipExpiryDate: '2026-12-09',
    spinsUsedToday: 0,
    scratchesUsedToday: 0,
    adsWatchedToday: 2,
    lastDailyLoginDate: '2026-11-12',
    bkashNumber: '01712894520',
    nagadNumber: '01844910234',
    preferredPaymentMethod: 'bKash',
    usdtWallet: '0x8b3941F7cAd38e4a919299Bcf36e09e133D14120',
  },
  {
    id: 'LTE-419082',
    name: 'Nafisa Sultana',
    email: 'nafisa@gmail.com',
    password: 'password123',
    phone: '01823901923',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Nafisa+Sultana',
    referralCode: 'NAFISA99',
    referredBy: 'TANVIR77',
    registrationDate: '2026-11-01',
    accountStatus: 'Active',
    emailVerified: true,
    role: 'user',
    availableBalance: 110.0,
    pendingBalance: 0,
    totalEarnings: 220.0,
    lifetimeEarnings: 220.0,
    todayEarnings: 4.0,
    points: 850,
    referralEarnings: 90.0,
    adEarnings: 80.0,
    totalWithdrawals: 0,
    vipTier: 'Bronze',
    highestVipTier: 'Bronze',
    vipStatus: 'active',
    vipStartedAt: '2026-11-06T08:00:00.000Z',
    vipExpiresAt: '2026-12-06T08:00:00.000Z',
    vipExpiryDate: '2026-12-06',
    spinsUsedToday: 1,
    scratchesUsedToday: 0,
    adsWatchedToday: 1,
    lastDailyLoginDate: '2026-11-12',
    bkashNumber: '01823901923',
    nagadNumber: '01823901923',
    preferredPaymentMethod: 'Nagad',
    usdtWallet: '',
  },
  {
    id: 'LTE-639104',
    name: 'Kazi Mahin',
    email: 'mahin@gmail.com',
    password: 'password123',
    phone: '01912883311',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Kazi+Mahin',
    referralCode: 'MAHIN55',
    referredBy: 'TANVIR77',
    registrationDate: '2026-11-09',
    accountStatus: 'Active',
    emailVerified: true,
    role: 'user',
    availableBalance: 25.0,
    pendingBalance: 0,
    totalEarnings: 25.0,
    lifetimeEarnings: 25.0,
    todayEarnings: 2.0,
    points: 300,
    referralEarnings: 40.0,
    adEarnings: 15.0,
    totalWithdrawals: 0,
    vipTier: 'Free',
    spinsUsedToday: 0,
    scratchesUsedToday: 0,
    adsWatchedToday: 0,
    lastDailyLoginDate: '2026-11-12',
    bkashNumber: '01912883311',
    nagadNumber: '',
    preferredPaymentMethod: 'bKash',
    usdtWallet: '',
  },
  {
    id: 'LTE-552819',
    name: 'Ayesha Karim',
    email: 'ayesha@gmail.com',
    password: 'password123',
    phone: '01755889900',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Ayesha+Karim',
    referralCode: 'AYESHA24',
    referredBy: 'NAFISA99',
    registrationDate: '2026-10-20',
    accountStatus: 'Active',
    emailVerified: true,
    role: 'user',
    availableBalance: 184.0,
    pendingBalance: 0,
    totalEarnings: 410.0,
    lifetimeEarnings: 410.0,
    todayEarnings: 12.0,
    points: 2100,
    referralEarnings: 140.0,
    adEarnings: 190.0,
    totalWithdrawals: 200.0,
    vipTier: 'Gold',
    highestVipTier: 'Gold',
    vipStatus: 'active',
    vipStartedAt: '2026-11-02T08:00:00.000Z',
    vipExpiresAt: '2026-12-02T08:00:00.000Z',
    vipExpiryDate: '2026-12-02',
    spinsUsedToday: 0,
    scratchesUsedToday: 0,
    adsWatchedToday: 3,
    lastDailyLoginDate: '2026-11-12',
    bkashNumber: '01755889900',
    nagadNumber: '01855889900',
    preferredPaymentMethod: 'bKash',
    usdtWallet: '',
  },
  {
    id: 'LTE-309142',
    name: 'Rafiqul Islam',
    email: 'rafiqul@gmail.com',
    password: 'password123',
    phone: '01688112233',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Rafiqul+Islam',
    referralCode: 'RAFIQ88',
    referredBy: 'AYESHA24',
    registrationDate: '2026-10-25',
    accountStatus: 'Active',
    emailVerified: true,
    role: 'user',
    availableBalance: 92.5,
    pendingBalance: 0,
    totalEarnings: 165.0,
    lifetimeEarnings: 165.0,
    todayEarnings: 3.5,
    points: 600,
    referralEarnings: 50.0,
    adEarnings: 95.0,
    totalWithdrawals: 0,
    vipTier: 'Silver',
    highestVipTier: 'Silver',
    vipStatus: 'active',
    vipStartedAt: '2026-11-12T08:00:00.000Z',
    vipExpiresAt: '2026-12-12T08:00:00.000Z',
    vipExpiryDate: '2026-12-12',
    spinsUsedToday: 0,
    scratchesUsedToday: 0,
    adsWatchedToday: 1,
    lastDailyLoginDate: '2026-11-12',
    bkashNumber: '01688112233',
    nagadNumber: '',
    preferredPaymentMethod: 'bKash',
    usdtWallet: '',
  },
  {
    id: 'LTE-000001',
    name: 'LazyToEarn Administrator',
    email: 'admin@lazytoearn.com',
    password: 'admin123',
    phone: '+880 1700-000000',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    referralCode: 'ADMINLTE',
    registrationDate: '2026-09-01',
    accountStatus: 'Active',
    emailVerified: true,
    role: 'admin',
    availableBalance: 9999.0,
    pendingBalance: 0,
    totalEarnings: 9999.0,
    lifetimeEarnings: 9999.0,
    todayEarnings: 0,
    points: 10000,
    referralEarnings: 0,
    adEarnings: 0,
    totalWithdrawals: 0,
    vipTier: 'Platinum',
    highestVipTier: 'Platinum',
    vipStatus: 'active',
    spinsUsedToday: 0,
    scratchesUsedToday: 0,
    adsWatchedToday: 0,
    lastDailyLoginDate: '2026-11-12',
    bkashNumber: '01700000000',
    nagadNumber: '01700000000',
    preferredPaymentMethod: 'bKash',
    usdtWallet: '',
  },
];

const SEED_WITHDRAWALS: WithdrawalRecord[] = [
  {
    id: 'TXN-918234-BK',
    userId: 'LTE-782910',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir@gmail.com',
    amount: 120.0,
    fee: 2.4,
    netAmount: 117.6,
    paymentMethod: 'bKash',
    accountNumberFull: '01712894520',
    accountNumberMasked: maskAccount('01712894520'),
    accountType: 'Personal',
    status: 'Paid',
    requestDate: '2026-11-04 14:22',
    paymentDate: '2026-11-04 15:10',
    adminTransactionReference: 'BKX-9823019842',
  },
  {
    id: 'TXN-847291-NG',
    userId: 'LTE-782910',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir@gmail.com',
    amount: 105.0,
    fee: 2.1,
    netAmount: 102.9,
    paymentMethod: 'Nagad',
    accountNumberFull: '01844910234',
    accountNumberMasked: maskAccount('01844910234'),
    accountType: 'Personal',
    status: 'Paid',
    requestDate: '2026-10-28 09:12',
    paymentDate: '2026-10-28 10:05',
    adminTransactionReference: 'NGD-1029384721',
  },
];

const SEED_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif_1',
    userId: 'LTE-782910',
    title: 'Withdrawal of $120.00 Paid!',
    message: 'Your bKash withdrawal of $120.00 has been sent successfully. TrxID: BKX-9823019842.',
    type: 'payment',
    isRead: false,
    date: '2026-11-04 15:10',
  },
  {
    id: 'notif_2',
    userId: 'LTE-782910',
    title: 'Referral Bonus Received: +$10.00',
    message: 'Nafisa Sultana joined using your referral link. $10.00 was credited to your balance.',
    type: 'referral',
    isRead: true,
    date: '2026-11-01 10:20',
  },
  {
    id: 'notif_3',
    userId: 'LTE-782910',
    title: 'Tournament Victory: Rank #1!',
    message: 'Congratulations! You secured 1st Place in Arcade Space Galaxy Cup and won $125.00 cash.',
    type: 'tournament',
    isRead: false,
    date: '2026-11-08 21:15',
  },
];

const SEED_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'LOG-001',
    adminEmail: 'admin@lazytoearn.com',
    action: 'WITHDRAWAL_APPROVED',
    targetUserId: 'LTE-782910',
    targetUserName: 'Tanvir Hossain',
    details: 'Approved $120.00 withdrawal via bKash. TrxID: BKX-9823019842.',
    timestamp: '2026-11-04 15:10:00',
    severity: 'info',
  },
  {
    id: 'LOG-002',
    adminEmail: 'admin@lazytoearn.com',
    action: 'SETTINGS_UPDATE',
    targetUserId: 'SYSTEM',
    targetUserName: 'Platform Core',
    details: 'Verified anti-cheat duration minimum set to 5 seconds per game round.',
    timestamp: '2026-11-10 08:00:00',
    severity: 'info',
  },
];

const SEED_REFERRALS: ReferralRecord[] = [
  {
    id: 'REF-001',
    referrerId: 'LTE-782910',
    referredUserId: 'LTE-419082',
    name: 'Nafisa Sultana',
    email: 'nafisa@gmail.com',
    date: '2026-11-01',
    status: 'Verified',
    reward: 10.0,
  },
  {
    id: 'REF-002',
    referrerId: 'LTE-782910',
    referredUserId: 'LTE-639104',
    name: 'Kazi Mahin',
    email: 'mahin@gmail.com',
    date: '2026-11-09',
    status: 'Verified',
    reward: 10.0,
  },
];

const SEED_GAME_HISTORY: UserGameHistoryRecord[] = [
  {
    id: 'GH-981011',
    userId: 'LTE-782910',
    gameId: 'racing_highway',
    gameName: 'Highway Car Racing',
    date: '2026-11-12 11:24',
    score: 4410,
    result: 'Win',
    rewardAmount: 2.0,
    status: 'Credited',
    durationSeconds: 32,
    isMiniGame: false,
  },
  {
    id: 'GH-981012',
    userId: 'LTE-782910',
    gameId: 'cards_solitaire',
    gameName: 'Solitaire',
    date: '2026-11-12 10:15',
    score: 820,
    result: 'Win',
    rewardAmount: 2.0,
    status: 'Credited',
    durationSeconds: 45,
    isMiniGame: false,
  },
  {
    id: 'GH-981013',
    userId: 'LTE-782910',
    gameId: 'arcade_space_invaders',
    gameName: 'Space Invaders Retro',
    date: '2026-11-11 20:05',
    score: 1450,
    result: 'Loss',
    rewardAmount: 1.0,
    status: 'Credited',
    durationSeconds: 22,
    isMiniGame: false,
  },
];

const DEFAULT_GAME_SETTINGS: GameZoneSettings = {
  defaultWinReward: 2.0,
  defaultLossReward: 1.0,
  dailyGameLimit: 50,
  miniGameDailyLimit: 40,
  adInterstitials: true,
};

class DatabaseService {
  private usersKey = 'lte_db_users_v2';
  private withdrawalsKey = 'lte_db_withdrawals_v2';
  private notifsKey = 'lte_db_notifs_v2';
  private logsKey = 'lte_db_logs_v2';
  private referralsKey = 'lte_db_referrals_v2';
  private gamesKey = 'lte_db_games_v2';
  private gameHistoryKey = 'lte_db_game_history_v2';
  private gameSettingsKey = 'lte_db_game_settings_v2';
  private transactionsKey = 'lte_db_transactions_v2';
  private missionsKey = 'lte_db_missions_v2';
  private scratchHistoryKey = 'lte_db_scratch_history_v2';
  private spinHistoryKey = 'lte_db_spin_history_v2';
  private tournamentsKey = 'lte_db_tournaments_v2';
  private achievementsKey = 'lte_db_achievements_v2';
  private promoCodesKey = 'lte_db_promos_v2';
  private ticketsKey = 'lte_db_tickets_v2';
  private adPlacementsKey = 'lte_db_ads_v2';
  private withdrawalScheduleKey = 'lte_db_withdrawal_schedule_v1';

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(this.withdrawalsKey)) {
      localStorage.setItem(this.withdrawalsKey, JSON.stringify(SEED_WITHDRAWALS));
    }
    if (!localStorage.getItem(this.notifsKey)) {
      localStorage.setItem(this.notifsKey, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(this.logsKey)) {
      localStorage.setItem(this.logsKey, JSON.stringify(SEED_AUDIT_LOGS));
    }
    if (!localStorage.getItem(this.referralsKey)) {
      localStorage.setItem(this.referralsKey, JSON.stringify(SEED_REFERRALS));
    }
    if (!localStorage.getItem(this.gamesKey)) {
      localStorage.setItem(this.gamesKey, JSON.stringify(ALL_INITIAL_GAMES));
    }
    if (!localStorage.getItem(this.gameHistoryKey)) {
      localStorage.setItem(this.gameHistoryKey, JSON.stringify(SEED_GAME_HISTORY));
    }
    if (!localStorage.getItem(this.gameSettingsKey)) {
      localStorage.setItem(this.gameSettingsKey, JSON.stringify(DEFAULT_GAME_SETTINGS));
    }
    if (!localStorage.getItem(this.transactionsKey)) {
      localStorage.setItem(this.transactionsKey, JSON.stringify(INITIAL_TRANSACTIONS));
    }
    if (!localStorage.getItem(this.missionsKey)) {
      localStorage.setItem(this.missionsKey, JSON.stringify(INITIAL_MISSIONS));
    }
    if (!localStorage.getItem(this.tournamentsKey)) {
      localStorage.setItem(this.tournamentsKey, JSON.stringify(INITIAL_TOURNAMENTS));
    }
    if (!localStorage.getItem(this.achievementsKey)) {
      localStorage.setItem(this.achievementsKey, JSON.stringify(INITIAL_ACHIEVEMENTS));
    }
    if (!localStorage.getItem(this.promoCodesKey)) {
      localStorage.setItem(this.promoCodesKey, JSON.stringify(INITIAL_PROMO_CODES));
    }
    if (!localStorage.getItem(this.ticketsKey)) {
      localStorage.setItem(this.ticketsKey, JSON.stringify(INITIAL_TICKETS));
    }
    if (!localStorage.getItem(this.adPlacementsKey)) {
      localStorage.setItem(this.adPlacementsKey, JSON.stringify(INITIAL_AD_PLACEMENTS));
    }
    if (!localStorage.getItem(this.withdrawalScheduleKey)) {
      localStorage.setItem(this.withdrawalScheduleKey, JSON.stringify(DEFAULT_WITHDRAWAL_SCHEDULE));
    }
  }

  // --- Users ---
  getUsers(): UserAccount[] {
    const raw = localStorage.getItem(this.usersKey);
    return raw ? JSON.parse(raw) : SEED_USERS;
  }

  getUserById(id: string): UserAccount | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  getUserByEmail(email: string): UserAccount | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  saveUser(user: UserAccount): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  // --- Transactions Ledger ---
  getTransactions(userId?: string): WalletTransaction[] {
    const raw = localStorage.getItem(this.transactionsKey);
    const list: WalletTransaction[] = raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
    if (userId) {
      return list.filter((t) => t.userId === userId);
    }
    return list;
  }

  addTransaction(
    userId: string,
    type: 'credit' | 'debit',
    category: WalletTransaction['category'],
    amount: number,
    description: string,
    points?: number
  ): WalletTransaction {
    const user = this.getUserById(userId);
    const balanceAfter = user ? user.availableBalance : 0;
    const tx: WalletTransaction = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      userId,
      type,
      category,
      amount,
      points,
      balanceAfter,
      description,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Completed',
    };
    const list = this.getTransactions();
    list.unshift(tx);
    localStorage.setItem(this.transactionsKey, JSON.stringify(list));
    return tx;
  }

  // --- Withdrawals ---
  getWithdrawals(): WithdrawalRecord[] {
    const raw = localStorage.getItem(this.withdrawalsKey);
    return raw ? JSON.parse(raw) : SEED_WITHDRAWALS;
  }

  getUserWithdrawals(userId: string): WithdrawalRecord[] {
    return this.getWithdrawals().filter((w) => w.userId === userId);
  }

  createWithdrawal(
    user: UserAccount,
    amount: number,
    method: WithdrawalRecord['paymentMethod'],
    accountNumber: string,
    accountType: any = 'Personal'
  ): { success: boolean; error?: string; record?: WithdrawalRecord } {
    const scheduleConfig = this.getWithdrawalScheduleConfig();
    const userWithdrawals = this.getUserWithdrawals(user.id);
    const effectiveTier = getEffectiveVipTier(user);
    const scheduleStatus = evaluateWithdrawalSchedule(
      scheduleConfig,
      effectiveTier,
      userWithdrawals,
      user.availableBalance
    );

    if (!scheduleStatus.withdrawalsEnabled) {
      return { success: false, error: 'Withdrawals are currently paused by administrator.' };
    }
    if (!scheduleStatus.isWindowOpen) {
      return {
        success: false,
        error: `Withdrawal window is closed (${scheduleStatus.timezone}). Next window opens on ${scheduleStatus.nextWindow.dateFormatted}.`,
      };
    }
    if (scheduleStatus.remainingThisMonth <= 0) {
      return {
        success: false,
        error: `Monthly withdrawal limit reached (${scheduleStatus.usedThisMonth}/${scheduleStatus.monthlyLimit} used this month).`,
      };
    }
    const hasPending = userWithdrawals.some(
      (w) => w.status === 'Pending' || w.status === 'Processing' || w.status === 'Approved'
    );
    if (hasPending) {
      return {
        success: false,
        error: 'Duplicate withdrawal prevented: you already have a pending request in review.',
      };
    }

    const minRequired = scheduleConfig.minWithdrawal;
    const maxAllowed = scheduleConfig.maxWithdrawal;

    if (amount < minRequired) {
      return { success: false, error: `Minimum payout is $${minRequired.toFixed(2)}.` };
    }
    if (amount > maxAllowed) {
      return { success: false, error: `Maximum single withdrawal is $${maxAllowed.toFixed(2)}.` };
    }
    if (amount > user.availableBalance) {
      return { success: false, error: 'Insufficient balance available for cashout.' };
    }

    const feeRate = (scheduleConfig.feePercent || 0) / 100;
    const fee = +(amount * feeRate).toFixed(2);
    const netAmount = +(amount - fee).toFixed(2);

    const newRecord: WithdrawalRecord = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000) + '-' + method.slice(0, 2).toUpperCase(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
      fee,
      netAmount,
      paymentMethod: method,
      accountNumberFull: accountNumber,
      accountNumberMasked: maskAccount(accountNumber),
      accountType,
      status: 'Pending',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    user.availableBalance = +(user.availableBalance - amount).toFixed(2);
    user.pendingBalance = +(user.pendingBalance + amount).toFixed(2);
    this.saveUser(user);

    const withdrawals = this.getWithdrawals();
    withdrawals.unshift(newRecord);
    localStorage.setItem(this.withdrawalsKey, JSON.stringify(withdrawals));

    this.addTransaction(
      user.id,
      'debit',
      'withdrawal',
      amount,
      `Requested withdrawal of $${amount.toFixed(2)} via ${method} (Pending approval)`
    );

    return { success: true, record: newRecord };
  }

  approveWithdrawal(withdrawalId: string, referenceCode: string, adminEmail: string): boolean {
    const list = this.getWithdrawals();
    const item = list.find((w) => w.id === withdrawalId);
    if (!item) return false;

    item.status = 'Paid';
    item.paymentDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    item.adminTransactionReference = referenceCode;
    localStorage.setItem(this.withdrawalsKey, JSON.stringify(list));

    const user = this.getUserById(item.userId);
    if (user) {
      user.pendingBalance = Math.max(0, +(user.pendingBalance - item.amount).toFixed(2));
      user.totalWithdrawals = +(user.totalWithdrawals + item.amount).toFixed(2);
      this.saveUser(user);
    }

    this.createNotification(
      item.userId,
      `Withdrawal of $${item.amount.toFixed(2)} Paid!`,
      `Your cashout via ${item.paymentMethod} has been approved and sent! Ref: ${referenceCode}.`,
      'payment'
    );

    return true;
  }

  rejectWithdrawal(withdrawalId: string, reason: string, adminEmail: string): boolean {
    const list = this.getWithdrawals();
    const item = list.find((w) => w.id === withdrawalId);
    if (!item) return false;

    item.status = 'Rejected';
    item.rejectionReason = reason;
    localStorage.setItem(this.withdrawalsKey, JSON.stringify(list));

    const user = this.getUserById(item.userId);
    if (user) {
      user.availableBalance = +(user.availableBalance + item.amount).toFixed(2);
      user.pendingBalance = Math.max(0, +(user.pendingBalance - item.amount).toFixed(2));
      this.saveUser(user);
    }

    this.createNotification(
      item.userId,
      `Withdrawal Request Returned`,
      `Your payout request was rejected. Reason: ${reason}. Funds have been refunded to your wallet.`,
      'payment'
    );

    return true;
  }

  // --- Notifications ---
  getNotifications(): UserNotification[] {
    const raw = localStorage.getItem(this.notifsKey);
    return raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
  }

  getUserNotifications(userId: string): UserNotification[] {
    return this.getNotifications().filter((n) => n.userId === userId);
  }

  createNotification(
    userId: string,
    title: string,
    message: string,
    type: UserNotification['type'],
    actionUrl?: string
  ): void {
    const notifs = this.getNotifications();
    notifs.unshift({
      id: 'notif_' + Date.now(),
      userId,
      title,
      message,
      type,
      isRead: false,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      actionUrl,
    });
    localStorage.setItem(this.notifsKey, JSON.stringify(notifs));
  }

  markAllNotificationsRead(userId: string): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    localStorage.setItem(this.notifsKey, JSON.stringify(notifs));
  }

  // --- Audit Logs ---
  getAuditLogs(): AdminAuditLog[] {
    const raw = localStorage.getItem(this.logsKey);
    return raw ? JSON.parse(raw) : SEED_AUDIT_LOGS;
  }

  addAuditLog(
    adminEmail: string,
    action: string,
    targetUserId: string,
    targetUserName: string,
    details: string,
    severity: AdminAuditLog['severity'] = 'info'
  ): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      adminEmail,
      action,
      targetUserId,
      targetUserName,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity,
    });
    localStorage.setItem(this.logsKey, JSON.stringify(logs));
  }

  getSpinSegments(): SpinSegment[] {
    return SPIN_SEGMENTS;
  }

  // --- Lucky Spin Wheel (Server Verified) ---
  spinWheel(userId: string): { success: boolean; segment: SpinSegment; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, segment: SPIN_SEGMENTS[0], error: 'User not found.' };

    const vip = VIP_TIERS[getEffectiveVipTier(user)];
    const maxSpins = vip.dailyFreeSpins;

    if (user.spinsUsedToday >= maxSpins) {
      return {
        success: false,
        segment: SPIN_SEGMENTS[0],
        error: `Daily spin limit reached (${user.spinsUsedToday}/${maxSpins}). Upgrade to VIP or return tomorrow!`,
      };
    }

    const totalWeight = SPIN_SEGMENTS.reduce((acc, s) => acc + s.probabilityWeight, 0);
    let rand = Math.random() * totalWeight;
    let selectedSegment = SPIN_SEGMENTS[0];

    for (const seg of SPIN_SEGMENTS) {
      if (rand < seg.probabilityWeight) {
        selectedSegment = seg;
        break;
      }
      rand -= seg.probabilityWeight;
    }

    user.spinsUsedToday += 1;

    if (selectedSegment.type === 'cash') {
      const awarded = +(selectedSegment.value * vip.multiplier).toFixed(2);
      user.availableBalance = +(user.availableBalance + awarded).toFixed(2);
      user.totalEarnings = +(user.totalEarnings + awarded).toFixed(2);
      user.todayEarnings = +(user.todayEarnings + awarded).toFixed(2);
      user.lifetimeEarnings = +(user.lifetimeEarnings + awarded).toFixed(2);
      this.addTransaction(userId, 'credit', 'spin', awarded, `Lucky Spin Wheel: Won ${selectedSegment.label}`);
    } else if (selectedSegment.type === 'points') {
      user.points = (user.points || 0) + selectedSegment.value;
      this.addTransaction(userId, 'credit', 'spin', 0, `Lucky Spin Wheel: Won ${selectedSegment.label}`, selectedSegment.value);
    } else if (selectedSegment.type === 'spin') {
      user.spinsUsedToday = Math.max(0, user.spinsUsedToday - 1);
    }

    this.saveUser(user);

    const historyRaw = localStorage.getItem(this.spinHistoryKey);
    const history: SpinRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({
      id: 'SPIN-' + Date.now(),
      userId,
      userName: user.name,
      segmentId: selectedSegment.id,
      label: selectedSegment.label,
      rewardType: selectedSegment.type,
      rewardValue: selectedSegment.value,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      verified: true,
    });
    localStorage.setItem(this.spinHistoryKey, JSON.stringify(history.slice(0, 50)));

    return { success: true, segment: selectedSegment };
  }

  getSpinHistory(userId?: string): SpinRecord[] {
    const raw = localStorage.getItem(this.spinHistoryKey);
    const list: SpinRecord[] = raw ? JSON.parse(raw) : [];
    if (userId) return list.filter((r) => r.userId === userId);
    return list;
  }

  // --- Daily Missions ---
  getMissions(): DailyMission[] {
    const raw = localStorage.getItem(this.missionsKey);
    return raw ? JSON.parse(raw) : INITIAL_MISSIONS;
  }

  claimMission(userId: string, missionId: string): { success: boolean; cash: number; points: number; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, cash: 0, points: 0, error: 'User not found.' };

    const missions = this.getMissions();
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return { success: false, cash: 0, points: 0, error: 'Mission not found.' };

    if (!mission.isCompleted) {
      return { success: false, cash: 0, points: 0, error: 'Mission target not yet achieved.' };
    }
    if (mission.isClaimed) {
      return { success: false, cash: 0, points: 0, error: 'Mission reward has already been claimed.' };
    }

    const vip = VIP_TIERS[getEffectiveVipTier(user)];
    const cashAwarded = +(mission.rewardCash * vip.multiplier).toFixed(2);
    const pointsAwarded = Math.round(mission.rewardPoints * vip.multiplier);

    user.availableBalance = +(user.availableBalance + cashAwarded).toFixed(2);
    user.totalEarnings = +(user.totalEarnings + cashAwarded).toFixed(2);
    user.todayEarnings = +(user.todayEarnings + cashAwarded).toFixed(2);
    user.points = (user.points || 0) + pointsAwarded;
    this.saveUser(user);

    mission.isClaimed = true;
    localStorage.setItem(this.missionsKey, JSON.stringify(missions));

    this.addTransaction(
      userId,
      'credit',
      'mission',
      cashAwarded,
      `Completed Daily Mission: ${mission.title}`,
      pointsAwarded
    );

    return { success: true, cash: cashAwarded, points: pointsAwarded };
  }

  updateMissionProgress(missionId: string, delta = 1): void {
    const missions = this.getMissions();
    const m = missions.find((item) => item.id === missionId);
    if (m && !m.isCompleted) {
      m.currentCount = Math.min(m.targetCount, m.currentCount + delta);
      if (m.currentCount >= m.targetCount) {
        m.isCompleted = true;
      }
      localStorage.setItem(this.missionsKey, JSON.stringify(missions));
    }
  }

  // --- Scratch Cards ---
  scratchCard(userId: string, cardId: string): { success: boolean; play?: ScratchCardPlay; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found.' };

    const card = SCRATCH_CARDS.find((c) => c.id === cardId);
    if (!card) return { success: false, error: 'Card config not found.' };

    const vip = VIP_TIERS[getEffectiveVipTier(user)];
    if (user.scratchesUsedToday >= (card.dailyLimit + vip.dailyFreeScratches)) {
      return { success: false, error: 'Daily scratch card limit reached. Come back tomorrow!' };
    }

    if (card.costPoints > 0 && user.points < card.costPoints) {
      return { success: false, error: `Requires ${card.costPoints} points. You have ${user.points} points.` };
    }

    if (card.costPoints > 0) {
      user.points -= card.costPoints;
    }
    user.scratchesUsedToday += 1;

    const winningSymbol = '💎';
    const isWin = Math.random() < 0.65;
    let symbols: string[];
    let prizeAmount = 0;

    if (isWin) {
      symbols = [winningSymbol, winningSymbol, winningSymbol];
      const percent = 0.2 + Math.random() * 0.8;
      prizeAmount = +(card.maxCashPrize * percent * vip.multiplier).toFixed(2);
      user.availableBalance = +(user.availableBalance + prizeAmount).toFixed(2);
      user.totalEarnings = +(user.totalEarnings + prizeAmount).toFixed(2);
      user.todayEarnings = +(user.todayEarnings + prizeAmount).toFixed(2);

      this.addTransaction(
        userId,
        'credit',
        'scratch',
        prizeAmount,
        `Scratch Card Win: ${card.title} (3x ${winningSymbol})`
      );
    } else {
      symbols = [winningSymbol, '⭐', '🪙'];
      prizeAmount = 0;
    }

    this.saveUser(user);

    const play: ScratchCardPlay = {
      id: 'SCR-' + Date.now(),
      userId,
      cardId,
      tier: card.tier,
      symbols,
      winningSymbol,
      isWin,
      prizeAmount,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const histRaw = localStorage.getItem(this.scratchHistoryKey);
    const hist: ScratchCardPlay[] = histRaw ? JSON.parse(histRaw) : [];
    hist.unshift(play);
    localStorage.setItem(this.scratchHistoryKey, JSON.stringify(hist.slice(0, 50)));

    return { success: true, play };
  }

  getScratchHistory(userId?: string): ScratchCardPlay[] {
    const raw = localStorage.getItem(this.scratchHistoryKey);
    const list: ScratchCardPlay[] = raw ? JSON.parse(raw) : [];
    if (userId) return list.filter((p) => p.userId === userId);
    return list;
  }

  // --- Tournaments ---
  getTournaments(): Tournament[] {
    const raw = localStorage.getItem(this.tournamentsKey);
    return raw ? JSON.parse(raw) : INITIAL_TOURNAMENTS;
  }

  joinTournament(userId: string, tournamentId: string): { success: boolean; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found.' };

    const tournaments = this.getTournaments();
    const t = tournaments.find((item) => item.id === tournamentId);
    if (!t) return { success: false, error: 'Tournament not found.' };

    if (t.status !== 'Active') {
      return { success: false, error: 'This tournament is not currently active.' };
    }

    const alreadyJoined = t.leaderboard.some((p) => p.userId === userId);
    if (alreadyJoined) {
      return { success: true };
    }

    if (t.entryFeePoints > 0 && user.points < t.entryFeePoints) {
      return { success: false, error: `Insufficient points. Required: ${t.entryFeePoints} points.` };
    }

    if (t.entryFeePoints > 0) {
      user.points -= t.entryFeePoints;
      this.saveUser(user);
      this.addTransaction(
        userId,
        'debit',
        'tournament',
        0,
        `Entry fee for tournament: ${t.title}`,
        t.entryFeePoints
      );
    }

    t.participantsCount += 1;
    t.leaderboard.push({
      userId: user.id,
      userName: user.name,
      avatarUrl: user.avatarUrl,
      score: 0,
      rank: t.leaderboard.length + 1,
      reward: 0,
      playedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    localStorage.setItem(this.tournamentsKey, JSON.stringify(tournaments));
    return { success: true };
  }

  recordTournamentScore(userId: string, tournamentId: string, newScore: number): boolean {
    const tournaments = this.getTournaments();
    const t = tournaments.find((item) => item.id === tournamentId);
    if (!t) return false;

    let participant = t.leaderboard.find((p) => p.userId === userId);
    if (!participant) {
      const user = this.getUserById(userId);
      if (!user) return false;
      participant = {
        userId: user.id,
        userName: user.name,
        avatarUrl: user.avatarUrl,
        score: newScore,
        rank: t.leaderboard.length + 1,
        reward: 0,
        playedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      t.leaderboard.push(participant);
    } else {
      if (newScore > participant.score) {
        participant.score = newScore;
        participant.playedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      }
    }

    t.leaderboard.sort((a, b) => b.score - a.score);
    t.leaderboard.forEach((p, idx) => {
      p.rank = idx + 1;
      if (p.rank === 1) p.reward = t.firstPlacePrize;
      else if (p.rank === 2) p.reward = t.secondPlacePrize;
      else if (p.rank === 3) p.reward = t.thirdPlacePrize;
      else p.reward = 0;
    });

    localStorage.setItem(this.tournamentsKey, JSON.stringify(tournaments));
    return true;
  }

  // --- Achievements ---
  getAchievements(): AchievementBadge[] {
    const raw = localStorage.getItem(this.achievementsKey);
    return raw ? JSON.parse(raw) : INITIAL_ACHIEVEMENTS;
  }

  claimAchievement(userId: string, achievementId: string): { success: boolean; points: number; cash: number; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, points: 0, cash: 0, error: 'User not found.' };

    const list = this.getAchievements();
    const ach = list.find((a) => a.id === achievementId);
    if (!ach) return { success: false, points: 0, cash: 0, error: 'Achievement not found.' };

    if (!ach.isUnlocked) return { success: false, points: 0, cash: 0, error: 'Achievement not yet unlocked.' };
    if (ach.isClaimed) return { success: false, points: 0, cash: 0, error: 'Reward already claimed.' };

    ach.isClaimed = true;
    localStorage.setItem(this.achievementsKey, JSON.stringify(list));

    user.points = (user.points || 0) + ach.rewardPoints;
    const cash = ach.rewardCash || 0;
    if (cash > 0) {
      user.availableBalance = +(user.availableBalance + cash).toFixed(2);
      user.totalEarnings = +(user.totalEarnings + cash).toFixed(2);
    }
    this.saveUser(user);

    this.addTransaction(
      userId,
      'credit',
      'bonus',
      cash,
      `Unlocked Achievement Badge: ${ach.title}`,
      ach.rewardPoints
    );

    return { success: true, points: ach.rewardPoints, cash };
  }

  // --- Promo Codes ---
  getPromoCodes(): PromoCode[] {
    const raw = localStorage.getItem(this.promoCodesKey);
    return raw ? JSON.parse(raw) : INITIAL_PROMO_CODES;
  }

  redeemPromoCode(userId: string, codeInput: string): { success: boolean; message?: string; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found.' };

    const codes = this.getPromoCodes();
    const promo = codes.find((p) => p.code.toUpperCase() === codeInput.trim().toUpperCase());

    if (!promo || !promo.isActive) {
      return { success: false, error: 'Invalid or expired promotional code.' };
    }

    if (promo.usedCount >= promo.maxUses) {
      return { success: false, error: 'This promo code has reached its maximum redemption limit.' };
    }

    if (promo.claimedUserIds && promo.claimedUserIds.includes(userId)) {
      return { success: false, error: 'You have already redeemed this promotional code.' };
    }

    promo.usedCount += 1;
    if (!promo.claimedUserIds) promo.claimedUserIds = [];
    promo.claimedUserIds.push(userId);
    localStorage.setItem(this.promoCodesKey, JSON.stringify(codes));

    if (promo.rewardType === 'cash') {
      user.availableBalance = +(user.availableBalance + promo.rewardValue).toFixed(2);
      user.totalEarnings = +(user.totalEarnings + promo.rewardValue).toFixed(2);
      this.addTransaction(userId, 'credit', 'promo', promo.rewardValue, `Redeemed Promo Code: ${promo.code}`);
      this.saveUser(user);
      return { success: true, message: `Success! $${promo.rewardValue.toFixed(2)} cash credited to your balance.` };
    } else if (promo.rewardType === 'points') {
      user.points = (user.points || 0) + promo.rewardValue;
      this.addTransaction(userId, 'credit', 'promo', 0, `Redeemed Promo Code: ${promo.code}`, promo.rewardValue);
      this.saveUser(user);
      return { success: true, message: `Success! ${promo.rewardValue} points credited to your rewards wallet.` };
    } else if (promo.rewardType === 'vip') {
      const highest = getHighestVipTier(user);
      if (VIP_TIER_RANK[highest] > VIP_TIER_RANK.Bronze) {
        return { success: false, message: `Downgrade blocked: your account already held ${highest} VIP.` };
      }
      const now = new Date();
      const exp = new Date(now.getTime() + 7 * 86400000);
      user.vipTier = 'Bronze';
      user.highestVipTier = highest === 'Free' ? 'Bronze' : highest;
      user.vipStatus = 'active';
      user.vipStartedAt = now.toISOString();
      user.vipExpiresAt = exp.toISOString();
      user.vipExpiryDate = exp.toISOString().split('T')[0];
      this.saveUser(user);
      return { success: true, message: 'Success! 7-Day Bronze VIP access unlocked with +25% earnings boost!' };
    }

    return { success: true, message: 'Promo code applied successfully.' };
  }

  createPromoCode(
    code: string,
    rewardType: 'cash' | 'points' | 'vip',
    rewardValue: number,
    maxUses: number,
    expiresAt: string
  ): PromoCode {
    const codes = this.getPromoCodes();
    const newCode: PromoCode = {
      id: 'promo_' + Date.now(),
      code: code.toUpperCase().trim(),
      rewardType,
      rewardValue,
      maxUses,
      usedCount: 0,
      expiresAt,
      isActive: true,
      description: `Promotional code ${code.toUpperCase()}`,
      claimedUserIds: [],
    };
    codes.unshift(newCode);
    localStorage.setItem(this.promoCodesKey, JSON.stringify(codes));
    return newCode;
  }

  togglePromoCode(code: string): boolean {
    const codes = this.getPromoCodes();
    const p = codes.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (p) {
      p.isActive = !p.isActive;
      localStorage.setItem(this.promoCodesKey, JSON.stringify(codes));
      return true;
    }
    return false;
  }

  // --- Live Support Tickets ---
  getTickets(): SupportTicket[] {
    const raw = localStorage.getItem(this.ticketsKey);
    return raw ? JSON.parse(raw) : INITIAL_TICKETS;
  }

  getUserTickets(userId: string): SupportTicket[] {
    return this.getTickets().filter((t) => t.userId === userId);
  }

  createTicket(
    userId: string,
    subject: string,
    category: SupportTicket['category'],
    initialMessage: string,
    priority: SupportTicket['priority'] = 'Medium'
  ): SupportTicket {
    const user = this.getUserById(userId);
    const newTicket: SupportTicket = {
      id: 'TCK-' + Math.floor(10000 + Math.random() * 90000),
      userId,
      userName: user ? user.name : 'User',
      userEmail: user ? user.email : '',
      subject,
      category,
      priority,
      status: 'Open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'user',
          senderName: user ? user.name : 'User',
          message: initialMessage,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
    };

    const tickets = this.getTickets();
    tickets.unshift(newTicket);
    localStorage.setItem(this.ticketsKey, JSON.stringify(tickets));

    setTimeout(() => {
      this.replyTicket(
        newTicket.id,
        'system',
        'Support Bot',
        `Thank you for contacting Lazy To Earn Support! We have received your inquiry under '${category}'. An agent is reviewing your details.`
      );
    }, 1500);

    return newTicket;
  }

  replyTicket(ticketId: string, sender: 'user' | 'admin' | 'system', senderName: string, text: string): boolean {
    const tickets = this.getTickets();
    const t = tickets.find((item) => item.id === ticketId);
    if (!t) return false;

    t.messages.push({
      id: 'msg_' + Date.now(),
      sender,
      senderName,
      message: text,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
    t.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (sender === 'admin') {
      t.status = 'In Progress';
    }
    localStorage.setItem(this.ticketsKey, JSON.stringify(tickets));
    return true;
  }

  updateTicketStatus(ticketId: string, status: SupportTicket['status']): boolean {
    const tickets = this.getTickets();
    const t = tickets.find((item) => item.id === ticketId);
    if (!t) return false;
    t.status = status;
    t.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    localStorage.setItem(this.ticketsKey, JSON.stringify(tickets));
    return true;
  }

  // --- Advertising & Monetization ---
  getAdPlacements(): AdPlacementConfig[] {
    const raw = localStorage.getItem(this.adPlacementsKey);
    return raw ? JSON.parse(raw) : INITIAL_AD_PLACEMENTS;
  }

  updateAdPlacement(id: string, updates: Partial<AdPlacementConfig>): void {
    const list = this.getAdPlacements();
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem(this.adPlacementsKey, JSON.stringify(list));
    }
  }

  recordAdImpression(id: string): void {
    const list = this.getAdPlacements();
    const ad = list.find((a) => a.id === id);
    if (ad) {
      ad.impressions += 1;
      ad.estimatedRevenue = +(ad.estimatedRevenue + 0.015).toFixed(3);
      localStorage.setItem(this.adPlacementsKey, JSON.stringify(list));
    }
  }

  // --- VIP Membership Purchase (30-Day Validity, No Downgrades, Verified Payment) ---
  upgradeVip(
    userId: string,
    tier: VIPTierLevel,
    options?: {
      validityDays?: number;
      priceOverride?: number;
      paymentMethod?: 'Wallet Balance';
      paymentReference?: string;
      allowUpgrades?: boolean;
      allowRenewal?: boolean;
      allowUpgradeWhileExpired?: boolean;
    }
  ): { success: boolean; error?: string; activatedAt?: string; expiresAt?: string; amountPaid?: number; actionType?: 'purchase' | 'renewal' | 'upgrade' } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (tier === 'Free') {
      return { success: false, error: 'Downgrading to Starter (Free) tier is disabled.' };
    }

    const config = VIP_TIERS[tier];
    if (!config) return { success: false, error: 'Selected VIP tier is invalid.' };

    const highestTier = getHighestVipTier(user);
    const highestRank = VIP_TIER_RANK[highestTier] || 0;
    const targetRank = VIP_TIER_RANK[tier] || 0;
    const expired = isVipMembershipExpired(user);

    // Strictly forbid downgrading during OR after membership expiration
    if (highestRank > 0 && targetRank < highestRank) {
      return {
        success: false,
        error: `Downgrades are not allowed. You previously held ${highestTier} VIP, so you cannot switch to ${tier} VIP during or after your membership.`,
      };
    }

    const allowUpgrades = options?.allowUpgrades !== false;
    const allowRenewal = options?.allowRenewal !== false;
    const allowUpgradeWhileExpired = options?.allowUpgradeWhileExpired !== false;

    let actionType: 'purchase' | 'renewal' | 'upgrade' = 'purchase';
    if (highestRank > 0 && targetRank === highestRank) {
      if (!allowRenewal) {
        return { success: false, error: 'Renewals are currently disabled by the administrator.' };
      }
      actionType = 'renewal';
    } else if (highestRank > 0 && targetRank > highestRank) {
      if (!allowUpgrades) {
        return { success: false, error: 'Tier upgrades are currently disabled by the administrator.' };
      }
      if (expired && !allowUpgradeWhileExpired) {
        return { success: false, error: 'Upgrading while expired is disabled. Please renew your current tier first.' };
      }
      actionType = 'upgrade';
    }

    const cost = options?.priceOverride !== undefined ? options.priceOverride : config.priceMonthly;
    const paymentMethod = options?.paymentMethod || 'Wallet Balance';

    if (paymentMethod !== 'Wallet Balance') {
      return {
        success: false,
        error: 'Only Wallet Balance is supported for VIP plan purchases and renewals.',
      };
    }

    if (user.availableBalance < cost) {
      return {
        success: false,
        error: `Insufficient wallet balance. Requires $${cost.toFixed(2)}. Your balance is $${user.availableBalance.toFixed(2)}.`,
      };
    }

    user.availableBalance = +(user.availableBalance - cost).toFixed(2);

    const validityDays = Math.max(1, options?.validityDays || 30);
    const now = new Date();
    const validityMs = validityDays * 86400000;
    let baseExpiryMs = now.getTime();

    if (actionType === 'renewal' && !expired && user.vipExpiresAt) {
      const existingExpMs = new Date(user.vipExpiresAt).getTime();
      if (existingExpMs > now.getTime()) {
        baseExpiryMs = existingExpMs;
      }
    }

    const activatedAt = now.toISOString();
    const expiresAtDate = new Date(baseExpiryMs + validityMs);
    const expiresAt = expiresAtDate.toISOString();

    user.vipTier = tier;
    user.highestVipTier = targetRank >= highestRank ? tier : highestTier;
    user.vipStatus = 'active';
    user.vipStartedAt = activatedAt;
    user.vipExpiresAt = expiresAt;
    user.vipExpiryDate = expiresAt.split('T')[0];
    this.saveUser(user);

    const actionLabel =
      actionType === 'renewal' ? 'Renewed' : actionType === 'upgrade' ? 'Upgraded to' : 'Activated';
    this.addTransaction(
      userId,
      'debit',
      'vip',
      cost,
      `${actionLabel} ${config.name} (${validityDays}-Day Validity · ${paymentMethod})`
    );

    this.createNotification(
      userId,
      `VIP ${actionType === 'renewal' ? 'Renewed' : 'Activated'}: ${config.name}!`,
      `Payment verified! Your ${config.name} benefits are active for ${validityDays} days (until ${user.vipExpiryDate}). Auto-renewal charge is disabled.`,
      'bonus'
    );

    return { success: true, activatedAt, expiresAt, amountPaid: cost, actionType };
  }

  // --- Games ---
  getGames(): GameDefinition[] {
    const raw = localStorage.getItem(this.gamesKey);
    return raw ? JSON.parse(raw) : ALL_INITIAL_GAMES;
  }

  getGameById(id: string): GameDefinition | undefined {
    return this.getGames().find((g) => g.id === id);
  }

  saveGame(game: GameDefinition): void {
    const games = this.getGames();
    const idx = games.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      games[idx] = game;
    } else {
      games.push(game);
    }
    localStorage.setItem(this.gamesKey, JSON.stringify(games));
  }

  toggleGame(id: string): void {
    const games = this.getGames();
    const found = games.find((g) => g.id === id);
    if (found) {
      found.enabled = !found.enabled;
      localStorage.setItem(this.gamesKey, JSON.stringify(games));
    }
  }

  getGameSettings(): GameZoneSettings {
    const raw = localStorage.getItem(this.gameSettingsKey);
    return raw ? JSON.parse(raw) : DEFAULT_GAME_SETTINGS;
  }

  updateGameSettings(updates: Partial<GameZoneSettings>): void {
    const current = this.getGameSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.gameSettingsKey, JSON.stringify(updated));
  }

  getAllGameHistory(): UserGameHistoryRecord[] {
    const raw = localStorage.getItem(this.gameHistoryKey);
    return raw ? JSON.parse(raw) : SEED_GAME_HISTORY;
  }

  getUserGameHistory(userId: string): UserGameHistoryRecord[] {
    return this.getAllGameHistory().filter((h) => h.userId === userId);
  }

  recordGamePlay(
    userId: string,
    gameId: string,
    gameName: string,
    score: number,
    isWin: boolean,
    durationSeconds: number
  ): { record: UserGameHistoryRecord; reward: number; error?: string } {
    const settings = this.getGameSettings();
    const userHistory = this.getUserGameHistory(userId);
    const user = this.getUserById(userId);

    const today = new Date().toISOString().split('T')[0];
    const gamesPlayedToday = userHistory.filter((h) => h.date.startsWith(today)).length;
    if (gamesPlayedToday >= settings.dailyGameLimit) {
      return {
        record: {} as any,
        reward: 0,
        error: `Daily limit of ${settings.dailyGameLimit} games reached. Return tomorrow!`,
      };
    }

    const vip = VIP_TIERS[getEffectiveVipTier(user)];
    const game = this.getGameById(gameId);
    const baseReward = isWin
      ? game?.winReward ?? settings.defaultWinReward
      : game?.lossReward ?? settings.defaultLossReward;
    const reward = +(baseReward * vip.multiplier).toFixed(2);

    const record: UserGameHistoryRecord = {
      id: 'GH-' + Math.floor(100000 + Math.random() * 900000),
      userId,
      gameId,
      gameName,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      score,
      result: isWin ? 'Win' : 'Loss',
      rewardAmount: reward,
      status: 'Credited',
      durationSeconds: Math.max(1, durationSeconds),
    };

    const allHistory = this.getAllGameHistory();
    allHistory.unshift(record);
    localStorage.setItem(this.gameHistoryKey, JSON.stringify(allHistory));

    if (game) {
      game.playCount = (game.playCount || 0) + 1;
      this.saveGame(game);
    }

    this.updateMissionProgress('mis_play_games', 1);

    this.addTransaction(
      userId,
      'credit',
      'game',
      reward,
      `Played ${gameName} (${isWin ? 'Victory' : 'Completed'})`
    );

    return { record, reward };
  }

  // --- Monthly Withdrawal Schedule Config ---
  getWithdrawalScheduleConfig(): WithdrawalScheduleConfig {
    const raw = localStorage.getItem(this.withdrawalScheduleKey);
    return raw ? { ...DEFAULT_WITHDRAWAL_SCHEDULE, ...JSON.parse(raw) } : DEFAULT_WITHDRAWAL_SCHEDULE;
  }

  updateWithdrawalScheduleConfig(updates: Partial<WithdrawalScheduleConfig>): WithdrawalScheduleConfig {
    const current = this.getWithdrawalScheduleConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.withdrawalScheduleKey, JSON.stringify(updated));
    return updated;
  }

  // --- Top Referrers Leaderboard & Referrals ---
  getReferrals(): ReferralRecord[] {
    const raw = localStorage.getItem(this.referralsKey);
    return raw ? JSON.parse(raw) : SEED_REFERRALS;
  }

  addReferralRecord(record: ReferralRecord): void {
    const list = this.getReferrals();
    list.unshift(record);
    localStorage.setItem(this.referralsKey, JSON.stringify(list));
  }

  getTopReferrers(): Array<{
    userId: string;
    name: string;
    referralCode: string;
    vipTier: VIPTierLevel;
    avatarUrl: string;
    referralCount: number;
    referralEarnings: number;
  }> {
    const users = this.getUsers().filter((u) => u.role !== 'admin');
    const allRefs = this.getReferrals();

    return users
      .map((u) => {
        const directUsersCount = users.filter(
          (other) => other.referredBy?.toLowerCase() === u.referralCode.toLowerCase()
        ).length;
        const ledgerCount = allRefs.filter((r) => r.referrerId === u.id).length;
        const estimatedByEarnings = Math.floor((u.referralEarnings || 0) / 10);
        const referralCount = Math.max(directUsersCount, ledgerCount, estimatedByEarnings);
        return {
          userId: u.id,
          name: u.name,
          referralCode: u.referralCode,
          vipTier: u.vipTier || 'Free',
          avatarUrl: u.avatarUrl,
          referralCount,
          referralEarnings: u.referralEarnings || 0,
        };
      })
      .sort((a, b) => {
        if (b.referralCount !== a.referralCount) return b.referralCount - a.referralCount;
        return b.referralEarnings - a.referralEarnings;
      });
  }
}

export const db = new DatabaseService();
