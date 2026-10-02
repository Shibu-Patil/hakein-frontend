# Hakein Frontend — 3 Simple Pages

Vite + React 19 + Tailwind v4 + React Router UI for the Hakein job autopilot.
Deliberately minimal: the user sets up once, the backend applies all day, the phone only rings when a question needs a human.

Backend: [`hakein-backend`](../hakein-backend).

## Pages (only 3)

| Route | Page | What it does |
|---|---|---|
| `/` | **Home** | Watching status (pause/resume), applied-today count, inbox badge, today's applications. Empty state onboards new users. Auto-refreshes every 60s. |
| `/setup` | **Setup** | One form, one button: email + name + skills + locations → LinkedIn/Naukri logins (at least one, stored encrypted) → 8 quick answers → **Save & start applying**. Creates the DB user with `autoApply: true`, full-auto answers, and email alerts on. |
| `/inbox` | **Inbox** | Leftover screening questions as tappable option buttons or a text field. Answering retries the apply automatically and teaches the system forever. Polls every 15s. No app download needed — a free Gmail email alerts the phone even with this page closed. |

Design: dark gradient + glass cards, Inter font, Lucide icons, mobile-first (bottom-line: it must be thumb-usable on a phone).

## Quick start

```bash
npm install
cp .env.example .env   # set VITE_API_URL if backend isn't on localhost:3000
npm run dev            # http://localhost:5173
npm run build          # type-check (tsc) + production bundle to dist/
```

```env
# .env
VITE_API_URL=http://localhost:3000
```

The backend URL can also be changed at runtime — it lives in `localStorage` (`hakein.apiBase`).
User ID, AI provider and AI key are likewise stored per-browser (`hakein.userId`, `hakein.provider`, `hakein.aiKey`).

## Project layout

```
src/
  App.tsx               3 routes (/, /setup, /inbox)
  main.tsx              React root
  index.css             Tailwind v4 + theme (glass, grad-text, grid-bg, animations)
  lib/api.ts            fetch client for every backend endpoint + shared TS types
  lib/cn.ts             classnames helper
  components/Layout.tsx sticky header, 3-item nav (mobile-friendly)
  components/ui.tsx     Card, Btn (primary/ghost/danger/soft), Field, inputCls,
                        Spinner, StatusBadge, ScoreRing, ErrorBox, Empty
  pages/Home.tsx        status hero, pause/resume (PATCH preferences), today's feed
  pages/Setup.tsx       one-shot onboarding → createUser + saveCredentials + saveQaProfile
  pages/Inbox.tsx       pending questions (GET inbox) + answer (POST answer → auto-retry)
```

## Backend endpoints used

- `GET /api/health` — connection check
- `POST /api/users` — create/upsert user (profile + preferences + creds in one call from Setup)
- `GET /api/users/:id` — status + preferences (pause/resume)
- `PATCH /api/users/:id/preferences` — toggle `autoApply`
- `PATCH /api/users/:id/credentials` — portal logins
- `PATCH /api/users/:id/qa-profile` — quick answers
- `GET /api/users/:id/inbox` — pending questions (polled)
- `POST /api/users/:id/inbox/:qid/answer` — answer → learns + retries apply
- `GET /api/applications/user/:userId` — today's feed

## User flow

1. Open `/setup` → fill once → **Save & start applying**.
2. Backend scheduler (every 2h) scrapes last-24h LinkedIn + Naukri jobs, tailors a resume per JD, logs in, applies, auto-answers questions.
3. `/` shows it happening. If a question survives automation, Gmail pings the phone → answer in `/inbox` → apply retries itself.

## Notes

- No login system in the UI itself — identity is the backend user ID kept in `localStorage`. One browser = one job-seeker.
- `dist/` is build output (git-ignored). `node_modules/` is git-ignored.
- Needs the backend running with `DATABASE_URL` (Atlas) for anything past the landing hero; without it the API returns `503` and pages show the error box.
