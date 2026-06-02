[![CI](https://github.com/rafaabc/norevify/actions/workflows/ci.yml/badge.svg)](https://github.com/rafaabc/norevify/actions/workflows/ci.yml)

# Norevify

**Live:** https://app.norevify.com

## Description

Norevify is a full-stack vehicle expense management application built on **Next.js App Router** — a single repo serving both the React frontend and the REST API via Route Handlers.

Users can log and analyse expenses by category (fuel, maintenance, insurance, tolls, and more), set maintenance reminders triggered by date or odometer km (with optional recurrence), and view spending summaries by period.

---

## Key Features

### Expense Tracking

* Log fuel, maintenance, insurance, parking, tolls, tax, and other costs
* Filter by category, year, and month

### Maintenance Reminders

* Status computed as:
  `upcoming → dueSoon (≤ 7 days or ≤ 500 km) → overdue`
* Optional recurrence via `intervalMonths` / `intervalKm`

### Odometer Tracking

* Fuel expenses with an odometer value update the user's current km
* Manual override available in Settings

### Spending Summaries

* Totals by category and period
* Charts for visualization

### Authentication

* JWT stored in `localStorage`
* Google Sign-In supported
* Password recovery via email

### Internationalisation

* PT-BR (default) and English
* Preference stored in `localStorage` and JWT

### PWA Support

* Installable on Android (Chrome) and iOS (Safari)
* Fullscreen, offline-first
* Auto-update toast on new deploy

### Responsive Layout

* Fully responsive at ≤ 640px (CSS-only)
* Sidebar collapses to icon-only
* Tables scroll horizontally

---

## Dependencies

* Node.js 18 or newer
* MongoDB (self-hosted or managed)

---

## Technologies Used

* Next.js & React
* Mongoose (MongoDB ODM)
* jsonwebtoken & bcryptjs
* react-i18next & i18next
* @ducanh2912/next-pwa
* Playwright (E2E Testing)
* Vitest (Frontend Testing)
* Mocha & Supertest (API Testing)
* Node.js test runner & c8
* Sentry & PostHog (Monitoring & Analytics)

---

## Installation and Setup

### 1. Clone and Install

```bash
git clone https://github.com/rafaabc/norevify.git
cd norevify
npm install
```

---

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill the required values.

⚠️ Do not commit secrets or credentials.

#### Common variables:

```
PORT                         # Server port (e.g. 3000)
JWT_SECRET                   # JWT signing key
JWT_EXPIRES_IN               # Token expiry (e.g. 1h)
BASE_URL / FRONTEND_URL      # Used in emails/links
MONGODB_URI                  # MongoDB connection string
RESEND_API_KEY               # Email provider API key
RESET_PASSWORD_EXPIRES_IN    # Reset token lifetime (default 15m)
GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

For local development, you can:

* Run a local MongoDB instance
* Use a managed cloud database

---

### 3. Start the Server

```bash
npm run dev      # Development (Turbo) → http://localhost:3000
npm run build    # Production build
npm start        # Production server
```

📄 Swagger UI available at:
`http://localhost:3000/api-docs`

---

### 4. Run Tests

Backend tests use in-memory MongoDB.
Frontend tests use Vitest.
API and E2E require a running server.

| Command                             | Scope                              |
| ----------------------------------- | ---------------------------------- |
| `npm run test:unit`                 | Frontend + Backend unit tests      |
| `npm run test:unit:backend`         | Backend unit tests                 |
| `npm run test:unit:frontend`        | Frontend unit tests                |
| `npm run test:unit:coverage`        | Coverage report                    |
| `npm run test:integration`          | Integration tests                  |
| `npm run test:integration:coverage` | Integration + HTML report          |
| `npm run test:backend`              | Backend unit + integration         |
| `npm run test:api`                  | API tests *(server required)*      |
| `npm run test:api:report`           | API + HTML report                  |
| `npm run test:e2e`                  | Playwright E2E *(server required)* |

### CI Pipeline

```
test-unit → test-integration → test-api → e2e
```

---

## File Structure

```
norevify/
├── app/
│   ├── (auth)/          # Public pages
│   ├── (app)/           # Protected pages
│   └── api/             # Route Handlers
├── lib/
│   ├── db.mjs           # DB connection
│   ├── auth.mjs         # Auth helper
│   ├── models/          # Schemas
│   ├── services/        # Business logic
│   └── constants/       # Shared enums
├── components/          # UI components
├── views/               # Page components
├── context/             # React context
├── hooks/               # Custom hooks
├── services/            # Client API layer
├── i18n/                # Localization
├── styles/              # CSS
├── e2e/                 # E2E tests
├── test/
│   ├── helpers/
│   ├── unit/
│   ├── integration/
│   └── api/
└── .env.example
```

---

## Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the issues page.

---

## Author

**rafaabc**

---

## License

MIT
