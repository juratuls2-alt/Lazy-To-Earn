export const AD_DIRECT_LINK_1 = 'https://uplcm.com/4/11629954';
export const EARN_MORE_SHORT_LINK = 'https://uplcm.com/4/12238368';
export const GAME_AD_URL = 'https://uplcm.com/4/12238368';
export const BLOG_OFFICIAL_LINK = 'https://lasytoearn.blogspot.com';

export interface AdBannerConfig {
  key: string;
  width: number;
  height: number;
  format: string;
}

export const BANNER_CONFIGS: Record<string, AdBannerConfig> = {
  leaderboard_728x90: {
    key: '359b8d80dc880b6297776a7b2136506a',
    width: 728,
    height: 90,
    format: 'iframe',
  },
  rectangle_300x250: {
    key: '59b0756995040460f628c2026744b8f1',
    width: 300,
    height: 250,
    format: 'iframe',
  },
  mobile_320x50: {
    key: 'c498b45f90e1c93b217941c2cec44571',
    width: 320,
    height: 50,
    format: 'iframe',
  },
  banner_468x60: {
    key: '4194af672c196a5d548354d5e29bef19',
    width: 468,
    height: 60,
    format: 'iframe',
  },
  skyscraper_160x600: {
    key: '76f7f33011b86edcd2c3f2627b6865e1',
    width: 160,
    height: 600,
    format: 'iframe',
  },
  vertical_160x300: {
    key: 'cfe0bff54f95387e2f92327a566cfd66',
    width: 160,
    height: 300,
    format: 'iframe',
  },
};

/**
 * Triggers opening the ad monetization link in a new window/tab safely.
 * Users can also open on click to support ad earnings.
 */
export function openAdMonetizationLink(type: 'main' | 'earn_more' = 'earn_more') {
  const url = type === 'main' ? AD_DIRECT_LINK_1 : EARN_MORE_SHORT_LINK;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      win.focus();
    }
  } catch (err) {
    console.warn('Popup blocked, redirecting fallback', err);
  }
}

/**
 * Triggers opening the game advertisement link (https://uplcm.com/4/12238368) in a new tab.
 */
export function openGameAdLink() {
  try {
    const win = window.open(GAME_AD_URL, '_blank', 'noopener,noreferrer');
    if (win) {
      win.focus();
    }
  } catch (err) {
    console.warn('Popup blocked, fallback', err);
  }
}
