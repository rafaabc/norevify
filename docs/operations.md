# Operations — Drive Ledger

## Database (MongoDB Atlas M0)

### Automatic backups
Atlas M0 (free tier) takes **one snapshot per day** with a **2-day retention window**. Snapshots are accessible under:

> Atlas → your cluster → **Backup** tab

You cannot restore individual collections on M0 — only full cluster restores via Atlas support.

### Manual export (weekly recommended)
Run from a machine with `mongodump` installed:

```bash
mongodump \
  --uri "mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/drive-ledger" \
  --out backup/$(date +%Y-%m-%d)
```

Store the resulting BSON dump off-cluster (local drive or cloud storage). Compress with `tar czf`:

```bash
tar czf backup-$(date +%Y-%m-%d).tar.gz backup/$(date +%Y-%m-%d)
```

### Restore from dump
```bash
mongorestore \
  --uri "mongodb+srv://<USER>:<PASS>@cluster0.xxxxx.mongodb.net/drive-ledger" \
  --drop \
  backup/2026-05-21/
```

---

## Logs (Vercel Functions)

Vercel Dashboard → your project → **Logs** tab.

- Filter by **Function** to isolate API route logs.
- Structured logs are emitted via `pino` — search by `requestId` to trace a single request.
- Logs are retained for **1 day** on the free Hobby plan.

For longer retention, forward logs via Vercel's **Log Drains** integration (Hobby plan: not available — upgrade to Pro or export manually).

---

## Error monitoring (Sentry)

Sentry is configured to capture only `err.status >= 500` (server errors). 4xx client errors are intentionally excluded.

- [Sentry Dashboard](https://sentry.io) → your project → **Issues** for alerts.
- Set up **email alerts** for new 5xx events: Sentry → Alerts → Create Alert Rule → "A new issue is created" with filter `level:error`.
- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` must be set on Vercel for production capture.

---

## Rate limiting

In-memory rate limit store (`lib/middleware/rateLimit.js`) uses `globalThis._rateLimit`. State is per-instance; Fluid Compute may reuse or spin new instances. Limits reset on cold start.

Current limits:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 10 req / 15 min per IP |
| `POST /api/auth/register` | 5 req / h per IP |
| `POST /api/auth/forgot-password` | 3 req / h per IP |
| `POST /api/auth/google` | 10 req / 15 min per IP |
| `POST /api/auth/resend-verification` | 3 req / h per IP |

---

## Monthly checklist

- [ ] Check Sentry for recurring 5xx patterns.
- [ ] Review Atlas slow query logs (Atlas → Performance Advisor).
- [ ] Verify Resend domain status is still **Verified**.
- [ ] Rotate `JWT_SECRET` if any breach is suspected (invalidates all sessions — users must re-login).
- [ ] Manual `mongodump` export and verify archive integrity.
- [ ] Check Atlas M0 storage usage (free tier limit: 512 MB).
- [ ] Review Vercel Function invocation count and execution time (avoid unexpected billing if upgraded).

---

## Dependency updates

```bash
npm outdated          # list outdated packages
npx npm-check-updates # interactive update (review before applying)
```

Run the full test suite after any update:

```bash
npm run test:unit && npm run test:integration
```

---

## Secrets rotation

| Secret | Steps |
|---|---|
| `JWT_SECRET` | Generate new value → update Vercel env → redeploy. All active sessions are invalidated. |
| `RESEND_API_KEY` | Resend Dashboard → API Keys → Create new → update Vercel env → delete old key. |
| `MONGODB_URI` password | Atlas → Database Access → Edit user → new password → update URI in Vercel env. |
| `GOOGLE_CLIENT_ID` | Only rotate if credentials are leaked — regenerate in Google Cloud Console. |
