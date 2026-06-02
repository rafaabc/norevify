# CLAUDE.md

## Commands

```bash
npm run dev          # Next.js dev server :3000 (Turbopack)
npm run build        # Production build (Webpack — Turbopack prod not stable)
npm start            # Serve production build
npm run lint         # ESLint check
npm run format:check # Prettier check
npm run test:unit    # Node test runner (backend) + Vitest (frontend)
npm run test:integration
npm run test:api     # Requires running server + Atlas
npm run test:e2e     # Playwright Chromium; requires running server
```

## Environment

Copy `.env.example` to `.env`. Key vars:

```
JWT_SECRET / JWT_EXPIRES_IN
MONGODB_URI          # Atlas drive-ledger database (auto-created on first write)
FRONTEND_URL         # Used in password-reset email links (= BASE_URL in prod)
RESEND_API_KEY       # Resend email API
GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID
SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN / SENTRY_AUTH_TOKEN
NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST
```

`SENTRY_DSN` server-only; `NEXT_PUBLIC_SENTRY_DSN` client + server — both must be set in Vercel.

## Architecture

Next.js 16 App Router — single repo, API routes + frontend, deployed on Vercel Fluid Compute.

- `app/api/` — Route Handlers. `withAuth(handler)` in `lib/auth.mjs` decodes JWT and passes `user` as 3rd arg (`NextRequest` is immutable).
- `lib/services/` — all business logic. Errors thrown with `.status`; handlers read `err.status || 500`.
- `lib/db.mjs` — `connectDB()` called at top of every Route Handler; uses `globalThis._mongoose` cache.
- `views/` — page-level components (renamed from `pages/` to avoid Pages Router conflict).
- All page/component files are `'use client'` — JWT in localStorage requires client-side auth.

Error convention: `makeError(status, message)` → `Error` with `.status` field.

Sentry gotcha: `instrumentation.js` and `instrumentation-client.js` use CJS (`require`/`module.exports`) — ESM/CJS conflict with Turbopack. Webpack ESM rule in `next.config.mjs` handles prod build.

## Domain Rules

**Expenses — Fuel category**: requires `litres` + `price_per_litre`; `amount` is auto-computed (`litres × price_per_litre`, 2 dp). Passing `amount` → 400. PATCH ignores `amount` for Fuel. `date` must not be future.

**Reminders**: at least one of `dueDate` or `dueKm` required. Status: `overdue` (past dueDate OR currentKm ≥ dueKm), `dueSoon` (within 7 days / 500 km), `upcoming` (else). Completion with `intervalMonths`/`intervalKm` auto-creates the next reminder.

**Odometer**: `Fuel` expense with `odometer` field updates `user.currentKm`. Drives km-based reminder status.

## Frontend

**HTTP layer**: all calls via `services/apiService.js` — never `fetch()` in components. To add an endpoint: export from `apiService.js` using the internal `request()` helper.

**Auth**: JWT in `localStorage['token']`. `AuthContext` decodes payload client-side (no `/me` call). 401/403 dispatches `window` event `'auth:logout'` → context clears token and redirects to `/login`.

**i18n**: `pt-BR` default, `en` supported. Language detection: `localStorage['i18nextLng']` → `navigator.language`. JWT carries `language`; `AuthContext.login()` applies it only if no localStorage key exists (client pref wins). New backend error strings need a mapping in `i18n/apiErrors.js`.

**Modal pattern**: `.modal-backdrop` + `.modal` (global CSS). `ReminderStatusBadge` puts `data-testid` and `data-status` on the **same** element — E2E selector: `[data-testid="reminder-status-badge"][data-status="upcoming"]` (no space).

**`useSearchParams`** must be wrapped in `<Suspense>` at route level.

**PWA**: dev uses Turbopack, prod uses Webpack (`next build --webpack`). PWA assets generated at build time and committed; `.map` files gitignored.

## API

Swagger UI: `GET /api-docs`. Auth: `Authorization: Bearer <token>` → `req.user = { id, username }`.

