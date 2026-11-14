import {
  CountdownParts,
  SingleWindowCountdown,
  VIPTierLevel,
  WithdrawalRecord,
  WithdrawalScheduleConfig,
  WithdrawalScheduleStatus,
} from '../types';

export const DEFAULT_WITHDRAWAL_SCHEDULE: WithdrawalScheduleConfig = {
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

export function daysInMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Extracts wall-clock date/time parts in an arbitrary IANA timezone (e.g. Asia/Dhaka)
 * and builds an equivalent UTC timestamp representing that wall clock for exact diffing.
 */
export function getZonedParts(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  wallMs: number;
} {
  let tz = timeZone || 'Asia/Dhaka';
  let parts: Intl.DateTimeFormatPart[];
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    parts = fmt.formatToParts(date);
  } catch {
    tz = 'Asia/Dhaka';
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    parts = fmt.formatToParts(date);
  }

  const getNum = (type: string) => {
    const p = parts.find((x) => x.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  const year = getNum('year');
  const month = getNum('month');
  const day = getNum('day');
  let hour = getNum('hour');
  if (hour === 24) hour = 0;
  const minute = getNum('minute');
  const second = getNum('second');

  const wallMs = Date.UTC(year, month - 1, day, hour, minute, second, date.getUTCMilliseconds());
  return { year, month, day, hour, minute, second, wallMs };
}

export function msToCountdownParts(totalMs: number): CountdownParts {
  const clamped = Math.max(0, totalMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs: clamped };
}

function formatZonedDate(year: number, month: number, day: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[month - 1]} ${String(day).padStart(2, '0')}, ${year}`;
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatWallDateTime(wallMs: number): string {
  const d = new Date(wallMs);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${formatIsoDate(year, month, day)} ${hh}:${mm}:${ss}`;
}

/**
 * Computes the current or next occurrence for a scheduled day-of-month (clamping safely for Feb/leap years/30-day months).
 */
export function computeSingleWindowForDay(
  nowWallMs: number,
  currentYear: number,
  currentMonth: number,
  targetDay: number,
  windowDurationHours: number,
  label: string,
  overrideForceOpen = false
): SingleWindowCountdown {
  const durationMs = Math.max(1, windowDurationHours) * 3600 * 1000;

  // Helper to get clamped start timestamp in wallMs for (y, m, targetDay)
  const getWindowStartWallMs = (y: number, m: number) => {
    const maxDay = daysInMonth(y, m);
    const actualDay = Math.min(Math.max(1, targetDay), maxDay);
    return {
      year: y,
      month: m,
      day: actualDay,
      startWallMs: Date.UTC(y, m - 1, actualDay, 0, 0, 0, 0),
    };
  };

  const thisMonthWin = getWindowStartWallMs(currentYear, currentMonth);
  const thisMonthEndWallMs = thisMonthWin.startWallMs + durationMs;

  // Previous month check in case window spans midnight into a new month (rare, e.g., day 31 + 48h)
  const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonthWin = getWindowStartWallMs(prevY, prevM);
  const prevMonthEndWallMs = prevMonthWin.startWallMs + durationMs;

  if (nowWallMs >= prevMonthWin.startWallMs && nowWallMs < prevMonthEndWallMs) {
    return {
      label,
      dayOfMonth: targetDay,
      dateFormatted: formatZonedDate(prevMonthWin.year, prevMonthWin.month, prevMonthWin.day),
      isoDate: formatIsoDate(prevMonthWin.year, prevMonthWin.month, prevMonthWin.day),
      isOpen: true,
      closesAtFormatted: formatWallDateTime(prevMonthEndWallMs),
      countdown: msToCountdownParts(prevMonthEndWallMs - nowWallMs),
    };
  }

  if (nowWallMs >= thisMonthWin.startWallMs && nowWallMs < thisMonthEndWallMs) {
    return {
      label,
      dayOfMonth: targetDay,
      dateFormatted: formatZonedDate(thisMonthWin.year, thisMonthWin.month, thisMonthWin.day),
      isoDate: formatIsoDate(thisMonthWin.year, thisMonthWin.month, thisMonthWin.day),
      isOpen: true,
      closesAtFormatted: formatWallDateTime(thisMonthEndWallMs),
      countdown: msToCountdownParts(thisMonthEndWallMs - nowWallMs),
    };
  }

  if (overrideForceOpen) {
    return {
      label,
      dayOfMonth: targetDay,
      dateFormatted: formatZonedDate(thisMonthWin.year, thisMonthWin.month, thisMonthWin.day),
      isoDate: formatIsoDate(thisMonthWin.year, thisMonthWin.month, thisMonthWin.day),
      isOpen: true,
      closesAtFormatted: 'Admin Override Open',
      countdown: msToCountdownParts(
        nowWallMs < thisMonthWin.startWallMs
          ? thisMonthWin.startWallMs - nowWallMs
          : 0
      ),
    };
  }

  // Otherwise find next upcoming occurrence (either later this month or next month)
  if (nowWallMs < thisMonthWin.startWallMs) {
    return {
      label,
      dayOfMonth: targetDay,
      dateFormatted: formatZonedDate(thisMonthWin.year, thisMonthWin.month, thisMonthWin.day),
      isoDate: formatIsoDate(thisMonthWin.year, thisMonthWin.month, thisMonthWin.day),
      isOpen: false,
      countdown: msToCountdownParts(thisMonthWin.startWallMs - nowWallMs),
    };
  }

  const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonthWin = getWindowStartWallMs(nextY, nextM);

  return {
    label,
    dayOfMonth: targetDay,
    dateFormatted: formatZonedDate(nextMonthWin.year, nextMonthWin.month, nextMonthWin.day),
    isoDate: formatIsoDate(nextMonthWin.year, nextMonthWin.month, nextMonthWin.day),
    isOpen: false,
    countdown: msToCountdownParts(nextMonthWin.startWallMs - nowWallMs),
  };
}

export function evaluateWithdrawalSchedule(
  config: WithdrawalScheduleConfig,
  vipTier: VIPTierLevel,
  userWithdrawals: WithdrawalRecord[],
  availableBalance: number,
  now: Date = new Date()
): WithdrawalScheduleStatus {
  const zoned = getZonedParts(now, config.timezone);
  const currentMonthKey = `${zoned.year}-${String(zoned.month).padStart(2, '0')}`;

  const isVipMember = config.vipEligibleTiers.includes(vipTier);
  const scheduledDays = (isVipMember ? config.vipDays : config.standardDays)
    .slice()
    .sort((a, b) => a - b);

  const windows: SingleWindowCountdown[] = scheduledDays.map((day, idx) =>
    computeSingleWindowForDay(
      zoned.wallMs,
      zoned.year,
      zoned.month,
      day,
      config.windowDurationHours,
      isVipMember
        ? idx === 0
          ? `VIP Window #1 (${ordinal(day)})`
          : `VIP Window #2 (${ordinal(day)})`
        : `Monthly Payout (${ordinal(day)})`,
      !!config.overrideForceOpen
    )
  );

  // Pick active open window or soonest upcoming window
  const openWindow = windows.find((w) => w.isOpen);
  const soonestWindow = windows
    .slice()
    .sort((a, b) => a.countdown.totalMs - b.countdown.totalMs)[0];

  const nextWindow = openWindow || soonestWindow || computeSingleWindowForDay(
    zoned.wallMs,
    zoned.year,
    zoned.month,
    28,
    config.windowDurationHours,
    'Monthly Payout (28th)',
    !!config.overrideForceOpen
  );

  const isWindowOpen = Boolean(openWindow || config.overrideForceOpen);

  // Count non-rejected withdrawals made in currentMonthKey
  const usedThisMonth = userWithdrawals.filter((w) => {
    const reqMonth = (w.requestDate || '').slice(0, 7);
    return reqMonth === currentMonthKey && w.status !== 'Rejected';
  }).length;

  const monthlyLimit = isVipMember ? config.vipMonthlyLimit : config.standardMonthlyLimit;
  const remainingThisMonth = Math.max(0, monthlyLimit - usedThisMonth);

  const hasPending = userWithdrawals.some(
    (w) => w.status === 'Pending' || w.status === 'Processing' || w.status === 'Approved'
  );

  const eligibilityReasons: string[] = [];
  if (!config.withdrawalsEnabled) {
    eligibilityReasons.push('Withdrawals are temporarily paused by administrator.');
  }
  if (!isWindowOpen) {
    eligibilityReasons.push(`Withdrawal window is currently closed. Opens on ${nextWindow.dateFormatted}.`);
  }
  if (remainingThisMonth <= 0) {
    eligibilityReasons.push(`Monthly limit reached (${usedThisMonth}/${monthlyLimit} used in ${currentMonthKey}).`);
  }
  if (hasPending) {
    eligibilityReasons.push('You already have an active pending withdrawal in review.');
  }
  if (availableBalance < config.minWithdrawal) {
    eligibilityReasons.push(`Available balance ($${availableBalance.toFixed(2)}) is below minimum $${config.minWithdrawal.toFixed(2)}.`);
  }

  return {
    timezone: config.timezone,
    serverTimeFormatted: formatWallDateTime(zoned.wallMs),
    currentMonthKey,
    isVipMember,
    withdrawalsEnabled: config.withdrawalsEnabled,
    isWindowOpen,
    nextWindow,
    vipWindows: windows,
    monthlyLimit,
    usedThisMonth,
    remainingThisMonth,
    feePercent: config.feePercent,
    minWithdrawal: config.minWithdrawal,
    maxWithdrawal: config.maxWithdrawal,
    eligibilityReasons,
    isEligibleNow: eligibilityReasons.length === 0,
  };
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
