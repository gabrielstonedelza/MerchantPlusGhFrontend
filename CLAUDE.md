# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js on port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint via next lint
```

There are no tests configured in this project.

The Django backend must be running on `localhost:8000` for the frontend to work. The Next.js dev server proxies `/api/*` and `/ws/*` to `http://localhost:8000`.

## Architecture

**Next.js 14 App Router** with TypeScript and Tailwind CSS. All routes are under `src/app/`.

### Route structure

- `/` → redirects to `/dashboard` (if token exists) or `/login`
- `/login` → multi-step login: credentials → optional company selection → optional TOTP 2FA
- `/dashboard` → real-time admin dashboard (protected by layout auth check)

### Auth flow

Session state is stored entirely in `localStorage` after login: `token`, `user`, `membership`, `companyId`, `companyName`, `role`, `companies`. The `dashboard/layout.tsx` guards the route by checking for `token` and redirecting to `/login` if absent.

Login supports three server responses (see `src/lib/api.ts`):
1. `LoginSuccessResponse` — token granted, redirect to dashboard
2. `CompanySelectionResponse` — user belongs to multiple companies, show picker
3. `TwoFactorRequiredResponse` — TOTP required, show 6-digit OTP input with backup-code fallback

### Data layer

**`src/lib/api.ts`** — all REST calls. Uses `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Every authenticated request sends `Authorization: Token <token>` and `X-Company-ID: <companyId>`.

**`src/lib/websocket.ts`** — `DashboardWebSocket` class. Connects to `ws://…/ws/admin/dashboard/?company_id=…&token=…`. Emits typed events (`initial_state`, `transaction_update`, `customer_update`, `balance_change`, `connection`). Reconnects with exponential backoff (up to 10 attempts, max 30 s delay). Use `NEXT_PUBLIC_WS_URL` to override the WebSocket host.

**`src/app/dashboard/page.tsx`** — orchestrates both REST (initial load) and WebSocket (live updates). Merges incoming WS events into local React state; no external state library is used.

### Styling conventions

Dark/gold design system defined in `tailwind.config.js`:
- `dark` scale: `DEFAULT` (#0F1117) through `dark-600` (#1A1D27)
- `gold` scale: `DEFAULT` (#D4A843)

Reusable CSS component classes in `globals.css`: `.card`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.badge-deposit`, `.badge-withdrawal`, `.badge-pending`, `.badge-completed`, `.glow-gold`, `.live-pulse`, `.animate-slide-in`.

### Security

`src/middleware.ts` applies security headers (HSTS, CSP, X-Frame-Options, etc.) to every response. Dashboard routes additionally get `Cache-Control: no-store`. The CSP allows `connect-src` to `ws:`, `wss:`, and `https://merchantplusgh.com`.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | REST API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://<hostname>:8000` | WebSocket base URL |