| Prefix           | Auth | Endpoints |
| ---------------- | ---- | --------- |
| `/api/auth`      | No   | `POST /register`, `/login`, `/forgot-password`, `/reset-password`, `/google` |
| `/api/auth`      | Yes  | `PATCH /currency`, `/language`, `/odometer`, `/password`; `POST/DELETE /google/link`; `GET /providers`; `DELETE /me`; `GET /me/export` |
| `/api/expenses`  | Yes  | CRUD + `GET /summary?year=&month=&category=` |
| `/api/reminders` | Yes  | CRUD + `POST /:id/complete`, `GET /badge-count` |
| `/api/health`    | No   | `GET /` |

## Tests

**Backend unit** (`test/unit/`): Node test runner + `node:assert`. Each file boots in-memory Mongo via `test/helpers/mongo.js` (`startMongo/stopMongo/resetMongo`).

**Frontend unit** (`test/frontend/`): Vitest + Testing Library. Global mocks in `test/frontend/setup.tsx` (next/navigation, next/link). Per-file patterns:

```js
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/i18n/index.js', () => ({ default: { t: (k) => k, changeLanguage: vi.fn(), language: 'en' } }));
// service-layer tests replace global.fetch directly
global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
// JWT fixture
const makeToken = (payload) => `h.${btoa(JSON.stringify(payload))}.s`;
```

Add `vi.mock('@/i18n/index.js', ...)` in any file that imports a component using i18n transitively — the real module calls `initReactI18next` which fails. Chart components (`StackedMonthlyBar`, `MonthlyTrendChart`, `CategoryDonut`) are stubbed as no-ops in page tests.

**Integration** (`test/integration/`): real service↔model calls, in-memory Mongo, no HTTP. Files named `<flow>.flow.test.js`.

**API** (`test/api/`): Mocha + Chai + Supertest. Requires live server + Atlas. Root hook in `test/api/hooks/auth.js` registers a primary user once.

**E2E** (`e2e/`): Playwright Page Object Model. `globalTeardown` deletes all `/@test\.com$/` users from Atlas after each run.

E2E language gotcha: new users default to `pt-BR` via JWT. Always set `localStorage.setItem('i18nextLng', 'en')` in `addInitScript` for text-based assertions. POMs must use language-agnostic selectors (`button[type="submit"]`, CSS classes, `[name="..."]`) — never hard-code translated strings.

## Linting & Formatting

ESLint 9 flat config (`eslint.config.mjs`) — `eslint-config-next` + `eslint-config-prettier`. Prettier at `.prettierrc.json`.

Non-obvious rule decisions:
- `@next/next/no-page-custom-font` off for `app/**` — rule targets Pages Router `_document.js` only
- `no-unused-vars` off for `*.ts`/`*.tsx` — TypeScript handles it; constructor parameter properties falsely flagged
- `react-hooks/set-state-in-effect` false-positives on async functions in effects — suppressed per-line with comment; `AuthContext` localStorage init suppressed (SSR-safe only in `useEffect`)
- `frontend/**` excluded — legacy build artifacts

## CI Pipeline

`.github/workflows/ci.yml` — push/PR to `main`:

| Job                | Needs              | Description                                        |
| ------------------ | ------------------ | -------------------------------------------------- |
| `lint`             | —                  | ESLint + Prettier check                            |
| `audit`            | —                  | `npm audit --audit-level=high --omit=dev`          |
| `test-unit`        | —                  | Node test runner + mongodb-memory-server           |
| `test-integration` | `test-unit`        | In-memory Mongo, no secrets                        |
| `test-api`         | `test-integration` | Mocha against `next build && next start`           |
| `e2e`              | `test-api`         | Playwright Chromium against `next build && next start` |

`test-api` and `e2e` require `JWT_SECRET` + `MONGODB_URI` GitHub Secrets. Dependabot: weekly npm + github-actions updates (`.github/dependabot.yml`).
