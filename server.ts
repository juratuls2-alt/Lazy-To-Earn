import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './server/db';
import { createAdvancedRouter } from './server/routes/advanced';
import { createVipRouter, getEffectiveUserVip } from './server/routes/vip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Server-side Secret Access Code (Never exposed to client bundles)
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'Noor2005@';

// In-Memory Rate Limiter: IP -> { attempts: number, lockUntil: number }
interface RateLimitRecord {
  attempts: number;
  lockUntil: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (record) {
    if (record.lockUntil > now) {
      const retryAfterSec = Math.ceil((record.lockUntil - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }
    // If lockout expired, reset
    if (record.lockUntil <= now && record.attempts >= MAX_ATTEMPTS) {
      rateLimits.delete(ip);
    }
  }

  const currentAttempts = record ? record.attempts : 0;
  return { allowed: currentAttempts < MAX_ATTEMPTS, remaining: MAX_ATTEMPTS - currentAttempts };
}

function recordFailedAttempt(ip: string): { remaining: number; locked: boolean } {
  const now = Date.now();
  const record = rateLimits.get(ip) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
    rateLimits.set(ip, record);
    return { remaining: 0, locked: true };
  }

  rateLimits.set(ip, record);
  return { remaining: MAX_ATTEMPTS - record.attempts, locked: false };
}

function clearRateLimit(ip: string) {
  rateLimits.delete(ip);
}

// Server-side Admin Session Store: Token -> { createdAt, expiresAt }
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}
const activeAdminSessions = new Map<string, AdminSession>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Server-side authorization middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeAdminSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeAdminSessions.delete(token);
    return res.status(401).json({ error: 'Session expired or invalid. Please re-authenticate.' });
  }

  // Extend sliding session
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  next();
}

// ==========================================
// ADMIN AUTHENTICATION API ROUTES
// ==========================================

/**
 * POST /api/admin/unlock
 * Single Input: secretCode
 * Rate-limited and validated entirely on the server.
 */
