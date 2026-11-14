import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(ROOT_DIR, 'lazytoearn.db');
const MIGRATION_FILE = path.join(ROOT_DIR, 'db', 'migrations', '001_advanced_features.sql');
const MIGRATION_FILE_002 = path.join(ROOT_DIR, 'db', 'migrations', '002_vip_30day_membership.sql');

export const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  sqlite.exec(migrationSql);

  const applied = sqlite
    .prepare('SELECT version FROM schema_migrations WHERE version = ?')
    .get('001_advanced_features');

  if (!applied) {
    sqlite
      .prepare('INSERT INTO schema_migrations (version) VALUES (?)')
      .run('001_advanced_features');
  }

  const migrationSql002 = fs.readFileSync(MIGRATION_FILE_002, 'utf8');
  sqlite.exec(migrationSql002);
  const applied002 = sqlite
    .prepare('SELECT version FROM schema_migrations WHERE version = ?')
    .get('002_vip_30day_membership');
  if (!applied002) {
    sqlite
      .prepare('INSERT INTO schema_migrations (version) VALUES (?)')
      .run('002_vip_30day_membership');
  }

  seedInitialData();
}

function getCurrentMonthDates() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  return { year, month, daysInMonth, ym };
}

function seedInitialData(): void {
  // 1. Seed Monthly Reward Calendar for current month if empty
  const { ym, daysInMonth } = getCurrentMonthDates();
  const calCount = (sqlite.prepare('SELECT COUNT(*) as c FROM reward_calendar_events WHERE event_date LIKE ?').get(`${ym}-%`) as { c: number }).c;
  if (calCount === 0) {
    const insertCal = sqlite.prepare(`
      INSERT INTO reward_calendar_events (
        id, event_date, day_number, title, title_bn, description, description_bn,
        event_type, reward_type, reward_value, vip_only, required_tier, is_active, claim_deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const seedCalTx = sqlite.transaction(() => {
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = String(d).padStart(2, '0');
        const dateStr = `${ym}-${dayStr}`;
        let eventType = 'daily_login';
        let rewardType = 'points';
        let rewardValue = 50 + (d % 5) * 15;
        let vipOnly = 0;
        let requiredTier = 'Free';
        let title = `Day ${d} Daily Check-In`;
        let titleBn = `দিন ${d} দৈনিক চেক-ইন`;
        let desc = 'Daily login reward points for active members.';
        let descBn = 'সক্রিয় সদস্যদের জন্য দৈনিক লগইন রিওয়ার্ড পয়েন্ট।';

        if (d === 7 || d === 14 || d === 21) {
          eventType = 'weekly_milestone';
          rewardType = 'promo_credit';
          rewardValue = 1.5 + (d === 21 ? 1.0 : 0);
          title = `Week ${d / 7} Milestone Bonus`;
          titleBn = `সপ্তাহ ${d / 7} মাইলফলক বোনাস`;
          desc = `Weekly streak milestone promotional credit ($${rewardValue.toFixed(2)}).`;
          descBn = `সাপ্তাহিক মাইলফলক প্রোমোশনাল ক্রেডিট ($${rewardValue.toFixed(2)})।`;
        } else if (d === 15) {
          eventType = 'vip_exclusive';
          rewardType = 'promo_credit';
          rewardValue = 3.5;
          vipOnly = 1;
          requiredTier = 'Bronze';
          title = 'Mid-Month VIP Appreciation Drop';
          titleBn = 'মাসের মাঝামাঝি ভিআইপি বোনাস ড্রপ';
          desc = 'Exclusive mid-month VIP member reward boost.';
          descBn = 'ভিআইপি সদস্যদের জন্য বিশেষ মধ্য-মাসিক বোনাস।';
        } else if (d === 25) {
          eventType = 'special_event';
          rewardType = 'multiplier_boost';
          rewardValue = 2.0;
          title = 'Super Arcade Multiplier Day';
          titleBn = 'সুপার আর্কেড মাল্টিপ্লায়ার দিবস';
          desc = '2x Point Booster for arcade & mission activities.';
          descBn = 'গেম এবং মিশনে ২গুণ পয়েন্ট বুস্টার।';
        } else if (d === daysInMonth) {
          eventType = 'monthly_milestone';
          rewardType = 'promo_credit';
          rewardValue = 5.0;
          title = 'End-of-Month Grand Milestone';
          titleBn = 'মাস শেষ গ্র্যান্ড মাইলফলক';
          desc = 'Monthly completion bonus for dedicated earners.';
          descBn = 'মাসিক মাইলফলক পূরণে বিশেষ বোনাস।';
        }

        insertCal.run(
          `CAL-${ym}-${dayStr}`,
          dateStr,
          d,
          title,
          titleBn,
          desc,
          descBn,
          eventType,
          rewardType,
          rewardValue,
          vipOnly,
          requiredTier,
          `${dateStr} 23:59:59`
        );
      }
    });
    seedCalTx();
  }

  // 2. Seed Translation Strings (English + Bangla)
  const trCount = (sqlite.prepare('SELECT COUNT(*) as c FROM translation_strings').get() as { c: number }).c;
  if (trCount === 0) {
    const insertTr = sqlite.prepare(`
      INSERT OR IGNORE INTO translation_strings (key, language_code, language_name, category, text_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    const seedPairs: Array<[string, string, string, string]> = [
      ['nav.dashboard', 'navigation', 'Dashboard', 'ড্যাশবোর্ড'],
      ['nav.calendar', 'navigation', 'Reward Calendar', 'রিওয়ার্ড ক্যালেন্ডার'],
      ['nav.game_zone', 'navigation', 'Games (50+)', 'গেম জোন (৫০+)'],
      ['nav.watch_ads', 'navigation', 'Watch Ads', 'বিজ্ঞাপন দেখুন'],
      ['nav.missions', 'navigation', 'Missions', 'মিশন'],
      ['nav.tournaments', 'navigation', 'Tournaments', 'টুর্নামেন্ট'],
      ['nav.vip_club', 'navigation', 'VIP Clubhouse', 'ভিআইপি ক্লাবহাউস'],
      ['nav.activity_feed', 'navigation', 'Live Feed', 'লাইভ ফিড'],
      ['nav.gifts', 'navigation', 'Gift Center', 'গিফট সেন্টার'],
      ['nav.news', 'navigation', 'News Center', 'নিউজ সেন্টার'],
      ['nav.reports', 'navigation', 'Monthly Reports', 'মাসিক রিপোর্ট'],
      ['nav.security', 'navigation', 'Security Center', 'সিকিউরিটি সেন্টার'],
      ['nav.public_profile', 'navigation', 'Public Profile', 'পাবলিক প্রোফাইল'],
      ['nav.withdraw', 'navigation', 'Withdraw', 'টাকা তুলুন'],
      ['nav.refer', 'navigation', 'Referrals', 'রেফারেল'],
      ['nav.support', 'navigation', 'Support Desk', 'সাপোর্ট ডেস্ক'],
      ['common.play_now', 'actions', 'Play Now', 'এখনই খেলুন'],
      ['common.claim_reward', 'actions', 'Claim Reward', 'রিওয়ার্ড সংগ্রহ করুন'],
      ['common.save_changes', 'actions', 'Save Changes', 'পরিবর্তন সংরক্ষণ করুন'],
      ['common.download_pdf', 'actions', 'Download PDF', 'পিডিএফ ডাউনলোড'],
      ['common.export_csv', 'actions', 'Export CSV', 'সিএসভি এক্সপোর্ট'],
      ['common.install_app', 'actions', 'Install App', 'অ্যাপ ইনস্টল'],
      ['dashboard.welcome', 'dashboard', 'Welcome back', 'স্বাগতম'],
      ['dashboard.available_balance', 'dashboard', 'Available Balance', 'উপলব্ধ ব্যালেন্স'],
      ['dashboard.recommended_title', 'dashboard', 'Recommended For You', 'আপনার জন্য প্রস্তাবিত'],
    ];

    const tx = sqlite.transaction(() => {
      for (const [key, cat, enVal, bnVal] of seedPairs) {
        insertTr.run(key, 'en', 'English', cat, enVal);
        insertTr.run(key, 'bn', 'বাংলা', cat, bnVal);
      }
    });
    tx();
  }

  // 3. Seed Public Profiles & Privacy Settings
  const profCount = (sqlite.prepare('SELECT COUNT(*) as c FROM public_profiles').get() as { c: number }).c;
  if (profCount === 0) {
    const insertProf = sqlite.prepare(`
      INSERT INTO public_profiles (
        user_id, username, display_name, avatar_url, profile_frame, profile_theme,
        bio, user_level, vip_tier, registration_date, completed_missions_count,
        tournaments_played, tournaments_won, achievements_json, badges_json, unlocked_rewards_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPriv = sqlite.prepare(`
      INSERT INTO profile_privacy_settings (user_id, is_public, show_stats, show_achievements, show_activity, allow_gifts)
      VALUES (?, 1, 1, 1, 1, 1)
    `);

    const profiles = [
      [
        'LTE-782910',
        'tanvir_pro',
        'Tanvir Hossain',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        'silver-aurora',
        'amber-dark',
        'Arcade strategist & daily streak champion on Lazy To Earn.',
        14,
        'Silver',
        '2026-10-14',
        19,
        6,
        2,
        JSON.stringify(['First Mission Master', 'Arcade Challenger', '7-Day Streak Keeper']),
        JSON.stringify(['Silver VIP Badge', 'Early Adopter 2026', 'Top 10 Referrer']),
        JSON.stringify(['Neon Arcade Frame', 'Silver Star Emblem']),
      ],
      [
        'LTE-552819',
        'ayesha_gold',
        'Ayesha Karim',
        'https://api.dicebear.com/7.x/initials/svg?seed=Ayesha+Karim',
        'gold-crown',
        'emerald-royal',
        'Gold VIP Club member | Puzzle & Tournament champion.',
        22,
        'Gold',
        '2026-10-20',
        34,
        11,
        5,
        JSON.stringify(['Tournament Titan', 'Community Ambassador', 'Mission Ace']),
        JSON.stringify(['Gold VIP Badge', 'Top Referrer #1', 'Speed Tap Champion']),
        JSON.stringify(['Golden Laurel Frame', 'VIP Lounge Key']),
      ],
      [
        'LTE-419082',
        'nafisa_s',
        'Nafisa Sultana',
        'https://api.dicebear.com/7.x/initials/svg?seed=Nafisa+Sultana',
        'bronze-spark',
        'slate-classic',
        'Brain games & Daily Calendar collector.',
        9,
        'Bronze',
        '2026-11-01',
        11,
        3,
        1,
        JSON.stringify(['Brain Teaser', 'Calendar Collector']),
        JSON.stringify(['Bronze VIP Badge', 'Verified Member']),
        JSON.stringify(['Bronze Frame']),
      ],
      [
        'LTE-309142',
        'rafiq_arcade',
        'Rafiqul Islam',
        'https://api.dicebear.com/7.x/initials/svg?seed=Rafiqul+Islam',
        'default',
        'amber-dark',
        'Racing & Card Games enthusiast.',
        11,
        'Silver',
        '2026-10-25',
        14,
        4,
        1,
        JSON.stringify(['Highway Racer', 'Card Shark']),
        JSON.stringify(['Silver VIP Badge']),
        JSON.stringify(['Turbo Badge']),
      ],
    ];

    const tx = sqlite.transaction(() => {
      for (const p of profiles) {
        insertProf.run(...p);
        insertPriv.run(p[0]);
      }
    });
    tx();
  }

  // 4. Seed Security Settings, Login History, Trusted Devices, Fraud Alerts
  const secCount = (sqlite.prepare('SELECT COUNT(*) as c FROM user_security_settings').get() as { c: number }).c;
  if (secCount === 0) {
    sqlite
      .prepare(`
        INSERT INTO user_security_settings (user_id, two_factor_enabled, two_factor_method, two_factor_secret, email_verified, login_alerts_enabled, withdrawal_extra_verification)
        VALUES ('LTE-782910', 1, 'authenticator', 'LTE2FA-TANVIR-7829', 1, 1, 1)
      `)
      .run();

    sqlite
      .prepare(`
        INSERT INTO login_history (id, user_id, ip_address, device_name, browser, location, status, is_current_session, created_at)
        VALUES
          ('LOG-901', 'LTE-782910', '103.112.54.18', 'Desktop Workstation', 'Chrome 130 (Linux)', 'Dhaka, Bangladesh', 'Success', 1, datetime('now', '-10 minutes')),
          ('LOG-902', 'LTE-782910', '103.112.54.19', 'Samsung Galaxy S24', 'Chrome Mobile (Android)', 'Dhaka, Bangladesh', 'Success', 0, datetime('now', '-1 day')),
          ('LOG-903', 'LTE-782910', '185.220.101.4', 'Unknown Proxy Node', 'Headless Client', 'Frankfurt, DE', 'Blocked', 0, datetime('now', '-3 days'))
      `)
      .run();

    sqlite
      .prepare(`
        INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_label, browser)
        VALUES
          ('DEV-101', 'LTE-782910', 'fp-chrome-linux-7829', 'Primary Chrome Desktop', 'Chrome 130'),
          ('DEV-102', 'LTE-782910', 'fp-android-s24-7829', 'Tanvir Galaxy S24 PWA', 'Android WebAPK')
      `)
      .run();

    sqlite
      .prepare(`
        INSERT INTO security_incidents (id, user_id, incident_type, severity, description, resolved)
        VALUES
          ('INC-301', 'LTE-782910', 'Blocked Unrecognized IP Login', 'medium', 'Blocked automated sign-in attempt from unrecognized proxy IP (185.220.101.4).', 1)
      `)
      .run();

    sqlite
      .prepare(`
        INSERT INTO fraud_alerts (id, user_id, user_name, alert_type, risk_score, evidence, status)
        VALUES
          ('FRD-501', 'LTE-639104', 'Kazi Mahin', 'abnormal_claim_frequency', 68, 'Submitted 14 rapid ad-reward claims within 120 seconds; auto-throttled pending review.', 'Open'),
          ('FRD-502', 'LTE-309142', 'Rafiqul Islam', 'suspicious_referral', 42, '2 signups shared identical subnet prefix; flagged for referral audit.', 'Investigating')
      `)
      .run();
  }

  // 5. Seed AI Assistant Settings
  const aiCount = (sqlite.prepare('SELECT COUNT(*) as c FROM ai_assistant_settings').get() as { c: number }).c;
  if (aiCount === 0) {
    sqlite
      .prepare(`
        INSERT INTO ai_assistant_settings (id, is_enabled, daily_message_limit, system_instructions, faq_knowledge)
        VALUES (
          1,
          1,
          30,
          'You are the official Lazy To Earn Platform Assistant. Help users understand how to earn points & rewards, daily missions, Monthly Reward Calendar, tournaments, VIP tiers, withdrawal schedules (Standard: 28th of each month; VIP: 15th & 28th), security settings, and gift collectibles. Support English and Bangla fluently. STRICT RULES: Never promise guaranteed profits; never claim you can modify balances, approve withdrawals, change permissions, override admins, or view other users'' private information.',
          'Q: When can Standard vs VIP members withdraw?\nA: Standard members withdraw on the 28th of each month (minimum $100). VIP members (Bronze, Silver, Gold, Platinum) get two monthly windows: 15th and 28th.\nQ: Can digital gifts be converted to cash?\nA: No. Gift Center items are strictly non-cash digital collectibles (frames, avatars, badges, themes).\nQ: How does the Monthly Reward Calendar work?\nA: Log in daily to claim calendar points, weekly promo credits, and monthly milestone rewards.'
        )
      `)
      .run();
  }

  // 6. Seed Live Activity Feed (Consent-filtered public achievements only)
  const actCount = (sqlite.prepare('SELECT COUNT(*) as c FROM public_activity_events').get() as { c: number }).c;
  if (actCount === 0) {
    sqlite
      .prepare(`
        INSERT INTO public_activity_events (
          id, user_id, username, display_name, avatar_url, vip_tier, category,
          title, title_bn, description, description_bn, created_at
        ) VALUES
          ('ACT-101', 'LTE-552819', 'ayesha_gold', 'Ayesha Karim', 'https://api.dicebear.com/7.x/initials/svg?seed=Ayesha+Karim', 'Gold', 'tournament',
           'Won 1st Place in Weekly Speed Tap Tournament!', 'সাপ্তাহিক স্পিড ট্যাপ টুর্নামেন্টে ১ম স্থান অর্জন করেছেন!',
           'Earned the Tournament Champion badge with 2,480 points.', '২,৪৮০ পয়েন্ট নিয়ে টুর্নামেন্ট চ্যাম্পিয়ন ব্যাজ অর্জন করেছেন।', datetime('now', '-25 minutes')),
          ('ACT-102', 'LTE-782910', 'tanvir_pro', 'Tanvir Hossain', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 'Silver', 'badge',
           'Unlocked 7-Day Streak Keeper Badge', '৭-দিনের স্ট্রিক কিপার ব্যাজ আনলক করেছেন',
           'Completed 7 consecutive days on the Monthly Reward Calendar.', 'মাসিক রিওয়ার্ড ক্যালেন্ডারে টানা ৭ দিন সম্পন্ন করেছেন।', datetime('now', '-2 hours')),
          ('ACT-103', 'LTE-419082', 'nafisa_s', 'Nafisa Sultana', 'https://api.dicebear.com/7.x/initials/svg?seed=Nafisa+Sultana', 'Bronze', 'vip_upgrade',
           'Joined the Bronze VIP Clubhouse', 'ব্রোঞ্জ ভিআইপি ক্লাবহাউসে যোগ দিয়েছেন',
           'Unlocked dual monthly withdrawal dates (15th & 28th) and VIP calendar events.', 'মাসে ২ বার উত্তোলনের সুযোগ (১৫ ও ২৮ তারিখ) আনলক করেছেন।', datetime('now', '-5 hours')),
          ('ACT-104', 'LTE-000001', 'lazytoearn_hq', 'Lazy To Earn Official', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', 'Platinum', 'announcement',
           'New Bangla Language & PWA App Support Live!', 'বাংলা ভাষা ও মোবাইল অ্যাপ (PWA) এখন লাইভ!',
           'Switch between English & Bangla anytime and install Lazy To Earn on your home screen.', 'যেকোনো সময় ইংরেজি ও বাংলা ভাষায় ব্যবহার করুন এবং মোবাইল অ্যাপ ইনস্টল করুন।', datetime('now', '-8 hours'))
      `)
      .run();
  }

  // 7. Seed VIP Events
  const vipCount = (sqlite.prepare('SELECT COUNT(*) as c FROM vip_events').get() as { c: number }).c;
  if (vipCount === 0) {
    const nowIso = new Date().toISOString().split('T')[0];
    const endIso = `${ym}-${String(daysInMonth).padStart(2, '0')}`;
    sqlite
      .prepare(`
        INSERT INTO vip_events (id, title, title_bn, description, description_bn, min_tier, event_type, reward_summary, starts_at, ends_at, participants_count)
        VALUES
          ('VIP-EV-1', 'Bronze & Above: Double Mission Points Weekend', 'ব্রোঞ্জ ও তদূর্ধ্ব: ডাবল মিশন পয়েন্টস', 'All VIP members earn 2x bonus points on completed daily missions.', 'সকল ভিআইপি সদস্য দৈনিক মিশনে ২গুণ পয়েন্ট পাবেন।', 'Bronze', 'mission', '2x Points Booster', ?, ?, 42),
          ('VIP-EV-2', 'Silver+ Speed Arcade Championship', 'সিলভার+ স্পিড আর্কেড চ্যাম্পিয়নশিপ', 'Exclusive VIP bracket tournament with non-cash badge & bonus prize pool.', 'ভিআইপি সদস্যদের জন্য বিশেষ আর্কেড টুর্নামেন্ট।', 'Silver', 'tournament', '5,000 Pts + Gold Trophy Badge', ?, ?, 28),
          ('VIP-EV-3', 'Gold & Platinum Priority Support & Mid-Month Promo Drop', 'গোল্ড ও প্লাটিনাম প্রোমো ড্রপ', 'Direct access to VIP concierge desk and 15th-of-month promotional bonus drops.', 'দ্রুত ভিআইপি সাপোর্ট ও ১৫ তারিখের প্রোমো বোনাস।', 'Gold', 'promo_drop', '$3.50 Promo Credit + Priority Queue', ?, ?, 15)
      `)
      .run(nowIso, endIso, nowIso, endIso, nowIso, endIso);
  }

  // 8. Seed Recommendation Settings
  const recCfgCount = (sqlite.prepare('SELECT COUNT(*) as c FROM recommendation_settings').get() as { c: number }).c;
  if (recCfgCount === 0) {
    sqlite.prepare('INSERT INTO recommendation_settings (id) VALUES (1)').run();
  }

  // 9. Seed Gift Inventory (Strictly Non-Cash Digital Collectibles)
  const giftCount = (sqlite.prepare('SELECT COUNT(*) as c FROM gift_inventory').get() as { c: number }).c;
  if (giftCount === 0) {
    sqlite
      .prepare(`
        INSERT INTO gift_inventory (id, name, name_bn, category, description, description_bn, image_url, points_cost, vip_only, is_seasonal)
        VALUES
          ('GFT-01', 'Golden Crown Frame', 'গোল্ডেন ক্রাউন ফ্রেম', 'profile_frame', 'Radiant gold avatar frame collectible for public profiles.', 'পাবলিক প্রোফাইলের জন্য আকর্ষণীয় গোল্ডেন ফ্রেম।', 'https://api.dicebear.com/7.x/shapes/svg?seed=GoldFrame&backgroundColor=f59e0b', 150, 0, 0),
          ('GFT-02', 'Emerald Star Badge', 'এমারেল্ড স্টার ব্যাজ', 'badge', 'Digital recognition badge showing community appreciation.', 'কমিউনিটি প্রশংসা প্রকাশের ডিজিটাল স্টার ব্যাজ।', 'https://api.dicebear.com/7.x/shapes/svg?seed=EmeraldStar&backgroundColor=10b981', 100, 0, 0),
          ('GFT-03', 'Cyber Arcade Avatar Pack', 'সাইবার আর্কেড অ্যাভাটার প্যাক', 'avatar_pack', 'Futuristic arcade avatar style for top gamers.', 'গেমারদের জন্য আধুনিক সাইবার আর্কেড অ্যাভাটার।', 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberArcade', 200, 0, 0),
          ('GFT-04', 'Aurora Borealis Theme', 'অরোরা বোরিয়ালিস থিম', 'profile_theme', 'Animated northern lights banner theme for your showcase.', 'আপনার প্রোফাইল শোকসেের জন্য বিশেষ অরোরা থিম।', 'https://api.dicebear.com/7.x/shapes/svg?seed=AuroraTheme&backgroundColor=6366f1', 250, 0, 1),
          ('GFT-05', 'VIP Platinum Crest', 'ভিআইপি প্লাটিনাম ক্রেস্ট', 'vip_gift', 'Exclusive collectible crest sendable by VIP members.', 'শুধুমাত্র ভিআইপি সদস্যদের জন্য এক্সক্লুসিভ ক্রেস্ট।', 'https://api.dicebear.com/7.x/shapes/svg?seed=PlatinumCrest&backgroundColor=a855f7', 350, 1, 0)
      `)
      .run();

    sqlite
      .prepare(`
        INSERT INTO gift_transfers (id, gift_id, sender_user_id, sender_name, recipient_user_id, recipient_name, note)
        VALUES ('GTX-1001', 'GFT-02', 'LTE-552819', 'Ayesha Karim', 'LTE-782910', 'Tanvir Hossain', 'Great tournament match!')
      `)
      .run();
  }

  // 10. Seed News Categories & Bilingual Articles
  const newsCatCount = (sqlite.prepare('SELECT COUNT(*) as c FROM news_categories').get() as { c: number }).c;
  if (newsCatCount === 0) {
    const cats = [
      ['cat-platform', 'platform_announcements', 'Platform Announcements', 'প্ল্যাটফর্ম ঘোষণা', 'amber'],
      ['cat-features', 'new_features', 'New Features', 'নতুন ফিচার', 'emerald'],
      ['cat-gaming', 'gaming_updates', 'Gaming Updates', 'গেমিং আপডেট', 'sky'],
      ['cat-tournaments', 'tournament_news', 'Tournament News', 'টুর্নামেন্ট সংবাদ', 'purple'],
      ['cat-vip', 'vip_updates', 'VIP Updates', 'ভিআইপি আপডেট', 'amber'],
      ['cat-promos', 'promotions_events', 'Promotions & Events', 'প্রোমোশন ও ইভেন্ট', 'rose'],
      ['cat-maint', 'maintenance_notices', 'Maintenance Notices', 'রক্ষণাবেক্ষণ বিজ্ঞপ্তি', 'slate'],
      ['cat-sec', 'security_notices', 'Security Notices', 'নিরাপত্তা বিজ্ঞপ্তি', 'red'],
    ];
    const insertCat = sqlite.prepare('INSERT INTO news_categories (id, slug, name_en, name_bn, color) VALUES (?, ?, ?, ?, ?)');
    for (const c of cats) insertCat.run(...c);

    const insertArt = sqlite.prepare(`
      INSERT INTO news_articles (
        id, category_id, title_en, title_bn, summary_en, summary_bn,
        content_en, content_bn, target_tier, is_featured, is_pinned, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `);

    insertArt.run(
      'NEWS-01',
      'cat-platform',
      'Lazy To Earn 2.5 Upgrade: Reward Calendar, Bangla Support & PWA App',
      'লেজি টু আর্ন ২.৫ আপগ্রেড: রিওয়ার্ড ক্যালেন্ডার, বাংলা ভাষা ও মোবাইল অ্যাপ',
      'Explore the new Monthly Reward Calendar, full English/Bangla support, Security Trust Center, and installable mobile PWA.',
      'নতুন মাসিক রিওয়ার্ড ক্যালেন্ডার, সম্পূর্ণ বাংলা ও ইংরেজি ভাষা, সিকিউরিটি সেন্টার এবং মোবাইল অ্যাপ উপভোগ করুন।',
      'We have rolled out our biggest platform upgrade! Members can now claim daily and milestone rewards via the Monthly Reward Calendar, switch seamlessly between English and Bangla (বাংলা), customize public achievement profiles, chat with our AI Assistant, and install Lazy To Earn directly on mobile home screens via PWA.',
      'আমরা আমাদের সবচেয়ে বড় প্ল্যাটফর্ম আপগ্রেড চালু করেছি! সদস্যরা এখন মাসিক রিওয়ার্ড ক্যালেন্ডার থেকে দৈনিক এবং মাইলফলক বোনাস সংগ্রহ করতে পারবেন, বাংলা ও ইংরেজি ভাষায় ব্যবহার করতে পারবেন, পাবলিক প্রোফাইল সাজাতে পারবেন এবং মোবাইল হোম স্ক্রিনে PWA অ্যাপ ইনস্টল করতে পারবেন।',
      'All',
      1,
      1
    );

    insertArt.run(
      'NEWS-02',
      'cat-sec',
      'Mandatory Security Notice: Enable 2FA & Trusted Device Alerts',
      'গুরুত্বপূর্ণ নিরাপত্তা বিজ্ঞপ্তি: ২-স্তরের নিরাপত্তা (2FA) চালু করুন',
      'Protect your rewards account with two-factor authentication and review active login sessions in the Security Trust Center.',
      'আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে 2FA চালু করুন এবং সিকিউরিটি সেন্টারে সক্রিয় সেশন যাচাই করুন।',
      'Never share your password or OTP with anyone. Lazy To Earn administrators will never ask for your password. Visit the Security & Trust Center to verify your trusted devices, inspect login history, and toggle 2FA protection.',
      'কখনও আপনার পাসওয়ার্ড বা ওটিপি কারো সাথে শেয়ার করবেন না। অ্যাডমিনরা কখনও আপনার পাসওয়ার্ড চাইবে না। সিকিউরিটি সেন্টারে গিয়ে বিশ্বস্ত ডিভাইস এবং লগইন ইতিহাস যাচাই করুন।',
      'All',
      0,
      1
    );

    insertArt.run(
      'NEWS-03',
      'cat-vip',
      'VIP Dual Monthly Withdrawal Dates: 15th & 28th Reminder',
      'ভিআইপি সদস্যদের জন্য মাসে ২ বার উত্তোলনের তারিখ: ১৫ ও ২৮ তারিখ',
      'Bronze, Silver, Gold, and Platinum VIP members enjoy two scheduled withdrawal windows every month plus VIP Clubhouse perks.',
      'ব্রোঞ্জ, সিলভার, গোল্ড এবং প্লাটিনাম ভিআইপি সদস্যরা প্রতি মাসে ১৫ ও ২৮ তারিখে উত্তোলনের সুযোগ পান।',
      'Standard members may submit one withdrawal request on the 28th of each month once reaching the $100 threshold. VIP Clubhouse members unlock an extra mid-month withdrawal window on the 15th alongside priority support and exclusive calendar bonus drops.',
      'সাধারণ সদস্যরা প্রতি মাসের ২৮ তারিখে উত্তোলনের আবেদন করতে পারেন। ভিআইপি সদস্যরা প্রতি মাসের ১৫ এবং ২৮ তারিখে দুটি উইন্ডোতে উত্তোলনের সুবিধা ও ভিআইপি ক্লাবহাউস বোনাস উপভোগ করেন।',
      'All',
      1,
      0
    );
  }

  // 11. Seed PWA Settings
  const pwaCount = (sqlite.prepare('SELECT COUNT(*) as c FROM pwa_settings').get() as { c: number }).c;
  if (pwaCount === 0) {
    sqlite.prepare('INSERT INTO pwa_settings (id) VALUES (1)').run();
  }

  // 12. Seed VIP 30-Day System Settings & Tier Configs (No Minimum Withdrawal field)
  const vipSysCount = (sqlite.prepare('SELECT COUNT(*) as c FROM vip_system_settings').get() as { c: number }).c;
  if (vipSysCount === 0) {
    sqlite
      .prepare(
        `INSERT INTO vip_system_settings (id, validity_days, allow_upgrades, allow_renewal, allow_upgrade_while_expired, auto_charge_enabled)
         VALUES (1, 30, 1, 1, 1, 0)`
      )
      .run();
  }

  const vipTierCount = (sqlite.prepare('SELECT COUNT(*) as c FROM vip_tier_configs').get() as { c: number }).c;
  if (vipTierCount === 0) {
    const insertTier = sqlite.prepare(`
      INSERT INTO vip_tier_configs (
        tier, rank_order, name, badge_color, price_monthly, multiplier,
        daily_free_spins, daily_free_scratches, referral_bonus, payout_speed, perks_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTier.run(
      'Free', 0, 'Starter Member', 'bg-slate-700 text-slate-300 border-slate-600', 0, 1.0, 1, 1, 10.0, '24-48 Hours',
      JSON.stringify(['Standard Ad Earnings', '1 Daily Free Spin', '1 Daily Free Scratch', 'Standard Support'])
    );
    insertTier.run(
      'Bronze', 1, 'Bronze VIP', 'bg-amber-900/60 text-amber-300 border-amber-700/60', 9.99, 1.25, 2, 2, 12.0, '12-24 Hours',
      JSON.stringify(['+25% Multiplier on All Tasks', '2 Daily Free Spins', '2 Daily Free Scratches', 'Priority Email Support'])
    );
    insertTier.run(
      'Silver', 2, 'Silver VIP', 'bg-slate-500/30 text-slate-200 border-slate-400/50', 19.99, 1.5, 4, 3, 15.0, '6-12 Hours',
      JSON.stringify(['+50% Multiplier on All Tasks', '4 Daily Free Spins', '3 Daily Free Scratches', 'Exclusive Tournaments'])
    );
    insertTier.run(
      'Gold', 3, 'Gold VIP', 'bg-amber-500/20 text-amber-400 border-amber-500/50', 39.99, 2.0, 7, 5, 20.0, '2-4 Hours',
      JSON.stringify(['2X Earnings on Everything', '7 Daily Free Spins', '5 Daily Free Scratches', 'VIP Priority Payout Channel'])
    );
    insertTier.run(
      'Platinum', 4, 'Platinum Elite VIP', 'bg-purple-500/20 text-purple-300 border-purple-500/50', 79.99, 2.5, 12, 8, 25.0, 'Instant (Under 1 Hour)',
      JSON.stringify(['2.5X Earnings Multiplier', '12 Daily Free Spins', '8 Daily Free Scratches', 'Instant Cashout Processing', 'Dedicated Support Manager'])
    );
  }

  // Seed initial VIP memberships & permanent history for existing demo members
  const vipMemCount = (sqlite.prepare('SELECT COUNT(*) as c FROM user_vip_memberships').get() as { c: number }).c;
  if (vipMemCount === 0) {
    const now = new Date();
    const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

    const seedVip = sqlite.prepare(`
      INSERT INTO user_vip_memberships (user_id, current_tier, highest_tier, status, activated_at, expires_at, auto_renew)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    const seedHist = sqlite.prepare(`
      INSERT INTO vip_membership_history (
        id, user_id, action_type, from_tier, to_tier, highest_tier_after,
        amount_paid, payment_method, payment_reference, payment_verified,
        validity_days, activated_at, expires_at, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 30, ?, ?, ?, ?)
    `);

    const tanvirStart = daysAgo(5);
    const tanvirExp = daysFromNow(25);
    seedVip.run('LTE-782910', 'Silver', 'Silver', 'active', tanvirStart, tanvirExp);
    seedHist.run('VIPH-1001', 'LTE-782910', 'purchase', 'Free', 'Bronze', 'Bronze', 9.99, 'Wallet Balance', 'PAY-VER-782901', daysAgo(35), tanvirStart, 'superseded', daysAgo(35));
    seedHist.run('VIPH-1002', 'LTE-782910', 'upgrade', 'Bronze', 'Silver', 'Silver', 19.99, 'Wallet Balance', 'PAY-VER-782902', tanvirStart, tanvirExp, 'active', tanvirStart);

    const ayeshaStart = daysAgo(12);
    const ayeshaExp = daysFromNow(18);
    seedVip.run('LTE-552819', 'Gold', 'Gold', 'active', ayeshaStart, ayeshaExp);
    seedHist.run('VIPH-1003', 'LTE-552819', 'purchase', 'Free', 'Gold', 'Gold', 39.99, 'bKash Verified', 'BK-VER-552819', ayeshaStart, ayeshaExp, 'active', ayeshaStart);

    const nafisaStart = daysAgo(8);
    const nafisaExp = daysFromNow(22);
    seedVip.run('LTE-419082', 'Bronze', 'Bronze', 'active', nafisaStart, nafisaExp);
    seedHist.run('VIPH-1004', 'LTE-419082', 'purchase', 'Free', 'Bronze', 'Bronze', 9.99, 'Wallet Balance', 'PAY-VER-419082', nafisaStart, nafisaExp, 'active', nafisaStart);

    const rafiqStart = daysAgo(2);
    const rafiqExp = daysFromNow(28);
    seedVip.run('LTE-309142', 'Silver', 'Silver', 'active', rafiqStart, rafiqExp);
    seedHist.run('VIPH-1005', 'LTE-309142', 'purchase', 'Free', 'Silver', 'Silver', 19.99, 'Nagad Verified', 'NG-VER-309142', rafiqStart, rafiqExp, 'active', rafiqStart);
  }
}
