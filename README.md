[![CI](https://github.com/rafaabc/drive-ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/rafaabc/drive-ledger/actions/workflows/ci.yml)

## Live demo

`https://drive-ledger-front.vercel.app/`

> Full-stack vehicle expense manager — Next.js 14 App Router, JWT authentication, maintenance reminders with km/date triggers and recurrence, spending summaries by period, and PT-BR / English internationalisation.

> https://github.com/user-attachments/assets/aa83e4c7-adfd-422d-8088-3656878346d4

 

## Description

Drive Ledger is a full-stack vehicle expense management application built on **Next.js 14 App Router** — a single repo serving both the React frontend and the REST API via Route Handlers. Users can log and analyse expenses by category (fuel, maintenance, insurance, tolls, and more), set maintenance reminders triggered by date or odometer km (with optional recurrence), and view spending summaries by period. Authentication uses JWT stored in `localStorage`; Google Sign-In is supported. The app is a PWA installable on Android and iOS. Data is persisted in MongoDB Atlas — a free cluster is sufficient.

## Dependencies

- **Node.js** v18 or higher
- **MongoDB Atlas** cluster (any free tier cluster)

## Technologies

| Package | Purpose |
|---|---|
| Next.js 14 | App Router — SSR + API Route Handlers |
| React 18 | UI (`'use client'` components, JWT in localStorage) |
| Mongoose | MongoDB ODM |
| jsonwebtoken / bcryptjs | JWT auth + password hashing |
| Resend | Transactional email (password recovery) |
| react-i18next / i18next | PT-BR + English i18n |
| @ducanh2912/next-pwa | Service worker + web app manifest |
| Playwright | E2E tests |
| Mocha + Supertest | API contract tests |

## Installation and Setup

1. Clone and install:

```bash
git clone https://github.com/rafaabc/drive-ledger.git
cd drive-ledger
npm install
```

2. Create the environment file:

```bash
cp .env.example .env
```

Fill in the values:

| Variable | Description |
|---|---|
| `PORT` | Server port (e.g. `3000`) |
| `JWT_SECRET` | JWT signing key |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `1h`) |
| `BASE_URL` | Base URL (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | Frontend origin for password-reset links — same as `BASE_URL` locally |
| `MONGODB_URI` | MongoDB Atlas connection string (see below) |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for password-recovery emails |
| `RESET_PASSWORD_EXPIRES_IN` | Reset token lifetime (default `15m`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (server-side) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same Google client ID (client-side, exposed to browser) |

### MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Connect** → **Drivers** → **Node.js**.
2. Copy the connection string and add the database name:
   ```
   mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/drive-ledger?retryWrites=true&w=majority&appName=Cluster0
   ```
3. Paste it as `MONGODB_URI` in your `.env`.
4. In Atlas → **Network Access**, add your IP (or `0.0.0.0/0` for unrestricted access).
5. In Atlas → **Database Access**, create a user with `readWrite` on the `drive-ledger` database.

> The database is created automatically on first write.

3. Start the dev server:

```bash
npm run dev   # http://localhost:3000
```

For a production build:

```bash
npm run build
npm start
```

Swagger UI is available at `http://localhost:3000/api-docs`.

## Features

### Maintenance Reminders

Track scheduled maintenance with date- and/or km-based triggers:

- **Status**: `upcoming` → `dueSoon` (≤ 7 days or ≤ 500 km) → `overdue`
- **Recurrence**: set `intervalMonths` / `intervalKm` — completing a reminder automatically creates the next one
- **Odometer tracking**: logging a `Fuel` expense with `odometer` updates the user's current km; manual override in Settings
- **Sidebar badge**: live count of due-soon + overdue items

### Internationalisation

PT-BR (default) and English. Language persisted in `localStorage` and server-side in the JWT (`language` field). Switch via **Settings → Language**.

### PWA — Install on mobile

- **Android (Chrome)**: tap "Install app" banner or browser menu → "Add to Home Screen"
- **iOS (Safari)**: Share → "Add to Home Screen"

Runs fullscreen offline-first; a toast appears automatically when a new version is deployed.

### Mobile responsiveness

Fully responsive at **≤ 640 px** (CSS-only):

- Sidebar collapses to a 52 px icon-only strip
- Tables become horizontally scrollable
- KPI card values and page titles scale down

## API Endpoints

**Auth** — no JWT required

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive a JWT |
| PATCH | `/api/auth/password` | Change password |
| POST | `/api/auth/forgot-password` | Send password-reset email |
| POST | `/api/auth/reset-password` | Reset password via token |
| POST | `/api/auth/google` | Sign in / register via Google |

**Auth** — `Authorization: Bearer <token>` required

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/auth/currency` | Update currency preference |
| PATCH | `/api/auth/language` | Update language preference |
| PATCH | `/api/auth/odometer` | Manual odometer override |
| POST | `/api/auth/google/link` | Link Google account |
| DELETE | `/api/auth/google/link` | Unlink Google account |
| GET | `/api/auth/providers` | Returns `{ authProviders, hasPassword }` |

**Expenses** — JWT required

| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses` | List (`?category`, `?year`, `?month`) |
| POST | `/api/expenses` | Create |
| GET | `/api/expenses/:id` | Get |
| PUT | `/api/expenses/:id` | Update |
| DELETE | `/api/expenses/:id` | Delete |
| GET | `/api/expenses/summary` | Totals by category (`?year` required) |

**Reminders** — JWT required

| Method | Path | Description |
|---|---|---|
| GET | `/api/reminders` | List (`?status=active\|done`) |
| POST | `/api/reminders` | Create |
| GET | `/api/reminders/:id` | Get |
| PUT | `/api/reminders/:id` | Update |
| POST | `/api/reminders/:id/complete` | Complete (creates recurrence if configured) |
| DELETE | `/api/reminders/:id` | Delete |
| GET | `/api/reminders/badge-count` | Returns `{ dueSoon, overdue }` |

## Test Commands

| Command | Scope | Runner |
|---|---|---|
| `npm run test:unit` | Unit — services, models, middleware | Node.js native |
| `npm run test:unit:coverage` | Unit + HTML coverage report | Node.js native + c8 |
| `npm run test:integration` | Integration — cross-layer flows | Node.js native |
| `npm run test:integration:coverage` | Integration + HTML coverage report | Node.js native + c8 |
| `npm run test:backend` | Unit + integration | Node.js native |
| `npm run test:api` | API contracts (server must be running) | Mocha + Supertest |
| `npm run test:api:report` | API tests + HTML report in `reports/` | Mochawesome |
| `npm run test:e2e` | E2E (server must be running) | Playwright |

Unit and integration tests use `mongodb-memory-server` — no Atlas connection needed. API and E2E tests require a running server connected to Atlas.

## CI Pipeline

Single workflow (`.github/workflows/ci.yml`) — triggers on push/PR to `main`:

```
test-unit → test-integration → test-api → e2e
```

All jobs run against `next build && next start`. Unit and integration jobs need no secrets; API and E2E jobs use `JWT_SECRET` and `MONGODB_URI` from GitHub Secrets.

## File Structure

```
drive-ledger/
├── app/
│   ├── (auth)/          # Public pages (login, register, forgot/reset password)
│   ├── (app)/           # Protected pages (auth guard in layout.jsx)
│   └── api/             # Route Handlers — replaces Express routes
├── lib/
│   ├── db.mjs           # Mongoose connection with globalThis cache
│   ├── auth.mjs         # withAuth() HOF
│   ├── models/          # Mongoose schemas
│   ├── services/        # Business logic and validation
│   └── constants/       # Shared enums (languages, categories)
├── components/          # React components
├── views/               # Page-level React components
├── context/             # React context providers (AuthContext)
├── hooks/               # Custom React hooks
├── services/            # Client-side HTTP layer (apiService.js)
├── i18n/                # i18next config + locale JSON files
├── styles/              # CSS Modules + globals.css
├── e2e/                 # Playwright tests
├── test/
│   ├── helpers/         # mongodb-memory-server helpers
│   ├── unit/            # Isolated function tests
│   ├── integration/     # Cross-layer flow tests
│   └── api/             # HTTP contract tests
└── .env.example
```

## Author

[rafaabc](https://github.com/rafaabc)

## License

MIT
