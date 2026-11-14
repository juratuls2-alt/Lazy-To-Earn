-- Lazy To Earn - VIP 30-Day Validity, No-Downgrade & Admin Config Migration 002
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vip_system_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  validity_days INTEGER NOT NULL DEFAULT 30 CHECK (validity_days >= 1 AND validity_days <= 365),
  allow_upgrades INTEGER NOT NULL DEFAULT 1,
  allow_renewal INTEGER NOT NULL DEFAULT 1,
  allow_upgrade_while_expired INTEGER NOT NULL DEFAULT 1,
  auto_charge_enabled INTEGER NOT NULL DEFAULT 0 CHECK (auto_charge_enabled = 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vip_tier_configs (
  tier TEXT PRIMARY KEY CHECK (tier IN ('Free', 'Bronze', 'Silver', 'Gold', 'Platinum')),
  rank_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  badge_color TEXT NOT NULL,
  price_monthly REAL NOT NULL DEFAULT 0,
  multiplier REAL NOT NULL DEFAULT 1.0,
  daily_free_spins INTEGER NOT NULL DEFAULT 1,
  daily_free_scratches INTEGER NOT NULL DEFAULT 1,
  referral_bonus REAL NOT NULL DEFAULT 10.0,
  payout_speed TEXT NOT NULL,
  perks_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_vip_memberships (
  user_id TEXT PRIMARY KEY,
  current_tier TEXT NOT NULL DEFAULT 'Free' CHECK (current_tier IN ('Free', 'Bronze', 'Silver', 'Gold', 'Platinum')),
  highest_tier TEXT NOT NULL DEFAULT 'Free' CHECK (highest_tier IN ('Free', 'Bronze', 'Silver', 'Gold', 'Platinum')),
  status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'active', 'expired')),
  activated_at TEXT,
  expires_at TEXT,
  auto_renew INTEGER NOT NULL DEFAULT 0 CHECK (auto_renew = 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vip_membership_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('purchase', 'renewal', 'upgrade', 'promo', 'admin_grant')),
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  highest_tier_after TEXT NOT NULL,
  amount_paid REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Wallet Balance',
  payment_reference TEXT NOT NULL DEFAULT '',
  payment_verified INTEGER NOT NULL DEFAULT 1,
  validity_days INTEGER NOT NULL DEFAULT 30,
  activated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'superseded')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vip_history_user ON vip_membership_history(user_id, created_at DESC);
