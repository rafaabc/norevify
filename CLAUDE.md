# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start production
npm start

# Start with hot reload
npm run dev

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
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/drive-ledger?retryWrites=true&w=majority&appName=Cluster0
RESEND_API_KEY=re_xxxxxxxxxxxx
RESET_PASSWORD_EXPIRES_IN=15m
```

`MONGODB_URI` points to the `drive-ledger` database on the shared Atlas `Cluster0`. The database is created automatically on first write.

`FRONTEND_URL` is used to build the password-reset link included in recovery emails — set to the frontend origin. `RESEND_API_KEY` authenticates with the [Resend](https://resend.com) email API. `RESET_PASSWORD_EXPIRES_IN` controls reset-token lifetime (default `15m`).

## Architecture

Layered Express.js REST API backed by **MongoDB Atlas via Mongoose** (data persists across restarts).

```
routes → controllers → services → models (Mongoose)
                                        ↕
                                   MongoDB Atlas
```

- **`src/config/db.js`**: `connectDB()` — called once at boot in `server.js` before `app.listen`
- **routes**: wire HTTP verbs to controller functions; `expenses.routes.js` applies `authMiddleware` globally
- **controllers**: async try/catch wrappers that map service results to HTTP responses
- **services**: all business logic and validation; throw errors with `.status` property (picked up by controllers)
- **models**: Mongoose schemas + compiled models; export thin async wrappers (`findById`, `findByUserId`, `create`, `update`, `remove`, `_reset`, `updatePassword`) so services stay decoupled from the ODM API

Error convention: `makeError(status, message)` in each service creates an `Error` with a `.status` field. Controllers read `err.status || 500`.

IDs are MongoDB `ObjectId` values, exposed as 24-character hex strings. JWT payload carries `{ id: string, username: string }`.

## Unit Tests

- Framework: Node.js native Test Runner (`node:test`) + `node:assert`
- No external test libraries (no Mocha, Jest, Chai, Supertest)
- Test files live in `test/unit/`, mirroring the source structure
- Database isolation via `mongodb-memory-server` (no Atlas connection needed)

### Test layers covered
- `services/` — business logic and validation
- `models/` — Mongoose schema behaviour and CRUD
- `middleware/` — JWT auth logic
- `controllers/` — HTTP status code mapping and `err.status || 500` fallback

### Scripts
- `npm run test:unit` — run all unit tests
- `npm run test:unit:coverage` — run tests with c8 code coverage (HTML report in `coverage/`)

### Conventions
- Pattern: AAA (Arrange, Act, Assert)
- Test naming: `should <behavior> when <condition>`
- Each test file boots an in-memory Mongo via `test/helpers/mongo.js`:
  - `before(async () => startMongo())` / `after(async () => stopMongo())`
  - `beforeEach(async () => resetMongo())` — calls `deleteMany({})` on both collections
- No HTTP/endpoint tests here — those belong to the API test layer

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
- **Requires a running server connected to Atlas** — start with `npm run dev` before executing the suite
- Test files live in `test/api/`, organized by feature (auth, expenses, summary)

### Structure
- `test/api/base/api-base.js` — shared base: exports `request`, `expect`, `BASE_URL`, `CATEGORIES`, `authHeader()`, `createAndLoginUser(prefix)`
- `test/api/hooks/auth.js` — root `before` hook: registers and logs in a primary user; exports `getToken()`, `getUser()`, `uniqueUsername(prefix)`
- `test/api/fixtures/` — JSON test data per feature (data-driven testing)

### Scripts
- `npm run test:api` — run all API tests (spec reporter)
- `npm run test:api:report` — run tests and generate HTML report in `reports/`

### Conventions
- Pattern: AAA (Arrange, Act, Assert)
- Test naming: `[TC-XX-YY] should <behavior> when <condition>`
- All tests run against a live server; `BASE_URL` read from `.env` (defaults to `http://localhost:3000`)
- Root hook registers and logs in a primary user once before the suite; tests that need extra users call `createAndLoginUser(prefix)` from the base

## Frontend Unit Tests

- Framework: Jest + jsdom (`jest-environment-jsdom`), Babel transform for JSX/ESM
- React testing: `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`
- `import.meta.env` is shimmed to `process.env` via an inline Babel plugin in `babel.config.cjs`
- CSS Modules stubbed via `identity-obj-proxy`; coverage via `c8`
- Test files live in `frontend/test/`, mirroring `frontend/src/`

