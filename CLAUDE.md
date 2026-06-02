# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (Next.js, port 3000) — Turbopack
npm run dev

# Production build — Webpack (Turbopack prod build not yet stable)
npm run build

# Start production server (requires build first)
npm start

# Install dependencies
npm install
```

## Environment

Copy `.env.example` to `.env` and fill in:

```
PORT=3000
JWT_SECRET=your-secret
JWT_EXPIRES_IN=1h
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/drive-ledger?retryWrites=true&w=majority&appName=Cluster0
RESEND_API_KEY=re_xxxxxxxxxxxx
RESET_PASSWORD_EXPIRES_IN=15m
GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
LOG_LEVEL=info
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

`MONGODB_URI` points to the `drive-ledger` database on the shared Atlas `Cluster0`. The database is created automatically on first write.

`FRONTEND_URL` is used to build the password-reset link in recovery emails — same as `BASE_URL` in production. `RESEND_API_KEY` authenticates with the [Resend](https://resend.com) email API. `RESET_PASSWORD_EXPIRES_IN` controls reset-token lifetime (default `15m`).

`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — Sentry project DSN; captures 5xx errors server- and client-side. `SENTRY_AUTH_TOKEN` used by `@sentry/nextjs` to upload source maps at build time. `LOG_LEVEL` controls pino log verbosity (default `info`).

`SENTRY_DSN` is only used server-side (source maps); `NEXT_PUBLIC_SENTRY_DSN` is read by both `instrumentation-client.js` (client init) and the server configs. Both must be set in Vercel env vars.

`NEXT_PUBLIC_POSTHOG_KEY` — PostHog project API key (EU region). `NEXT_PUBLIC_POSTHOG_HOST` — defaults to `https://eu.i.posthog.com` (LGPD-friendly). PostHog initialized in `components/PostHogProvider.jsx`, wrapped at root in `app/layout.jsx`. `AuthContext` calls `posthog.identify(userId, { username })` on login and `posthog.reset()` on logout. All inputs masked in session recordings.

## Architecture

**Next.js 16 App Router** — single repo serving both frontend and API routes, deployed on Vercel Fluid Compute.

```
app/
  (auth)/          → public pages (login, register, forgot-password, reset-password)
  (app)/           → protected pages behind client-side auth guard
  api/             → Route Handlers (replaces Express controllers/routes)
lib/
  db.mjs           → Mongoose connection with globalThis cache
  auth.mjs         → withAuth() HOF — decodes JWT, passes user as 3rd arg
  models/          → Mongoose schemas + compiled models
  services/        → all business logic and validation
  constants/       → shared enums (languages, categories)
components/        → React components (PascalCase)
views/             → page-level React components (renamed from pages/ to avoid Pages Router conflict)
context/           → React context providers (AuthContext, etc.)
hooks/             → custom React hooks
services/          → client-side HTTP layer (apiService.js)
i18n/              → i18next config + locale JSON files
styles/            → CSS Modules + globals.css
utils/             → shared utilities
```

- **`lib/db.mjs`**: `connectDB()` — called at the top of every Route Handler before accessing models. Uses `globalThis._mongoose` cache for Fluid Compute instance reuse.
- **Route Handlers** (`app/api/`): replace Express routes + controllers. `withAuth(handler)` decodes JWT and passes user as 3rd arg since `NextRequest` is immutable.
- **Services** (`lib/services/`): all business logic. Throw errors with `.status` property; Route Handlers read `err.status || 500`.
- **Models** (`lib/models/`): Mongoose schemas with `mongoose.models.X || mongoose.model('X', schema)` guard for hot-reload safety.

Error convention: `makeError(status, message)` in each service creates an `Error` with a `.status` field.

### Sentry

Error monitoring via `@sentry/nextjs`. Captures unhandled exceptions in Route Handlers automatically via `onRequestError` hook (requires Next.js 15+).

Key files:

- `instrumentation.js` — registers `onRequestError: Sentry.captureRequestError`; imports `sentry.server.config.mjs` / `sentry.edge.config.mjs` by runtime
- `instrumentation-client.js` — client-side init with Session Replay; reads `NEXT_PUBLIC_SENTRY_DSN`
- `sentry.server.config.mjs` / `sentry.edge.config.mjs` — server/edge init
- `app/global-error.jsx` — React render error boundary wired to Sentry
- `next.config.mjs` — `tunnelRoute: "/monitoring"` proxies Sentry requests through Next.js to bypass ad-blockers; webpack ESM rule required for `instrumentation*.js` and `sentry.*.config.mjs` files

Both `instrumentation.js` and `instrumentation-client.js` use CJS (`require`/`module.exports`) due to an ESM/CJS conflict with Turbopack. The webpack ESM rule in `next.config.mjs` handles the production build side.

IDs are MongoDB `ObjectId` values, exposed as 24-character hex strings. JWT payload carries `{ id, username, currency, language }`.

Supported languages are defined in `lib/constants/languages.js` (`SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE = 'pt-BR'`).

## Unit Tests

- Framework: Node.js native Test Runner (`node:test`) + `node:assert`
- No external test libraries (no Mocha, Jest, Chai, Supertest)
- Test files live in `test/unit/`, mirroring the `lib/` structure
- Database isolation via `mongodb-memory-server` (no Atlas connection needed)

### Test layers covered

- `lib/services/` — business logic and validation
- `lib/models/` — Mongoose schema behaviour and CRUD
- `lib/middleware/` — JWT auth logic
- Route Handler wrappers — HTTP status code mapping and `err.status || 500` fallback

### Scripts

- `npm run test:unit` — run all unit tests (backend + frontend)
- `npm run test:unit:coverage` — run tests with coverage reports

### Conventions

- Pattern: AAA (Arrange, Act, Assert)
- Test naming: `should <behavior> when <condition>`
- Each test file boots an in-memory Mongo via `test/helpers/mongo.js`:
  - `before(async () => startMongo())` / `after(async () => stopMongo())`
  - `beforeEach(async () => resetMongo())` — calls `deleteMany({})` on both collections
- No HTTP/endpoint tests here — those belong to the API test layer

## Frontend Unit Tests

- Framework: **Vitest** + `@testing-library/react` + `jsdom`
- Test files live in `test/frontend/`, mirroring the source directories (`components/`, `views/`, `hooks/`, `context/`, `services/`, `utils/`, `i18n/`)
- Config: `vitest.config.ts` at root; `setupFiles: test/frontend/setup.tsx`

### Scripts

- `npm run test:unit:frontend` — run frontend unit tests
- `npm run test:unit:frontend:coverage` — run with v8 coverage (HTML report in `coverage/`)

### Coverage scope

Coverage is measured only over: `components/`, `views/`, `hooks/`, `context/`, `services/`, `utils/`, `i18n/index.js`, `i18n/apiErrors.js`, `lib/constants/`.

Excluded from coverage (browser-only / third-party-heavy, covered by E2E):

- `components/charts/**`
- `components/PWAUpdater.jsx`
- `components/UpdatePrompt.jsx`
- `components/GoogleSignInButton.jsx`

### Mock conventions

All patterns below are used consistently across the frontend test suite. Do not introduce `vi.hoisted` or MSW unless the need is clear.

**Global mocks (applied to every test via `test/frontend/setup.tsx`):**

- `next/navigation` — `useRouter`, `usePathname`, `useSearchParams` stubbed with `vi.fn()`
- `next/link` — renders a plain `<a>` element

**Per-file mocks (inline in each test file via `vi.mock(...)`):**

```js
// react-i18next
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

// i18n instance
vi.mock('@/i18n/index.js', () => ({
  default: { t: (k) => k, changeLanguage: vi.fn(), language: 'en' },
}));

// apiService — mock only the methods under test
vi.mock('@/services/apiService.js', () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
  expensesApi: { list: vi.fn(), remove: vi.fn() },
  remindersApi: { badgeCount: vi.fn() },
}));

// AuthContext
vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ login: mockLogin, isAuthed: true, token: '...', username: 'u' }),
}));
```

**Service-layer tests** replace `global.fetch` directly:

```js
global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
```

Run `vi.clearAllMocks()` and `localStorage.clear()` in `beforeEach`.

**JWT fixture** — build a fake token without signing:

```js
const makeToken = (payload) => `h.${btoa(JSON.stringify(payload))}.s`;
```

**`usePathname` per-test override:**

```js
let mockUsePathname = vi.fn().mockReturnValue('/current-path');
vi.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));
```

**`useRouter` per-test override (for view tests):**

```js
let mockPush;
beforeEach(() => {
  mockPush = vi.fn();
  mockUseRouter.mockReturnValue({ push: mockPush });
});
```

**`useParams` mock (for form pages with edit/create modes):**

```js
const mockUseParams = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useParams: () => mockUseParams(),
}));
// create mode: mockUseParams.mockReturnValue({})
// edit mode:   mockUseParams.mockReturnValue({ id: 'some-id' })
```

**`useSearchParams` override per test (for ResetPasswordPage, etc.):**

```js
const mockUseSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useSearchParams: () => mockUseSearchParams(),
}));
// in test: mockUseSearchParams.mockReturnValue(new URLSearchParams('token=abc123'))
```

**`i18n` mock reference pattern** — when a component imports `@/i18n/index.js` and you need to assert on it (e.g. `changeLanguage` was called), import the mocked module directly rather than keeping a top-level `const` reference in the factory (which fails hoisting):

```js
vi.mock('@/i18n/index.js', () => ({ default: { language: 'pt-BR', changeLanguage: vi.fn() } }));
import i18n from '@/i18n/index.js'; // gives you the mocked object
// then in tests: expect(i18n.changeLanguage).toHaveBeenCalledWith('en')
```

**`useAutoClear` tests** — use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`; advance with `act(() => { vi.advanceTimersByTime(ms); })`.

**`useAsyncAction` tests** — wrap `run()` calls in `await act(async () => { await result.current.run(...); })` to flush state updates through the promise lifecycle.

**`DashboardPage` / any page using `@/i18n/index.js` transitively** — add `vi.mock('@/i18n/index.js', ...)` to the test file even if the page doesn't import it directly; the real module calls `initReactI18next` which fails against a partial react-i18next mock.

**Chart components are intentionally uncovered** — `SummaryPage`, `DashboardPage` tests mock `StackedMonthlyBar`, `MonthlyTrendChart`, `CategoryDonut` as no-op stubs and assert only on data plumbing + table/KPI rendering.

**Module-level state for per-test mock overrides** — when `useAuth` returns different values per test, use a module-level `let` variable and close over it in the factory (not `vi.mocked`, which requires the factory value to be a `vi.fn()`):

```js
let mockIsAuthed = true;
vi.mock('@/context/AuthContext.jsx', () => ({ useAuth: () => ({ isAuthed: mockIsAuthed }) }));
beforeEach(() => {
  mockIsAuthed = true;
}); // reset default
```

## Integration Tests

- Framework: Node.js native Test Runner (`node:test`) + `node:assert`
- No mocks, no HTTP calls — real internal collaborators only
- Test files live in `test/integration/`, organized by flow (not by source layer)
- Database isolation via `mongodb-memory-server` (same helper as unit tests)

### What integration tests cover

- Service ↔ Mongoose model collaboration (real in-memory Mongo)
- Middleware → service context hand-off (decoded `req.user.id` drives real service calls)
- Multi-step internal flows: register → login → create expense → summary
- Cross-layer CRUD state consistency: create → update → delete → verify via read
- Password-recovery cycle: forgotPassword → resetPassword → login with new password

### What they do NOT cover

- Isolated function logic — that's unit tests in `test/unit/`
- HTTP contracts, status codes, response bodies — that's API tests in `test/api/`

### Scripts

- `npm run test:integration` — run all integration tests
- `npm run test:integration:coverage` — run with c8 coverage report
- `npm run test:backend` — run unit + integration suites together

### Conventions

- Pattern: AAA (Arrange, Act, Assert)
- Files named `<flow>.flow.test.js` under `test/integration/`
- Both collections reset via `resetMongo()` in `beforeEach` (async `deleteMany`)
- No mocking of internal modules — real implementations only

## API Tests

- Framework: Mocha + Chai + Supertest; HTML reports via Mochawesome
- **Requires a running server connected to Atlas** — start with `npm run dev` or `npm start` before executing the suite
- Test files live in `test/api/`, organized by feature (auth, expenses, summary)

### Structure

- `test/api/base/api-base.js` — shared base: exports `request`, `expect`, `BASE_URL`, `CATEGORIES`, `authHeader()`, `createAndLoginUser(prefix)`
- `test/api/hooks/auth.js` — root `before` hook: registers and logs in a primary user; exports `getToken()`, `getUser()`, `uniqueUsername(prefix)`
- `test/api/fixtures/` — JSON test data per feature (data-driven testing)

### Scripts

- `npm run test:api` — run all API tests (spec reporter); sets `NODE_OPTIONS=--use-system-ca` for Atlas TLS on Windows
- `npm run test:api:report` — run tests and generate HTML report in `reports/`

### Conventions

- Pattern: AAA (Arrange, Act, Assert)
- Test naming: `[TC-XX-YY] should <behavior> when <condition>`
- All tests run against a live server; `BASE_URL` read from `.env` (defaults to `http://localhost:3000`)
- Root hook registers and logs in a primary user once before the suite; tests that need extra users call `createAndLoginUser(prefix)` from the base

## E2E Tests

- Framework: Playwright (`@playwright/test` v1.47+)
- **Requires Next.js server running** — `npm run dev` (dev) or `npm start` (production build)
- Test files live in `e2e/tests/`, organised by feature
- Page Objects in `e2e/pages/`; shared fixtures in `e2e/fixtures/`
- Config: `playwright.config.ts` at root; `baseURL` defaults to `http://localhost:3000`

### Scripts

- `npm run test:e2e` — run all E2E tests (Chromium); sets `NODE_OPTIONS=--use-system-ca` for Atlas TLS on Windows

### Atlas cleanup — globalTeardown

After all tests finish, `e2e/global-teardown.ts` opens a direct Mongoose connection to Atlas and deletes all users whose email matches `/@test\.com$/` (the pattern used by `createAndLoginUser`), plus their expenses. This pattern-based approach is crash-safe — it cleans up residual data from any previous run, including runs that were interrupted before teardown.

### Conventions

- Pattern: Page Object Model — each page is a class in `e2e/pages/`
- Test naming: `[TC-XX-YY] should <behavior> when <condition>`
- `createAndLoginUser(request, prefix)` — registers + logs in a fresh user (email `${username}@test.com`, cleaned up by teardown pattern), returns `{ username, token }`
- `createExpenseViaApi(request, token, data)` — creates an expense via API, returns the response body
- **Language in tests**: all new users default to `pt-BR` (via JWT). Tests that log in through the UI get PT-BR applied by `AuthContext.login()`. Tests that inject a token via `addInitScript` get whatever the browser navigator reports. **Always set `i18nextLng` explicitly in `beforeEach` / `addInitScript`** for any test that makes text-based assertions — use `localStorage.setItem('i18nextLng', 'en')` or `'pt-BR'` depending on what the test validates. Tests that don't test i18n behaviour should use `'en'` for consistency.
- **POMs must use language-agnostic selectors**: prefer `button[type="submit"]`, `button.btn-secondary`, CSS classes, `[name="..."]` attributes, and ARIA roles without text names. Never hard-code translated strings in POMs — put them in the spec when they are part of what the test is verifying.

## API

Swagger UI at `GET /api-docs` (served from `resources/swagger.json`). Also logged to console on startup.

| Prefix           | Auth required    | Description                                                                                                           |
| ---------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/api/auth`      | No               | `POST /register`, `POST /login`, `PATCH /password`, `POST /forgot-password`, `POST /reset-password`, `POST /google`   |
| `/api/auth`      | Yes (Bearer JWT) | `PATCH /currency`, `PATCH /language`, `PATCH /odometer`, `POST /google/link`, `DELETE /google/link`, `GET /providers` |
| `/api/expenses`  | Yes (Bearer JWT) | CRUD + `GET /summary`                                                                                                 |
| `/api/reminders` | Yes (Bearer JWT) | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `POST /:id/complete`, `DELETE /:id`, `GET /badge-count`                    |
| `/api/health`    | No               | `GET /` — health check                                                                                                |

Auth: `Authorization: Bearer <token>` header. JWT decoded into `req.user` (`{ id, username }`). `id` is an ObjectId hex string.

## Reminder domain rules

Valid types: `Fuel`, `Maintenance`, `Insurance`, `Parking`, `Toll`, `Tax`, `Other` (PascalCase — same set as expense categories).

A reminder must have at least one of `dueDate` or `dueKm`. Both are optional individually but at least one is required.

Status computation (`lib/services/reminders.service.js`):

- `overdue` — past `dueDate` OR `currentKm >= dueKm`
- `dueSoon` — within `LEAD_DAYS = 7` days of `dueDate` OR within `LEAD_KM = 500` km of `dueKm`
- `upcoming` — everything else

`GET /badge-count` returns `{ dueSoon, overdue }` — frontend badge shows the sum.

**Completion with recurrence**: `POST /:id/complete` accepts `{ completedKm }`. If `intervalMonths` or `intervalKm` are set, a new reminder is created automatically (`nextDueDate = completedDate + intervalMonths`, `nextDueKm = completedKm + intervalKm`).

**Odometer tracking**: logging a `Fuel` expense with `odometer` field updates `user.currentKm`. `PATCH /api/auth/odometer` allows manual override. `currentKm` drives the km-based reminder status.

## Expense domain rules

Valid categories: `Fuel`, `Maintenance`, `Insurance`, `Parking`, `Toll`, `Tax`, `Other`.

- **Fuel**: requires `litres` and `price_per_litre` (both positive numbers); `amount` is auto-computed as `litres * price_per_litre` (rounded to 2 decimals). Passing `amount` → 400 error.
- **Non-Fuel**: requires `amount` (positive number). Do not pass `litres` or `price_per_litre`.
- **PATCH/PUT Fuel**: `amount` is ignored in the merge — only `litres`/`price_per_litre` can change the computed amount.
- `date` must not be in the future.

`GET /api/expenses` supports `?category=`, `?year=`, `?month=` filters.  
`GET /api/expenses/summary` requires `?year=` (must not be in the future); optional `?month=` and `?category=`.

## Frontend

Fully integrated into Next.js App Router at the project root (no separate `frontend/` directory).

### Stack

- **Next.js 16 App Router** — SSR/SSG + client components; dev server on `:3000`
- **React 19** — all page/component files are `'use client'` (JWT in localStorage requires client-side auth)
- **Plain CSS Modules** — scoped per component/page; global base in `styles/globals.css`
- **`@ducanh2912/next-pwa`** — generates `public/sw.js` + `public/manifest.webmanifest` at build time; SW disabled in dev

### HTTP layer

All HTTP calls go through `services/apiService.js` — never call `fetch()` directly in components.

```js
// Auth
authApi.register({ username, password });
authApi.login({ username, password }); // returns { token }

// Expenses
expensesApi.list({ category, year, month });
expensesApi.get(id);
expensesApi.create(data);
expensesApi.update(id, data);
expensesApi.remove(id);
expensesApi.summary({ year, month, category });

// Reminders
remindersApi.list({ status }); // status: 'active' | 'done'
remindersApi.get(id);
remindersApi.create(data);
remindersApi.update(id, data);
remindersApi.complete(id, { completedKm });
remindersApi.remove(id);
remindersApi.badgeCount(); // returns { dueSoon, overdue }
```

To add a new endpoint: export a new function from `services/apiService.js` that calls the internal `request()` helper. Do not add `fetch()` calls elsewhere.

### Auth

- JWT stored in `localStorage` key `'token'`.
- `AuthContext` (`context/AuthContext.jsx`) exposes `{ token, isAuthed, username, login, logout }`.
- `username` is decoded from the JWT payload client-side — avoids a separate `/me` endpoint.
- Auth guard: `app/(app)/layout.jsx` — `useEffect` redirect to `/login` if `!isAuthed`.
- 401/403 responses clear the token and dispatch a `window` `'auth:logout'` event; `AuthContext` listens and redirects to `/login` with a "Session expired" banner.
- Register does not auto-login — on success, navigates to `/login?registered=1`.
- Google Sign-In uses the GIS ID token flow (`POST /api/auth/google`). `GoogleSignInButton` loads the GIS script once, renders the official button, and triggers One Tap on login/register pages. Supports `mode` prop: `login`, `register`, `link`. Backend requires `GOOGLE_CLIENT_ID` env; frontend requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Accounts are auto-linked by email when `email_verified=true`. `GET /api/auth/providers` returns `{ authProviders, hasPassword }` — used by SettingsPage to show Connect/Disconnect Google.

### Navigation

- **`next/link`** — replaces `react-router-dom` `<Link>`
- **`next/navigation`** — `useRouter()`, `usePathname()`, `useSearchParams()` replace react-router hooks
- **`components/NavLink.jsx`** — wraps `<Link>` with active-state detection via `usePathname()`
- **Query params** replace router state: `?registered=1`, `?loggedOut=1`, `?passwordChanged=1`
- **`useSearchParams` must be wrapped in `<Suspense>`** at the route level (login, reset-password pages)

### Modal / dialog pattern

Modals use two global CSS classes from `styles/globals.css`:

- `.modal-backdrop` — `position: fixed; inset: 0` overlay with semi-transparent background; Playwright-visible (has explicit dimensions).
- `.modal` — centered card inside the backdrop.

`MobileNewActionSheet` uses `.modal-backdrop` + `.action-sheet` (fixed bottom sheet). `CompleteReminderDialog` and `DeleteConfirmDialog` use `.modal-backdrop` + `.modal`.

### Reminders feature

- **`RemindersListPage`** — two tabs: Active (upcoming/dueSoon/overdue) and History (done). Badge count polled on auth, route change, and window focus via `useReminderBadge` hook.
- **`ReminderFormPage`** — create/edit; type must be PascalCase (`Fuel`, `Maintenance`, etc.).
- **`ReminderStatusBadge`** — renders `data-testid="reminder-status-badge"` and `data-status={status}` on the **same** element. E2E selectors must use compound form: `[data-testid="reminder-status-badge"][data-status="upcoming"]` (no space).
- **`MobileNewActionSheet`** — FAB `[data-testid="bottom-tabs-add"]` in `BottomTabs` opens an action sheet offering New Expense or New Reminder.
- **Sidebar badge**: `AppShell` fetches `badgeCount`, passes to `<Sidebar>`. Badge = `dueSoon + overdue`.

### Display behavior

- Expenses list (`ExpensesListPage`) sorts by `date` descending (newest first) client-side after each fetch — insertion order from the API is ignored.

### Responsive layout

- **Breakpoint**: `≤ 640px` — targets all mobile devices (iOS 14 Pro is 390px).
- **Sidebar**: collapses from 232px → 52px, showing only icons; text labels hidden via CSS. Pure CSS — no JS state.
- **Main content**: `margin-left` and `padding` adjust at the same breakpoint via `components/AppShell.module.css`.
- **`.page` utility**: `padding` reduced to `0` and `margin` to `1rem auto` at `≤ 640px` (defined in `styles/globals.css`).
- **Tables** (`ExpensesListPage`, `DashboardPage`): wrapped in a `overflow-x: auto` div; column widths shrink at `≤ 640px` to fit ~340px.
- **KpiCard**: value `font-size` scales down from `1.875rem` → `1.375rem` at `≤ 640px`.
- **SummaryPage**: filter fields expand to `100%` width; charts grid was already collapsing to 1 column at `≤ 800px`.

### PWA

- **Config**: `next.config.mjs` — `withPWA` wrapper from `@ducanh2912/next-pwa`; `dest: 'public'`; SW disabled in dev. Dev uses Turbopack (`next dev --turbo`); prod build uses Webpack (`next build --webpack`) since Turbopack prod build is not yet stable. PWA assets (`public/sw.js`, `public/workbox-*.js`, `public/swe-worker-*.js`) are generated at webpack build time and committed; their `.map` files are gitignored.
- **Manifest**: `public/manifest.webmanifest` — name, icons, `standalone` display, dark theme/background color.
- **Service worker**: `/api/*` routes use `NetworkFirst` (5s timeout, 200-only, 1-day cache). All app assets are precached.
- **Update flow**: `components/PWAUpdater.jsx` listens for a waiting SW via `navigator.serviceWorker.ready`; shows `UpdatePrompt` → user clicks "Recarregar" → `postMessage({ type: 'SKIP_WAITING' })` + reload.
- **Icons**: static PNGs in `public/icons/` (192, 512, 512-maskable, 180 apple-touch).
- **iOS**: `app/layout.jsx` carries `apple-mobile-web-app-*` meta tags and `apple-touch-icon` link. No install banner on iOS — user must use Share → Add to Home Screen manually.

### Internationalisation (i18n)

- **Stack**: `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Supported languages**: `pt-BR` (default) and `en` — defined in `lib/constants/languages.js` and mirrored in `i18n/index.js`
- **Translation files**: `i18n/locales/{en,pt-BR}/common.json` — bundled at build time (no HTTP fetch)
- **Language detection order**: `localStorage` (`i18nextLng`) → `navigator.language`; chosen language is cached back to `localStorage`
- **Server-side preference**: the JWT payload carries `language`; `AuthContext.login()` applies it to i18next **only when no `i18nextLng` key exists in `localStorage`**, so an explicit client-side preference always wins
- **Language change via UI**: `PATCH /api/auth/language` → returns a new JWT with the updated preference; `AuthContext.updateLanguage()` also calls `i18n.changeLanguage()` immediately
- **Error message mapping**: `i18n/apiErrors.js` maps backend error strings to i18n keys; unmapped errors fall back to `errors.generic`. Add new mappings here whenever a new backend error message needs a translated string in the UI
- **Namespace**: single namespace `common`; use `t('section.key')` — e.g. `t('nav.dashboard')`, `t('errors.expenseNotFound')`
- **Date locale**: `formatDate()` and `monthLabel()` map `'en'` → `'en-US'` for `Intl.DateTimeFormat` to ensure mm/dd/yyyy. `app/layout.jsx` carries `lang="pt-BR"` on `<html>`; components update `document.documentElement.lang` on language change. `<DateField>` sets `lang` on the native input.
- **Chart translations**: `CategoryDonut` uses `categoryLabel(entry.category, t)` for legend/tooltip. `StackedMonthlyBar` sets `name={categoryLabel(cat, t)}` on each `<Bar>`. `monthLabel()` uses `i18n.language` for axis labels. `SummaryPage` month names use `Intl.DateTimeFormat` via `getMonthName(m)` — not a hardcoded array.
- **Dashboard KPIs**: the 4th card shows `fuelShare%` (annual fuel percentage) under key `dashboard.fuelShare`. Cards 2–4 carry a `subtitle` prop (current year) to clarify they are not monthly figures. `KpiCard` accepts an optional `subtitle` prop rendered below the label.

### Naming conventions

- Pages: `*Page.jsx` in `views/` (e.g. `LoginPage`, `RegisterPage`, `ChangePasswordPage`)
- Route files: `app/(group)/path/page.jsx` — thin wrappers that re-export from `views/`
- Components: PascalCase in `components/`
- Services: `*Api` object exported from `services/apiService.js`
- CSS Modules: `*.module.css` co-located with the component/page

## Linting & Formatting

- **ESLint 9** flat config at `eslint.config.mjs` — `eslint-config-next` preset (bundles React, React Hooks, Next.js, a11y rules) + `eslint-config-prettier` last to disable format-conflicting rules
- **Prettier** config at `.prettierrc.json` — `singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `printWidth: 100`
- **`globals`** package supplies per-directory environments (node, mocha, vitest, browser, playwright)

```bash
npm run lint          # ESLint check (exit 1 on error)
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier write
npm run format:check  # Prettier check (exit 1 on diff)
```

Key config decisions:
- `react/react-in-jsx-scope` off — React 19 new JSX transform
- `react/prop-types` off — project is plain JS, no PropTypes
- `no-unused-vars` warn (not error), ignored for `^_` prefix
- `@next/next/no-page-custom-font` off for `app/**` — rule targets Pages Router `_document.js` only
- `no-unused-vars` off for `**/*.ts` / `**/*.tsx` — TypeScript compiler handles it; constructor parameter properties are falsely flagged by this rule
- `react-hooks/set-state-in-effect` false positives on async functions called in effects — suppressed per-line with explanatory comment; `AuthContext` localStorage init similarly suppressed (SSR-safe only in `useEffect`)
- `frontend/**` excluded — legacy build artifacts directory

## CI Pipeline

Single workflow file `.github/workflows/ci.yml` — triggers on push/PR to `main`:

| Job                | Needs              | Description                                            |
| ------------------ | ------------------ | ------------------------------------------------------ |
| `lint`             | —                  | ESLint + Prettier check                                |
| `audit`            | —                  | `npm audit --audit-level=high --omit=dev`              |
| `test-unit`        | —                  | Node.js native test runner + mongodb-memory-server     |
| `test-integration` | `test-unit`        | Real service↔model flows, in-memory Mongo              |
| `test-api`         | `test-integration` | Mocha/Supertest against `next build && next start`     |
| `e2e`              | `test-api`         | Playwright Chromium against `next build && next start` |

- `lint`, `audit`, `test-unit` run in parallel (no `needs:`)
- `test-unit` and `test-integration` use `mongodb-memory-server` — no secrets needed
- `test-api` and `e2e` build the Next.js app and boot `next start`; require `JWT_SECRET` + `MONGODB_URI` from GitHub Secrets
- `audit` fails on high/critical advisories in prod deps only (`--omit=dev`)
- Health check endpoint: `GET /api/health`
- Supports `workflow_dispatch` for manual runs
- Dependabot configured at `.github/dependabot.yml` — weekly updates for npm and github-actions

## Visual Identity

- Primary accent: `#2DD4BF` (teal) — mapped to `--primary` in `styles/globals.css`
- Background: `#07101a` (`--bg`) / `#0f1b27` (`--surface`)
- Wordmark: "DRIVE" in `var(--text)`, "LEDGER" in `var(--primary)`; rendered via JSX in `components/Sidebar.jsx`, `views/LoginPage.jsx`, `views/RegisterPage.jsx`
- Icon: `lucide-react` `<Gauge>` component used as the logo mark throughout the app
- Tagline: "Track every kilometer."
- Favicon: `public/favicon.svg` — custom speedometer SVG, served at `/favicon.svg`
