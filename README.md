[![Backend CI](https://github.com/rafaabc/drive-ledger/actions/workflows/backend.yml/badge.svg)](https://github.com/rafaabc/drive-ledger/actions/workflows/backend.yml)
[![Frontend CI](https://github.com/rafaabc/drive-ledger/actions/workflows/frontend.yml/badge.svg)](https://github.com/rafaabc/drive-ledger/actions/workflows/frontend.yml)

## Live demo

`https://drive-ledger-front.vercel.app/`

> Full-stack vehicle expense manager — Node.js/Express REST API with a React PWA, JWT authentication, and spending summaries by period.

> https://github.com/user-attachments/assets/aa83e4c7-adfd-422d-8088-3656878346d4

 

## Description

Drive Ledger is a full-stack vehicle expense management application. The backend is a Node.js/Express REST API that lets users log and analyze expenses by category (fuel, maintenance, insurance, tolls, and more), with JWT-based authentication and user isolation. The frontend is a React PWA (Vite) that consumes the API and can be installed on Android and iOS directly from the browser. Data is persisted in MongoDB Atlas — a free cluster is sufficient.

## Dependencies

- **Node.js** v18 or higher
- **MongoDB Atlas** cluster (any free tier cluster)

## Technologies Used

**Backend**

| Package | Version | Purpose |
|---|---|---|
| express | ^5.2.1 | HTTP framework |
| jsonwebtoken | ^9.0.3 | JWT auth |
| bcryptjs | ^3.0.3 | Password hashing |
| mongoose | ^8.x | MongoDB ODM |
| resend | ^4.x | Transactional email (password recovery) |
| dotenv | ^17.4.2 | Environment variables |
| swagger-ui-express | ^5.0.1 | API docs |

**Frontend**

| Package | Version | Purpose |
|---|---|---|
| react | ^18.3.1 | UI framework |
| react-router-dom | ^6.26.2 | Client-side routing |
| vite | ^5.4.8 | Dev server and bundler |
| vite-plugin-pwa | ^1.3.0 | Service worker + web app manifest (PWA) |

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
| `BASE_URL` | Base URL for API tests (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | Frontend origin used in password-reset email links (e.g. `http://localhost:5173`) |
| `MONGODB_URI` | MongoDB Atlas connection string (see below) |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for sending password-recovery emails |
| `RESET_PASSWORD_EXPIRES_IN` | Reset token lifetime (default `15m`) |

### MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Connect** → **Drivers** → **Node.js**.
2. Copy the connection string and add the database name before the query string:
   ```
   mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/drive-ledger?retryWrites=true&w=majority&appName=Cluster0
   ```
3. Paste it as `MONGODB_URI` in your `.env`.
4. In Atlas → **Network Access**, add your current IP (or `0.0.0.0/0` for unrestricted access).
5. In Atlas → **Database Access**, create a dedicated user with `readWrite` on the `drive-ledger` database.

> The `drive-ledger` database is created automatically on the first write — no manual setup needed.

3. Start the backend:

```bash
npm run dev   # development (hot reload)
npm start     # production
```

Output on startup:
```
MongoDB connected
Server running on port 3000
Swagger UI: http://localhost:3000/api-docs
```

4. Install and start the frontend:

```bash
cd frontend
npm install
npm run dev   # available at http://localhost:5173
```

> The backend must be running on port 3000 before starting the frontend. Vite proxies `/api/*` to port 3000 automatically.

## Features

### PWA — Install on mobile

The app is a Progressive Web App. No app store required.

- **Android (Chrome)**: open the app → tap "Install app" banner (or browser menu → "Add to Home Screen").
- **iOS (Safari)**: open the app → Share → "Add to Home Screen".

Once installed, the app runs fullscreen (no browser chrome) and loads offline from cache. A "Nova versão disponível" toast appears automatically when a new version is deployed.

### Mobile responsiveness

The layout is fully responsive at **≤ 640 px** (CSS-only, no JS):

- Sidebar collapses from 232 px to a 52 px icon-only strip.
- Tables become horizontally scrollable; column widths are reduced to fit ~340 px of content.
- KPI card values and page titles scale down for smaller viewports.
- Summary page filter fields expand to full width.

### API Endpoints

**Auth** — no JWT required

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive a JWT |
| PATCH | `/api/auth/password` | Change password (requires current password) |
| POST | `/api/auth/forgot-password` | Send a password-reset email (safe — never reveals account existence) |
| POST | `/api/auth/reset-password` | Reset password via token from email |

**Expenses** — `Authorization: Bearer <token>` required

| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses` | List expenses (`?category`, `?year`, `?month`) |
| POST | `/api/expenses` | Create an expense |
| GET | `/api/expenses/:id` | Get an expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/expenses/summary` | Totals by category (`?year` required) |

Swagger UI available at `http://localhost:3000/api-docs`. For validation rules, see [Expense Domain Rules](https://github.com/rafaabc/drive-ledger/wiki/03-%E2%80%90-Expense-Domain-Rules) in the wiki.

### Test Commands

**Backend** (from project root)

| Command | Scope | Runner |
|---|---|---|
| `npm run test:unit` | Unit — services, models, middleware | Node.js native |
| `npm run test:unit:coverage` | Unit tests + HTML coverage report | Node.js native + c8 |
| `npm run test:integration` | Integration — cross-layer flows | Node.js native |
| `npm run test:integration:coverage` | Integration tests + HTML coverage report | Node.js native + c8 |
| `npm run test:backend` | Unit + integration | Node.js native |
| `npm run test:api` | API contracts (server must be running) | Mocha + Supertest |
| `npm run test:api:report` | API tests + HTML report in `reports/` | Mochawesome |

**Frontend** (from `frontend/`)

| Command | Scope | Runner |
|---|---|---|
| `npm run test:front` | Frontend unit tests | Jest + Testing Library |
| `npm run test:front:coverage` | Frontend unit tests + HTML coverage report | Jest + c8 |
| `npm run test:e2e` | E2E (both servers must be running) | Playwright |

### CI Pipelines

| Workflow | Triggers on | Jobs |
|---|---|---|
| `backend.yml` | `src/**`, `test/**`, `package*.json` | test-unit → test-integration → test-api |
| `frontend.yml` | `frontend/**` | test-unit → e2e |

Unit and integration jobs use `mongodb-memory-server` — no Atlas connection needed. API and E2E jobs connect to Atlas via `MONGODB_URI` secret.

## File Structure

```
drive-ledger/
├── frontend/
│   ├── src/             # React app source
│   ├── test/            # Frontend unit tests
│   └── e2e/             # Playwright E2E tests
├── src/
│   ├── config/          # db.js — MongoDB connection
│   ├── routes/          # HTTP route definitions
│   ├── controllers/     # HTTP response mapping
│   ├── services/        # Business logic and validation
│   ├── models/          # Mongoose schemas and models
│   ├── middleware/       # JWT auth middleware
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point
├── test/
│   ├── helpers/         # mongo.js — mongodb-memory-server helpers
│   ├── unit/            # Isolated function tests
│   ├── integration/     # Cross-layer flow tests
│   └── api/             # HTTP contract tests
├── resources/
│   └── swagger.json     # OpenAPI 3.0 spec
└── .env.example
```

## Author

[rafaabc](https://github.com/rafaabc)

## License

MIT
