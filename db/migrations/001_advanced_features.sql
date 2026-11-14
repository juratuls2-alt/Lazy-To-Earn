-- Lazy To Earn - Advanced Features Database Migration 001
-- Preserves existing platform user accounts, wallets, and transaction records.
-- Adds normalized tables, foreign keys, constraints, and indexes for all 16 modules.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1. MONTHLY REWARD CALENDAR
CREATE TABLE IF NOT EXISTS reward_calendar_events (
  id TEXT PRIMARY KEY,
  event_date TEXT NOT NULL, -- YYYY-MM-DD
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 31),
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  description_bn TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL CHECK (event_type IN ('daily_login', 'special_event', 'weekly_milestone', 'monthly_milestone', 'vip_exclusive')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'promo_credit', 'cash', 'multiplier_boost', 'badge')),
  reward_value REAL NOT NULL DEFAULT 0,
  vip_only INTEGER NOT NULL DEFAULT 0,
  required_tier TEXT NOT NULL DEFAULT 'Free',
  is_active INTEGER NOT NULL DEFAULT 1,
  claim_deadline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON reward_calendar_events(event_date, is_active);

CREATE TABLE IF NOT EXISTS reward_calendar_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  claim_month TEXT NOT NULL, -- YYYY-MM
  reward_type TEXT NOT NULL,
  reward_value REAL NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, event_id),
  FOREIGN KEY (event_id) REFERENCES reward_calendar_events(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_calendar_claims_user ON reward_calendar_claims(user_id, claim_month);

-- 2. MULTI-LANGUAGE & TRANSLATION MANAGEMENT
CREATE TABLE IF NOT EXISTS language_preferences (
  user_id TEXT PRIMARY KEY,
  language_code TEXT NOT NULL DEFAULT 'en',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS translation_strings (
  key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  language_name TEXT NOT NULL DEFAULT 'English',
  category TEXT NOT NULL DEFAULT 'general',
  text_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (key, language_code)
);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON translation_strings(language_code, category);

-- 3. ACHIEVEMENT SHOWCASE & PUBLIC PROFILES
CREATE TABLE IF NOT EXISTS public_profiles (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  profile_frame TEXT NOT NULL DEFAULT 'default',
  profile_theme TEXT NOT NULL DEFAULT 'amber-dark',
  bio TEXT NOT NULL DEFAULT '',
  user_level INTEGER NOT NULL DEFAULT 1,
  vip_tier TEXT NOT NULL DEFAULT 'Free',
  registration_date TEXT NOT NULL,
  completed_missions_count INTEGER NOT NULL DEFAULT 0,
  tournaments_played INTEGER NOT NULL DEFAULT 0,
  tournaments_won INTEGER NOT NULL DEFAULT 0,
  achievements_json TEXT NOT NULL DEFAULT '[]',
  badges_json TEXT NOT NULL DEFAULT '[]',
  unlocked_rewards_json TEXT NOT NULL DEFAULT '[]',
  is_moderated_hidden INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_public_profiles_username ON public_profiles(username);

CREATE TABLE IF NOT EXISTS profile_privacy_settings (
  user_id TEXT PRIMARY KEY,
  is_public INTEGER NOT NULL DEFAULT 1,
  show_stats INTEGER NOT NULL DEFAULT 1,
  show_achievements INTEGER NOT NULL DEFAULT 1,
  show_activity INTEGER NOT NULL DEFAULT 1,
  allow_gifts INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES public_profiles(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_reports (
  id TEXT PRIMARY KEY,
  target_user_id TEXT NOT NULL,
  reporter_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Reviewed', 'Actioned', 'Dismissed')),
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profile_reports_status ON profile_reports(status);

-- 4. ADVANCED SECURITY, TRUST CENTER & FRAUD PROTECTION
CREATE TABLE IF NOT EXISTS user_security_settings (
  user_id TEXT PRIMARY KEY,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  two_factor_method TEXT NOT NULL DEFAULT 'authenticator',
  two_factor_secret TEXT NOT NULL DEFAULT '',
  email_verified INTEGER NOT NULL DEFAULT 1,
  login_alerts_enabled INTEGER NOT NULL DEFAULT 1,
  withdrawal_extra_verification INTEGER NOT NULL DEFAULT 1,
  last_password_change TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  device_name TEXT NOT NULL,
  browser TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Success', 'Blocked', 'Suspicious', '2FA_Pending')),
  is_current_session INTEGER NOT NULL DEFAULT 0,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, created_at);

CREATE TABLE IF NOT EXISTS trusted_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_label TEXT NOT NULL,
  browser TEXT NOT NULL,
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  trusted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);

CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolution_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user ON security_incidents(user_id, resolved);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  alert_type TEXT NOT NULL CHECK (alert_type IN ('duplicate_account', 'suspicious_referral', 'abnormal_claim_frequency', 'bot_activity', 'duplicate_transaction', 'tournament_manipulation', 'flagged_withdrawal')),
  risk_score INTEGER NOT NULL DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  evidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Confirmed_Fraud', 'Cleared')),
  investigated_by TEXT NOT NULL DEFAULT '',
  investigation_log TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status, risk_score);

-- 5. AI PERSONAL ASSISTANT
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  language TEXT NOT NULL DEFAULT 'en',
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id, created_at);

CREATE TABLE IF NOT EXISTS ai_assistant_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_enabled INTEGER NOT NULL DEFAULT 1,
  daily_message_limit INTEGER NOT NULL DEFAULT 30,
  system_instructions TEXT NOT NULL,
  faq_knowledge TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. LIVE ACTIVITY FEED
CREATE TABLE IF NOT EXISTS public_activity_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  vip_tier TEXT NOT NULL DEFAULT 'Free',
  category TEXT NOT NULL CHECK (category IN ('achievement', 'tournament', 'badge', 'vip_upgrade', 'challenge', 'announcement', 'leaderboard')),
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  description_bn TEXT NOT NULL DEFAULT '',
  is_hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_category_time ON public_activity_events(category, created_at);

CREATE TABLE IF NOT EXISTS profile_follows (
  follower_user_id TEXT NOT NULL,
  followed_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_user_id, followed_user_id)
);

-- 7. VIP CLUBHOUSE
CREATE TABLE IF NOT EXISTS vip_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  description_bn TEXT NOT NULL DEFAULT '',
  min_tier TEXT NOT NULL CHECK (min_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  event_type TEXT NOT NULL CHECK (event_type IN ('mission', 'tournament', 'calendar_bonus', 'promo_drop', 'announcement')),
  reward_summary TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vip_event_joins (
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, event_id),
  FOREIGN KEY (event_id) REFERENCES vip_events(id) ON DELETE CASCADE
);

-- 8. SMART REWARD RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendation_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enable_missions INTEGER NOT NULL DEFAULT 1,
  enable_calendar INTEGER NOT NULL DEFAULT 1,
  enable_tournaments INTEGER NOT NULL DEFAULT 1,
  enable_achievements INTEGER NOT NULL DEFAULT 1,
  enable_vip_perks INTEGER NOT NULL DEFAULT 1,
  enable_news_promos INTEGER NOT NULL DEFAULT 1,
  weight_missions INTEGER NOT NULL DEFAULT 90,
  weight_calendar INTEGER NOT NULL DEFAULT 95,
  weight_tournaments INTEGER NOT NULL DEFAULT 80,
  weight_achievements INTEGER NOT NULL DEFAULT 75,
  weight_vip INTEGER NOT NULL DEFAULT 85,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendation_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  rec_type TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  reward_preview TEXT NOT NULL,
  action_view TEXT NOT NULL,
  priority_score INTEGER NOT NULL DEFAULT 50,
  dismissed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendation_records(user_id, dismissed);

-- 9. AUTOMATED MONTHLY REPORTS
CREATE TABLE IF NOT EXISTS monthly_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_month TEXT NOT NULL, -- YYYY-MM or custom range label
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  withdrawable_earnings REAL NOT NULL DEFAULT 0,
  promotional_credits REAL NOT NULL DEFAULT 0,
  pending_balance REAL NOT NULL DEFAULT 0,
  non_cash_points INTEGER NOT NULL DEFAULT 0,
  withdrawals_completed REAL NOT NULL DEFAULT 0,
  withdrawals_pending REAL NOT NULL DEFAULT 0,
  withdrawals_rejected REAL NOT NULL DEFAULT 0,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  tournaments_joined INTEGER NOT NULL DEFAULT 0,
  referrals_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  email_opt_in INTEGER NOT NULL DEFAULT 1,
  generated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user ON monthly_reports(user_id, report_month);

-- 10. GIFT CENTER (NON-CASH COLLECTIBLES ONLY)
CREATE TABLE IF NOT EXISTS gift_inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('profile_frame', 'avatar_pack', 'badge', 'profile_theme', 'seasonal_collectible', 'vip_gift')),
  description TEXT NOT NULL,
  description_bn TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  points_cost INTEGER NOT NULL DEFAULT 100 CHECK (points_cost >= 0),
  vip_only INTEGER NOT NULL DEFAULT 0,
  is_seasonal INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  daily_send_limit INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gift_transfers (
  id TEXT PRIMARY KEY,
  gift_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  is_non_cash_collectible INTEGER NOT NULL DEFAULT 1 CHECK (is_non_cash_collectible = 1),
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (gift_id) REFERENCES gift_inventory(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_gift_transfers_users ON gift_transfers(recipient_user_id, sender_user_id);

-- 11. PLATFORM NEWS CENTER
CREATE TABLE IF NOT EXISTS news_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'amber'
);

CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  summary_bn TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_bn TEXT NOT NULL,
  target_tier TEXT NOT NULL DEFAULT 'All',
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  author TEXT NOT NULL DEFAULT 'Lazy To Earn Editorial',
  FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status, is_pinned, published_at);

-- 12. PWA SETTINGS & PUSH NOTIFICATIONS
CREATE TABLE IF NOT EXISTS pwa_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  install_prompt_enabled INTEGER NOT NULL DEFAULT 1,
  offline_banner_enabled INTEGER NOT NULL DEFAULT 1,
  push_notifications_enabled INTEGER NOT NULL DEFAULT 1,
  app_version TEXT NOT NULL DEFAULT '2.5.0',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL DEFAULT '',
  auth TEXT NOT NULL DEFAULT '',
  device_label TEXT NOT NULL DEFAULT 'Web Browser',
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pwa_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_tier TEXT NOT NULL DEFAULT 'All',
  sent_count INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);