### Scripts (run from `frontend/`)
- `npm run test:front` — run all unit tests
- `npm run test:front:watch` — watch mode
- `npm run test:front:coverage` — c8 coverage (HTML report in `frontend/coverage/`)

### Test files added (responsive + PWA coverage)
- `test/components/UpdatePrompt.test.jsx` — render and click behaviour
- `test/components/AppShell.test.jsx` — Sidebar + Outlet integration
- `test/components/Sidebar.test.jsx` — nav links, logout, username, brand
- `test/App.test.jsx` — `pwa:update-available` event wiring, `updateSW(true)` call, listener cleanup on unmount

### Conventions
- Pattern: AAA (Arrange, Act, Assert)
- No real HTTP calls — `global.fetch` is mocked in service tests; `apiService` is mocked at module level in component/page tests
- `localStorage` cleared in `beforeEach` via `jest.setup.js`
- Fake timers (`jest.useFakeTimers`) used for date-sensitive tests
- CSS Modules not testable in jsdom — responsive breakpoints are covered by E2E (`e2e/tests/ui/sidebar-responsive.spec.ts`)

## E2E Tests

- Framework: Playwright (`@playwright/test` v1.47+)
- **Requires both servers running** — backend on `:3000`, frontend dev server on `:5173`
- Test files live in `frontend/e2e/tests/`, organised by feature
- Page Objects in `frontend/e2e/pages/`; shared fixtures in `frontend/e2e/fixtures/`

### Scripts (run from `frontend/`)
- `npm run test:e2e` — run all E2E tests (Chromium)

### Atlas cleanup — globalTeardown
Every user created via `createAndLoginUser()` during a run is tracked in `e2e/.test-user-ids.json` (gitignored). After all tests finish, `e2e/global-teardown.ts` opens a direct Mongoose connection to Atlas, deletes those users and their expenses, then removes the file. IDs accumulate across crashed runs — the next successful teardown cleans everything.

### Conventions
- Pattern: Page Object Model — each page is a class in `e2e/pages/`
- Test naming: `[TC-XX-YY] should <behavior> when <condition>`
- `createAndLoginUser(request, prefix)` — registers + logs in a fresh user, tracks the ID for teardown, returns `{ username, token }`
- `createExpenseViaApi(request, token, data)` — creates an expense via API, returns the response body

## API

Swagger UI at `GET /api-docs` (served from `resources/swagger.json`). Also logged to console on startup.

| Prefix | Auth required | Description |
|---|---|---|
| `/api/auth` | No | `POST /register`, `POST /login`, `PATCH /password`, `POST /forgot-password`, `POST /reset-password` |
| `/api/expenses` | Yes (Bearer JWT) | CRUD + `GET /summary` |

Auth: `Authorization: Bearer <token>` header. JWT decoded into `req.user` (`{ id, username }`). `id` is an ObjectId hex string.

## Expense domain rules

Valid categories: `Fuel`, `Maintenance`, `Insurance`, `Parking`, `Toll`, `Tax`, `Other`.

- **Fuel**: requires `litres` and `price_per_litre` (both positive numbers); `amount` is auto-computed as `litres * price_per_litre` (rounded to 2 decimals). Passing `amount` → 400 error.
- **Non-Fuel**: requires `amount` (positive number). Do not pass `litres` or `price_per_litre`.
- **PATCH/PUT Fuel**: `amount` is ignored in the merge — only `litres`/`price_per_litre` can change the computed amount.
- `date` must not be in the future.

`GET /api/expenses` supports `?category=`, `?year=`, `?month=` filters.  
`GET /api/expenses/summary` requires `?year=` (must not be in the future); optional `?month=` and `?category=`.

## Frontend

Location: `frontend/` at the project root.

### Stack

- **React 18** + **Vite 5** — dev server on `:5173`, proxies `/api/*` to backend `:3000` (no CORS package needed)
- **react-router-dom v6** — client-side routing with `<ProtectedRoute>`
- **Plain CSS Modules** — scoped per component/page; global base in `src/styles/globals.css`
- **vite-plugin-pwa** — generates `sw.js` + `manifest.webmanifest` at build time; SW disabled in dev mode by default

### Commands

```bash
cd frontend
npm install
npm run dev      # dev server on :5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

### HTTP layer

All HTTP calls go through `src/services/apiService.js` — never call `fetch()` directly in components.

```js
// Auth
authApi.register({ username, password })
authApi.login({ username, password })          // returns { token }

