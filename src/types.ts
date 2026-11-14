export type PaymentMethod = 'bKash' | 'Nagad' | 'Bank Transfer' | 'Crypto';

export type WithdrawalStatus = 'Pending' | 'Processing' | 'Approved' | 'Paid' | 'Rejected';

export type VIPTierLevel = 'Free' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface VIPTierConfig {
  tier: VIPTierLevel;
  name: string;
  badgeColor: string;
  priceMonthly: number;
  multiplier: number; // e.g. 1.0, 1.25, 1.5, 2.0, 2.5
  dailyFreeSpins: number;
  dailyFreeScratches: number;
  referralBonus: number; // e.g. 10, 12, 15, 20, 25
  payoutSpeed: string;
  perks: string[];
}

export interface VIPSystemSettings {
  validityDays: number; // Default 30 days
  allowUpgrades: boolean;
  allowRenewal: boolean;
  allowUpgradeWhileExpired: boolean;
  autoChargeEnabled: false; // Strictly disabled
}

export interface VIPMembershipHistoryRecord {
  id: string;
  userId: string;
  actionType: 'purchase' | 'renewal' | 'upgrade' | 'promo' | 'admin_grant';
  fromTier: VIPTierLevel;
  toTier: VIPTierLevel;
  highestTierAfter: VIPTierLevel;
  amountPaid: number;
  paymentMethod: string;
  paymentReference: string;
  paymentVerified: boolean;
  validityDays: number;
  activatedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'superseded';
  createdAt: string;
}

export interface VIPMembershipStatus {
  userId: string;
  effectiveTier: VIPTierLevel; // 'Free' when none or expired
  lastPurchasedTier: VIPTierLevel;
  highestTier: VIPTierLevel; // Cannot downgrade below this during or after membership
  status: 'none' | 'active' | 'expired';
  activatedAt?: string;
  expiresAt?: string;
  remainingMs: number;
  autoRenew: false;
  settings: VIPSystemSettings;
  history: VIPMembershipHistoryRecord[];
}

export interface UserAccount {
  id: string; // Unique User ID (e.g. LTE-782910)
  name: string;
  email: string;
  password?: string;
  phone: string;
  avatarUrl: string;
  referralCode: string;
  referredBy?: string;
  registrationDate: string;
  accountStatus: 'Active' | 'Unverified' | 'Suspended';
  emailVerified: boolean;
  role: 'user' | 'admin';

  // Balances
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  lifetimeEarnings: number;
  todayEarnings: number;
  points: number; // Platform reward points
  referralEarnings: number;
  adEarnings: number;
  totalWithdrawals: number;

  // VIP Membership (30-Day Validity & No Downgrades)
  vipTier: VIPTierLevel;
  vipExpiryDate?: string;
  vipStartedAt?: string;
  vipExpiresAt?: string;
  highestVipTier?: VIPTierLevel;
  vipStatus?: 'none' | 'active' | 'expired';

  // Limits & Counters for today
  spinsUsedToday: number;
  scratchesUsedToday: number;
  adsWatchedToday: number;
  lastDailyLoginDate?: string;

  // Payment Settings
  bkashNumber: string;
  nagadNumber: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
  };
  preferredPaymentMethod: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Crypto';
  usdtWallet: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  category:
    | 'ad'
    | 'game'
    | 'mission'
    | 'spin'
    | 'scratch'
    | 'tournament'
    | 'referral'
    | 'vip'
    | 'withdrawal'
    | 'promo'
    | 'bonus';
  amount: number;
  points?: number;
  balanceAfter: number;
  description: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface WithdrawalRecord {
  id: string; // Transaction ID
  userId: string; // Enforce user isolation
  userName: string;
  userEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  accountNumberFull: string;
  accountNumberMasked: string;
  accountType?: 'Personal' | 'Agent' | 'Savings' | 'Checking';
  status: WithdrawalStatus;
  requestDate: string;
  paymentDate?: string;
  adminTransactionReference?: string;
  rejectionReason?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'payment' | 'system' | 'bonus' | 'referral' | 'tournament' | 'mission';
  isRead: boolean;
  date: string;
  actionUrl?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetUserId: string;
  targetUserName: string;
  details: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'security';
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  name: string;
  email: string;
  date: string;
  status: 'Verified' | 'Active' | 'Pending';
  reward: number; // $10 initial
}

export interface DailyStreakInfo {
  currentDay: number; // 1 to 7
  multiplier: number; // 1.0 to 2.0
  lastClaimDate: string;
  streakActive: boolean;
  adsWatchedToday: number;
  adsTargetToday: number;
}

// ==========================================
// LUCKY SPIN WHEEL
// ==========================================
export interface SpinSegment {
  id: string;
  label: string;
  type: 'cash' | 'points' | 'spin' | 'empty';
  value: number;
  color: string;
  textColor: string;
  probabilityWeight: number; // Server-side probability calculation
}

export interface SpinRecord {
  id: string;
  userId: string;
  userName: string;
  segmentId: string;
  label: string;
  rewardType: 'cash' | 'points' | 'spin' | 'empty';
  rewardValue: number;
  date: string;
  verified: boolean;
}

// ==========================================
// DAILY MISSIONS
// ==========================================
export type MissionCategory = 'daily' | 'ads' | 'games' | 'social' | 'tournaments';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  targetCount: number;
  currentCount: number;
  rewardCash: number;
  rewardPoints: number;
  isCompleted: boolean;
  isClaimed: boolean;
  icon: string;
  actionView: string;
}

