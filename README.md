[![CI](https://github.com/rafaabc/norevify/actions/workflows/ci.yml/badge.svg)](https://github.com/rafaabc/norevify/actions/workflows/ci.yml)

# Norevify

> https://github.com/user-attachments/assets/aa83e4c7-adfd-422d-8088-3656878346d4

**Live:** `https://app.norevify.com`

## Description

Norevify is a full-stack vehicle expense management application built on **Next.js 14 App Router** — a single repo serving both the React frontend and the REST API via Route Handlers. Users can log and analyse expenses by category (fuel, maintenance, insurance, tolls, and more), set maintenance reminders triggered by date or odometer km (with optional recurrence), and view spending summaries by period.

Key features:

- **Expense tracking** — log fuel, maintenance, insurance, parking, tolls, tax, and other costs; filter by category, year, and month
- **Maintenance reminders** — status computed as `upcoming` → `dueSoon` (≤ 7 days or ≤ 500 km) → `overdue`; optional recurrence via `intervalMonths` / `intervalKm`
- **Odometer tracking** — `Fuel` expenses with an `odometer` value update the user's current km; manual override in Settings
- **Spending summaries** — totals by category and period with charts
- **Authentication** — JWT stored in `localStorage`; Google Sign-In supported; password recovery via email
- **Internationalisation** — PT-BR (default) and English; preference persisted in `localStorage` and server-side in the JWT
- **PWA** — installable on Android (Chrome) and iOS (Safari); runs fullscreen offline-first; auto-update toast on new deploy
- **Responsive layout** — fully responsive at ≤ 640 px (CSS-only); sidebar collapses to icon-only strip; tables scroll horizontally

## Dependencies

- **Node.js** v18 or higher
- **MongoDB Atlas** cluster (free tier is sufficient)

## Technologies Used

| Package | Purpose |
|---|---|
| Next.js 14 | App Router — SSR + API Route Handlers |
| React 18 | UI (`'use client'` components) |
| Mongoose | MongoDB ODM |
| jsonwebtoken / bcryptjs | JWT auth + password hashing |
| Resend | Transactional email (password recovery) |
| react-i18next / i18next | PT-BR + English i18n |
| @ducanh2912/next-pwa | Service worker + web app manifest |
| Playwright | E2E tests |
| Mocha + Supertest | API contract tests |
| Node.js test runner + c8 | Unit and integration tests + coverage |

## Installation and Setup

### 1. Clone and install

```bash
git clone https://github.com/rafaabc/norevify.git
cd norevify
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

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
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same Google client ID (exposed to browser) |

**MongoDB Atlas setup:**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Connect** → **Drivers** → **Node.js**
2. Copy the connection string and add the database name:
   ```
   mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/norevify?retryWrites=true&w=majority&appName=Cluster0
   ```
3. Paste as `MONGODB_URI` in `.env`
4. **Network Access** → add your IP (or `0.0.0.0/0`)
5. **Database Access** → create a user with `readWrite` on `norevify`

> The database is created automatically on first write.

### 3. Start the server

```bash
npm run dev      # development — http://localhost:3000
npm run build    # production build
npm start        # production server (requires build)
```

Swagger UI is available at `http://localhost:3000/api-docs`.

### 4. Run tests

Unit and integration tests use `mongodb-memory-server` — no Atlas connection needed. API and E2E tests require a running server connected to Atlas.

| Command | Scope |
|---|---|
| `npm run test:unit` | Unit — services, models, middleware |
| `npm run test:unit:coverage` | Unit + HTML coverage report |
| `npm run test:integration` | Integration — cross-layer flows |
| `npm run test:integration:coverage` | Integration + HTML coverage report |
| `npm run test:backend` | Unit + integration |
| `npm run test:api` | API contracts (server must be running) |
| `npm run test:api:report` | API tests + HTML report in `reports/` |
| `npm run test:e2e` | E2E (server must be running) |

**CI pipeline** (`.github/workflows/ci.yml`):

```
test-unit → test-integration → test-api → e2e
```

## File Structure

```
norevify/
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
├── e2e/                 # Playwright E2E tests
├── test/
│   ├── helpers/         # mongodb-memory-server helpers
│   ├── unit/            # Isolated function tests
│   ├── integration/     # Cross-layer flow tests
│   └── api/             # HTTP contract tests
└── .env.example
```

## Beta — how to join

1. Go to [https://app.norevify.com](https://app.norevify.com).
2. Create an account — you must accept the Privacy Policy and Terms of Service (checkbox required).
3. Check your inbox for a verification email and click the link. The banner disappears once verified.
4. You can now log expenses and set reminders.

> Beta is free. No payment required.

## Author

[rafaabc](https://github.com/rafaabc)

## License

MIT