// Expenses
expensesApi.list({ category, year, month })
expensesApi.get(id)
expensesApi.create(data)
expensesApi.update(id, data)
expensesApi.remove(id)
expensesApi.summary({ year, month, category })
```

To add a new endpoint: export a new function from `apiService.js` that calls the internal `request()` helper. Do not add `fetch()` calls elsewhere.

### Auth

- JWT stored in `localStorage` key `'token'`.
- `AuthContext` (`src/context/AuthContext.jsx`) exposes `{ token, isAuthed, username, login, logout }`.
- `username` is decoded from the JWT payload client-side — avoids a separate `/me` endpoint.
- `ProtectedRoute` (`src/routes/ProtectedRoute.jsx`) redirects to `/login` if `!isAuthed`.
- 401/403 responses clear the token and dispatch a `window` `'auth:logout'` event; `AuthContext` listens and redirects to `/login` with a "Session expired" banner.
- Register does not auto-login — on success, navigates to `/login` with `state.justRegistered`.

### Display behavior

- Expenses list (`ExpensesListPage`) sorts by `date` descending (newest first) client-side after each fetch — insertion order from the API is ignored.

### Responsive layout

- **Breakpoint**: `≤ 640px` — targets all mobile devices (iOS 14 Pro is 390px).
- **Sidebar**: collapses from 232px → 52px, showing only icons; text labels hidden via CSS. Pure CSS — no JS state.
- **Main content**: `margin-left` and `padding` adjust at the same breakpoint via `AppShell.module.css`.
- **`.page` utility**: `padding` reduced to `0` and `margin` to `1rem auto` at `≤ 640px` (defined in `globals.css`).
- **Tables** (`ExpensesListPage`, `DashboardPage`): wrapped in a `overflow-x: auto` div; column widths shrink at `≤ 640px` to fit ~340px.
- **KpiCard**: value `font-size` scales down from `1.875rem` → `1.375rem` at `≤ 640px`.
- **SummaryPage**: filter fields expand to `100%` width; charts grid was already collapsing to 1 column at `≤ 800px`.

### PWA

- **Manifest**: configured in `vite.config.js` under `VitePWA({ manifest })` — name, icons, `standalone` display, dark theme/background color.
- **Service worker**: `registerType: 'autoUpdate'`. `/api/*` routes use `NetworkFirst` (5s timeout, 200-only, 1-day cache). All app assets are precached.
- **Update flow**: SW dispatches `pwa:update-available` custom event → `App.jsx` shows `<UpdatePrompt>` toast → user clicks "Recarregar" → `updateSW(true)` skips waiting and reloads.
- **Icons**: static PNGs in `frontend/public/icons/` (192, 512, 512-maskable, 180 apple-touch). Were generated via Playwright/Chromium from `favicon.svg`; regenerate with `node generate-icons.mjs` if the icon changes (script not committed — recreate from plan if needed).
- **iOS**: `index.html` carries `apple-mobile-web-app-*` meta tags and `apple-touch-icon` link. No install banner on iOS — user must use Share → Add to Home Screen manually.

### Naming conventions

- Pages: `*Page.jsx` in `src/pages/` (e.g. `LoginPage`, `RegisterPage`, `ChangePasswordPage`)
- Components: PascalCase in `src/components/`
- Services: `*Api` object exported from `src/services/apiService.js`
- CSS Modules: `*.module.css` co-located with the component/page

## CI Pipelines

Two separate workflow files under `.github/workflows/`:

| Workflow | Triggers on | Chain |
|---|---|---|
| `backend.yml` | `src/**`, `test/**`, `package*.json` | test-unit → test-integration → test-api |
| `frontend.yml` | `frontend/**` | test-unit → e2e |

- `test-unit` and `test-integration` use `mongodb-memory-server` — no secrets needed
- `test-api` and `e2e` boot the real server and require `JWT_SECRET` + `MONGODB_URI` from GitHub Secrets
- Both workflows support `workflow_dispatch` for manual runs

## Visual Identity

- Primary accent: `#2DD4BF` (teal) — mapped to `--primary` in `globals.css`
- Background: `#07101a` (`--bg`) / `#0f1b27` (`--surface`)
- Wordmark: "DRIVE" in `var(--text)`, "LEDGER" in `var(--primary)`; rendered via JSX in `Sidebar.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`
- Icon: `lucide-react` `<Gauge>` component used as the logo mark throughout the app
- Tagline: "Track every kilometer."
- Favicon: `frontend/public/favicon.svg` — custom speedometer SVG, served at `/favicon.svg`