// ==========================================
// SCRATCH CARDS
// ==========================================
export type ScratchTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ScratchCardConfig {
  id: string;
  tier: ScratchTier;
  title: string;
  description: string;
  costPoints: number; // or 0 for free daily
  maxCashPrize: number;
  cardColor: string;
  dailyLimit: number;
}

export interface ScratchCardPlay {
  id: string;
  userId: string;
  cardId: string;
  tier: ScratchTier;
  symbols: string[];
  winningSymbol: string;
  isWin: boolean;
  prizeAmount: number;
  date: string;
}

// ==========================================
// GAMING TOURNAMENTS
// ==========================================
export interface TournamentParticipant {
  userId: string;
  userName: string;
  avatarUrl: string;
  score: number;
  rank: number;
  reward: number;
  playedAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  category: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  startDate: string;
  endDate: string;
  prizePool: number;
  entryFeePoints: number;
  firstPlacePrize: number;
  secondPlacePrize: number;
  thirdPlacePrize: number;
  participantsCount: number;
  leaderboard: TournamentParticipant[];
  bannerUrl: string;
}

// ==========================================
// ACHIEVEMENTS & BADGES
// ==========================================
export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'earning' | 'missions' | 'social' | 'gaming' | 'vip';
  icon: string;
  targetCount: number;
  currentProgress: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  rewardPoints: number;
  rewardCash?: number;
  dateUnlocked?: string;
}

// ==========================================
// PROMO CODES
// ==========================================
export interface PromoCode {
  id: string;
  code: string;
  rewardType: 'cash' | 'points' | 'vip';
  rewardValue: number; // e.g. $5 cash or 500 points
  vipDurationDays?: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  description: string;
  claimedUserIds: string[];
}

// ==========================================
// LIVE SUPPORT TICKETS
// ==========================================
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin' | 'system';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'Payment & Withdrawal' | 'Missions & Rewards' | 'Games & Tournaments' | 'Account Security' | 'General Inquiry';
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

// ==========================================
// ADVERTISING & MONETIZATION
// ==========================================
export type AdFormat =
  | 'header_banner'
  | 'footer_banner'
  | 'sidebar'
  | 'native'
  | 'interstitial'
  | 'rewarded_video';

export interface AdPlacementConfig {
  id: string;
  name: string;
  format: AdFormat;
  scriptSnippet: string;
  targetUrl: string;
  pageTarget: 'all' | 'home' | 'games' | 'dashboard' | 'watch_ads';
  impressions: number;
  clicks: number;
  estimatedRevenue: number;
  active: boolean;
  frequencyCap: number; // max per hour
}

// ==========================================
// GAMES
// ==========================================
export type MiniGameCategory = 'quick_arcade' | 'brain_memory' | 'fun_casual' | 'skill_timing';

export type GameCategory =
  | 'racing'
  | 'cards'
  | 'arcade'
  | 'puzzle'
  | 'sports'
  | 'quick_arcade'
  | 'brain_memory'
  | 'fun_casual'
  | 'skill_timing';

export interface GameDefinition {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  instructions: string;
  thumbnailUrl: string;
  icon: string;
  winReward: number; // Default $2.00
  lossReward: number; // Default $1.00
  playCount: number;
  rating: number;
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  enabled: boolean;
  minPlaySeconds: number;
  winCondition: string;
  isMiniGame?: boolean;
  miniCategory?: MiniGameCategory;
}

export interface UserGameHistoryRecord {
  id: string;
  userId: string;
  gameId: string;
  gameName: string;
  date: string;
  score: number;
  result: 'Win' | 'Loss';
  rewardAmount: number;
  status: 'Credited';
  durationSeconds: number;
  isMiniGame?: boolean;
}

export interface GameZoneSettings {
  defaultWinReward: number;
  defaultLossReward: number;
  dailyGameLimit: number;
  miniGameDailyLimit?: number;
  adInterstitials: boolean;
}

// ==========================================
// MONTHLY WITHDRAWAL SCHEDULE & COUNTDOWN
// ==========================================
export interface WithdrawalScheduleConfig {
  timezone: string; // Initial: 'Asia/Dhaka'
  withdrawalsEnabled: boolean;
  standardDays: number[]; // Default: [28]
  vipDays: number[]; // Default: [15, 28]
  vipEligibleTiers: VIPTierLevel[]; // Tiers granted VIP schedule
  windowDurationHours: number; // Default: 24 hours from 00:00 of scheduled day
  standardMonthlyLimit: number; // Default: 1
  vipMonthlyLimit: number; // Default: 2
  minWithdrawal: number; // Default: 100
  maxWithdrawal: number; // Default: 5000
  feePercent: number; // Default: 2 (%)
  overrideForceOpen?: boolean; // Admin manual window override
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export interface SingleWindowCountdown {
  label: string;
  dayOfMonth: number;
  dateFormatted: string;
  isoDate: string;
  isOpen: boolean;
  closesAtFormatted?: string;
  countdown: CountdownParts;
}

export interface WithdrawalScheduleStatus {
  timezone: string;
  serverTimeFormatted: string;
  currentMonthKey: string;
  isVipMember: boolean;
  withdrawalsEnabled: boolean;
  isWindowOpen: boolean;
  nextWindow: SingleWindowCountdown;
  vipWindows: SingleWindowCountdown[];
  monthlyLimit: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  feePercent: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  eligibilityReasons: string[];
  isEligibleNow: boolean;
}
