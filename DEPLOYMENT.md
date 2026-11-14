# Lazy To Earn — Deployment & Operations Guide

Official Web Platform: `https://lasytoearn.blogspot.com`

---

## 1. Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Workbox PWA (`vite-plugin-pwa`).
- **Backend**: Node.js + Express (`server.ts`) serving both `/api/*` REST endpoints and the compiled Vite SPA (`dist/` in production, Vite middleware in development).
- **Database**: SQLite via `better-sqlite3` (`lazytoearn.db`) with WAL mode, foreign keys enabled, and versioned SQL migrations located in `/db/migrations/`.
- **AI Personal Assistant**: Server-side `@google/genai` integration (`gemini-4-hydrogen`) protected by strict read-only prompt boundaries and per-user rate limiting. Never exposes API keys to the browser.

---

## 2. Prerequisites

- **Node.js**: v22.x or later (LTS recommended; native TypeScript stripping supported for `node server.ts`, or `tsx` in dev).
- **npm**: v10.x or later.
- **HTTPS**: Required in production for Service Worker registration, PWA installability (`beforeinstallprompt`), and Push Notifications.

---

## 3. Installation

```bash
npm install
```

---

## 4. Environment Variables

Configure these environment variables (see `.env.example`):

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Optional | HTTP port (defaults to `3000`). |
| `NODE_ENV` | Production | Set to `production` when serving the compiled `dist/` bundle. |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key used strictly server-side by `/api/ai/assistant`. If unset, the assistant automatically falls back to deterministic multilingual FAQ responses. |
| `ADMIN_SECRET_CODE` | Recommended | Passcode used by `/api/admin/unlock` to issue admin Bearer session tokens. Set a strong secret before production deployment. |
| `SQLITE_DB_PATH` | Optional | Custom filesystem path for the SQLite database file (defaults to `./lazytoearn.db`). |
| `APP_URL` | Optional | Public origin URL of the deployed application. |

> **Security Note:** Never commit `.env` files, real API keys, or production `ADMIN_SECRET_CODE` values to source control.

---

## 5. Database Migrations & Seed Initialization

Database migrations live in `/db/migrations/001_advanced_features.sql` and are **applied automatically and idempotently** on server boot via `initializeDatabase()` in `server/db.ts`.

Applied migrations are tracked in the `schema_migrations` table. Existing user wallets, balances, and local account records are preserved without resets.

To inspect tables or verify migrations manually:

```bash
node -e "import('./server/db.ts').then(m => { m.initializeDatabase(); console.log('Migrations OK'); })"
```

---

## 6. Build & Run Commands

### Development
```bash
npm run dev
```
Runs `tsx server.ts` on port `3000` with Vite middleware.

### Production Build & Start
```bash
npm run build
NODE_ENV=production npm start
```
1. `npm run build` compiles the Vite React app into `dist/` and generates the PWA Service Worker (`dist/sw.js`), Web App Manifest (`dist/manifest.webmanifest`), and static asset precache list.
2. `npm start` executes `node server.ts`, initializes SQLite migrations, mounts all `/api/*` endpoints, and serves `dist/`.

### Type Check
```bash
npm run lint
```

---

## 7. Key Module Endpoints

- **Monthly Reward Calendar**: `/api/calendar/events`, `/api/calendar/claim`, `/api/admin/calendar/*`
- **Multi-Language (EN / বাংলা)**: `/api/i18n/strings`, `/api/i18n/preference`, `/api/admin/i18n/*`
- **Public Profiles & Directory**: `/api/profiles/directory`, `/api/profiles/public/:username`, `/api/profiles/me`, `/api/profiles/follow`, `/api/profiles/report`, `/api/admin/profiles/*`
- **Security, 2FA, Devices & Fraud Protection**: `/api/security/overview/:userId`, `/api/security/2fa/toggle`, `/api/security/sessions/revoke`, `/api/security/fraud-scan`, `/api/admin/security/*`
- **AI Personal Assistant**: `/api/ai/assistant`, `/api/ai/history/:userId`, `/api/admin/ai/settings`
- **Live Activity Feed**: `/api/activity/feed`, `/api/activity/record`, `/api/admin/activity/*`
- **VIP Clubhouse**: `/api/vip-club/events`, `/api/vip-club/join`, `/api/vip-club/leaderboard`, `/api/admin/vip-club/*`
- **Smart Recommendations**: `/api/recommendations/:userId`, `/api/recommendations/interact`, `/api/admin/recommendations/*`
- **Automated Monthly Reports (PDF/CSV)**: `/api/reports/:userId`, `/api/reports/generate`, `/api/admin/reports/summary`
- **Non-Cash Gift Center**: `/api/gifts/catalog`, `/api/gifts/history/:userId`, `/api/gifts/send`, `/api/admin/gifts/*`
- **Platform News Center**: `/api/news/articles`, `/api/admin/news/*`
- **PWA & Push Notifications**: `/api/pwa/settings`, `/api/pwa/subscribe`, `/api/admin/pwa/*`

---

## 8. PWA & Caching Policy

- Generated manifest & Service Worker configured in `vite.config.ts` via `vite-plugin-pwa`.
- Static icons served from `/public/pwa-192x192.png`, `/public/pwa-512x512.png`, and `/public/apple-touch-icon.png`.
- All `/api/*` endpoints use `NetworkOnly` in Workbox so financial balances, security sessions, calendar claims, and admin records are never served from stale cache.
- Offline fallback status banner renders automatically via `OfflineIndicator`.