app.post('/api/admin/unlock', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
  const { secretCode } = req.body;

  // 1. Check Rate Limit
  const limitStatus = checkRateLimit(clientIp);
  if (!limitStatus.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Access temporarily locked for ${Math.ceil(
        (limitStatus.retryAfterSec || 60) / 60
      )} minutes.`,
      retryAfterSec: limitStatus.retryAfterSec,
    });
  }

  // 2. Validate Secret Code
  if (!secretCode || typeof secretCode !== 'string' || secretCode !== ADMIN_SECRET_CODE) {
    const { remaining, locked } = recordFailedAttempt(clientIp);
    if (locked) {
      return res.status(429).json({
        error: 'Invalid Secret Code. Access Denied. Too many failed attempts. Account locked for 15 minutes.',
        attemptsRemaining: 0,
      });
    }
    return res.status(401).json({
      error: 'Invalid Secret Code. Access Denied.',
      attemptsRemaining: remaining,
    });
  }

  // 3. Code is valid: Clear rate limit & Generate cryptographic session token
  clearRateLimit(clientIp);
  const sessionToken = 'lte_adm_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;

  activeAdminSessions.set(sessionToken, {
    token: sessionToken,
    createdAt: Date.now(),
    expiresAt,
  });

  return res.status(200).json({
    success: true,
    message: 'Admin Dashboard Unlocked.',
    sessionToken,
    expiresAt,
  });
});

/**
 * POST /api/admin/verify-session
 * Checks if current admin token is active on server
 */
app.post('/api/admin/verify-session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];
  const session = activeAdminSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeAdminSessions.delete(token);
    return res.status(401).json({ valid: false });
  }

  return res.status(200).json({
    valid: true,
    expiresAt: session.expiresAt,
  });
});

/**
 * POST /api/admin/lock
 * Terminates the admin session on the server
 */
app.post('/api/admin/lock', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeAdminSessions.delete(token);
  }
  return res.status(200).json({ success: true, message: 'Admin dashboard safely locked.' });
});

/**
 * Protected Admin Action: System Settings / Ad Management
 */
app.get('/api/admin/config', requireAdminAuth, (_req: Request, res: Response) => {
  return res.status(200).json({
    authorized: true,
    platform: 'Lazy To Earn',
    officialSite: 'https://lasytoearn.blogspot.com',
    minWithdrawal: 100.0,
    directAdUrl: 'https://uplcm.com/4/11629954',
    earnMoreUrl: 'https://uplcm.com/4/12238368',
    referralBonus: 10.0,
    welcomeBonus: 5.0,
    serverTime: new Date().toISOString(),
  });
});

// ==========================================
// SERVER-SIDE VERIFIED REWARDS & LOGIC
// ==========================================

// Server-side Lucky Spin calculation (Anti-cheat)
app.post('/api/spin/play', (req: Request, res: Response) => {
  const { userId, vipTier = 'Free' } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Weight array matching the client segments
  const segments = [
    { id: 'seg_1', label: '$0.50 Cash', type: 'cash', value: 0.5, weight: 25 },
    { id: 'seg_2', label: '100 Points', type: 'points', value: 100, weight: 20 },
    { id: 'seg_3', label: '$1.00 Cash', type: 'cash', value: 1.0, weight: 18 },
    { id: 'seg_4', label: 'Try Again', type: 'empty', value: 0, weight: 10 },
    { id: 'seg_5', label: '$2.00 Cash', type: 'cash', value: 2.0, weight: 12 },
    { id: 'seg_6', label: '250 Points', type: 'points', value: 250, weight: 8 },
    { id: 'seg_7', label: '$5.00 Cash', type: 'cash', value: 5.0, weight: 5 },
    { id: 'seg_8', label: '1 Extra Spin', type: 'spin', value: 1, weight: 2 },
  ];

  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let randomVal = Math.random() * totalWeight;
  let chosen = segments[0];

  for (const seg of segments) {
    if (randomVal < seg.weight) {
      chosen = seg;
      break;
    }
    randomVal -= seg.weight;
  }

  // Server security token to prove outcome was generated on server
  const verificationHash = crypto
    .createHmac('sha256', ADMIN_SECRET_CODE)
    .update(`${userId}:${chosen.id}:${Date.now()}`)
    .digest('hex');

  return res.status(200).json({
    success: true,
    segmentId: chosen.id,
    label: chosen.label,
    type: chosen.type,
    value: chosen.value,
    verificationHash,
    timestamp: new Date().toISOString(),
  });
});

// Server-side Promo Code Verification
app.post('/api/promocode/validate', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Valid promo code string required' });
  }

  const clean = code.trim().toUpperCase();
  const validCodes: Record<string, { rewardType: string; rewardValue: number; description: string }> = {
    LAZY2026: { rewardType: 'cash', rewardValue: 5.0, description: '$5.00 Welcome Cash Bonus' },
    POINTS100: { rewardType: 'points', rewardValue: 200, description: '200 Reward Points' },
    VIPBOOST: { rewardType: 'vip', rewardValue: 0, description: '7-Day Bronze VIP Pass' },
  };

  if (!validCodes[clean]) {
    return res.status(404).json({ valid: false, error: 'Invalid or expired promotional code.' });
  }

  return res.status(200).json({
    valid: true,
    code: clean,
    ...validCodes[clean],
  });
});

// Server-side Health & Platform Statistics API
app.get('/api/platform/stats', (_req: Request, res: Response) => {
  return res.status(200).json({
    platform: 'Lazy To Earn',
    status: 'Operational',
    minWithdrawal: serverScheduleConfig.minWithdrawal,
    timezone: serverScheduleConfig.timezone,
    supportedGateways: ['bKash', 'Nagad', 'Bank Transfer', 'Crypto USDT'],
    totalGames: 50,
    activeTournaments: 2,
    serverTime: new Date().toISOString(),
  });
});

// ==========================================
// SERVER-SIDE MONTHLY WITHDRAWAL SCHEDULER
// ==========================================
interface ServerScheduleConfig {
  timezone: string;
  withdrawalsEnabled: boolean;
  standardDays: number[];
  vipDays: number[];
  vipEligibleTiers: string[];
  windowDurationHours: number;
  standardMonthlyLimit: number;
  vipMonthlyLimit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  feePercent: number;
  overrideForceOpen: boolean;
}

let serverScheduleConfig: ServerScheduleConfig = {
  timezone: 'Asia/Dhaka',
  withdrawalsEnabled: true,
  standardDays: [28],
  vipDays: [15, 28],
  vipEligibleTiers: ['Bronze', 'Silver', 'Gold', 'Platinum'],
  windowDurationHours: 24,
  standardMonthlyLimit: 1,
  vipMonthlyLimit: 2,
  minWithdrawal: 100,
  maxWithdrawal: 5000,
  feePercent: 2,
  overrideForceOpen: false,
};

function getServerZonedParts(date: Date, timeZone: string) {
  let tz = timeZone || 'Asia/Dhaka';
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);
  } catch {
    tz = 'Asia/Dhaka';
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);
  }
  const num = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || '0', 10);
  const year = num('year');
  const month = num('month');
  const day = num('day');
  let hour = num('hour');
  if (hour === 24) hour = 0;
  const minute = num('minute');
  const second = num('second');
  return {
    tz,
    year,
    month,
    day,
    hour,
    minute,
    second,
    wallMs: Date.UTC(year, month - 1, day, hour, minute, second),
  };
}

function serverDaysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function isServerWindowOpenForDays(
  wallMs: number,
  year: number,
  month: number,
  days: number[],
  windowHours: number
): boolean {
  const durMs = Math.max(1, windowHours) * 3600 * 1000;
  for (const d of days) {
    const clampedDay = Math.min(Math.max(1, d), serverDaysInMonth(year, month));
    const startMs = Date.UTC(year, month - 1, clampedDay, 0, 0, 0, 0);
    if (wallMs >= startMs && wallMs < startMs + durMs) return true;

    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    const prevDay = Math.min(Math.max(1, d), serverDaysInMonth(prevY, prevM));
    const prevStartMs = Date.UTC(prevY, prevM - 1, prevDay, 0, 0, 0, 0);
    if (wallMs >= prevStartMs && wallMs < prevStartMs + durMs) return true;
  }
  return false;
}

// Track backend monthly withdrawal usage per user & duplicate prevention
const serverMonthlyWithdrawalClaims = new Map<string, number>();

app.get('/api/withdrawals/schedule', (req: Request, res: Response) => {
  const now = new Date();
  const z = getServerZonedParts(now, serverScheduleConfig.timezone);
  const monthKey = `${z.year}-${String(z.month).padStart(2, '0')}`;
  const userId = (req.query.userId as string) || '';
  const serverVip = userId ? getEffectiveUserVip(userId) : null;
  const vipTier =
    serverVip && serverVip.status !== 'none'
      ? serverVip.effectiveTier
      : ((req.query.vipTier as string) || 'Free');
  const isVip = serverScheduleConfig.vipEligibleTiers.includes(vipTier);
  const days = isVip ? serverScheduleConfig.vipDays : serverScheduleConfig.standardDays;
  const windowOpen =
    serverScheduleConfig.overrideForceOpen ||
    isServerWindowOpenForDays(z.wallMs, z.year, z.month, days, serverScheduleConfig.windowDurationHours);

  return res.status(200).json({
    config: serverScheduleConfig,
    serverUtcIso: now.toISOString(),
    serverZonedIso: `${monthKey}-${String(z.day).padStart(2, '0')}T${String(z.hour).padStart(2, '0')}:${String(
      z.minute
    ).padStart(2, '0')}:${String(z.second).padStart(2, '0')}`,
    currentMonthKey: monthKey,
    isVip,
    isWindowOpen: windowOpen,
  });
});

app.post('/api/withdrawals/validate', (req: Request, res: Response) => {
  const { userId, vipTier = 'Free', amount, usedThisMonthClient = 0, hasPendingClient = false } = req.body;
  if (!userId || typeof amount !== 'number') {
    return res.status(400).json({ allowed: false, error: 'Missing userId or numeric amount.' });
  }
  if (!serverScheduleConfig.withdrawalsEnabled) {
    return res.status(403).json({ allowed: false, error: 'Withdrawals are currently disabled by administrator.' });
  }
  if (hasPendingClient) {
    return res.status(409).json({ allowed: false, error: 'Duplicate withdrawal blocked: pending request already exists.' });
  }

  const now = new Date();
  const z = getServerZonedParts(now, serverScheduleConfig.timezone);
  const monthKey = `${z.year}-${String(z.month).padStart(2, '0')}`;
  const serverVip = getEffectiveUserVip(userId);
  const effectiveVipTier = serverVip.status !== 'none' ? serverVip.effectiveTier : vipTier;
  const isVip = serverScheduleConfig.vipEligibleTiers.includes(effectiveVipTier);
  const days = isVip ? serverScheduleConfig.vipDays : serverScheduleConfig.standardDays;
  const limit = isVip ? serverScheduleConfig.vipMonthlyLimit : serverScheduleConfig.standardMonthlyLimit;

  const serverKey = `${userId}:${monthKey}`;
  const serverUsed = serverMonthlyWithdrawalClaims.get(serverKey) || 0;
  const effectiveUsed = Math.max(serverUsed, Number(usedThisMonthClient) || 0);

  const windowOpen =
    serverScheduleConfig.overrideForceOpen ||
    isServerWindowOpenForDays(z.wallMs, z.year, z.month, days, serverScheduleConfig.windowDurationHours);

  if (!windowOpen) {
    return res.status(403).json({
      allowed: false,
      error: `Withdrawal window is closed (${serverScheduleConfig.timezone}). Scheduled days: ${days.join(', ')}.`,
    });
  }
  if (effectiveUsed >= limit) {
    return res.status(403).json({
      allowed: false,
      error: `Monthly withdrawal limit reached (${effectiveUsed}/${limit}) for ${monthKey}.`,
    });
  }
  if (amount < serverScheduleConfig.minWithdrawal) {
    return res.status(400).json({
      allowed: false,
      error: `Amount $${amount.toFixed(2)} is below server minimum of $${serverScheduleConfig.minWithdrawal.toFixed(2)}.`,
    });
  }
  if (amount > serverScheduleConfig.maxWithdrawal) {
    return res.status(400).json({
      allowed: false,
      error: `Amount $${amount.toFixed(2)} exceeds server maximum of $${serverScheduleConfig.maxWithdrawal.toFixed(2)}.`,
    });
  }

  serverMonthlyWithdrawalClaims.set(serverKey, effectiveUsed + 1);
  const fee = +((amount * serverScheduleConfig.feePercent) / 100).toFixed(2);
  const netAmount = +(amount - fee).toFixed(2);

  return res.status(200).json({
    allowed: true,
    monthKey,
    fee,
    netAmount,
    feePercent: serverScheduleConfig.feePercent,
    remainingAfter: Math.max(0, limit - (effectiveUsed + 1)),
  });
});

app.post('/api/admin/withdrawal-schedule', requireAdminAuth, (req: Request, res: Response) => {
  const updates = req.body || {};
  serverScheduleConfig = {
    ...serverScheduleConfig,
    ...updates,
  };
  return res.status(200).json({ success: true, config: serverScheduleConfig });
});

// Initialize SQLite database & mount advanced platform modules
initializeDatabase();
app.use('/api', createVipRouter(requireAdminAuth));
app.use('/api', createAdvancedRouter(requireAdminAuth));
app.use('/api', (_req: Request, res: Response) => {
  return res.status(404).json({ error: 'API endpoint not found.' });
});

// ==========================================
// VITE DEV SERVER / STATIC SERVING
// ==========================================
async function startServer() {
  const port = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Lazy To Earn server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
