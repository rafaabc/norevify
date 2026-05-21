# Email Setup — noreply@norevify.com via Resend

## Overview

| Component | Value |
|---|---|
| Provider | [Resend](https://resend.com) |
| From address | `noreply@norevify.com` |
| Domain to verify | `norevify.com` |
| Env var | `EMAIL_FROM=noreply@norevify.com` |

Without domain verification, Resend sends from `onboarding@resend.dev` (fallback in code). Email may land in spam and SPF/DKIM will fail.

---

## Step 1 — Add domain on Resend

1. [Resend Dashboard](https://resend.com) → **Domains** → **Add Domain**.
2. Enter `norevify.com` → **Add**.
3. Resend shows DNS records — **copy all values before closing the modal**. You will need:
   - SPF TXT record
   - 3 DKIM CNAME records (`resend._domainkey`, plus two more)
   - DMARC TXT record (optional but recommended)

---

## Step 2 — Create DNS records on Hostinger

Open **hPanel** → **Domains** → `norevify.com` → **DNS / Nameservers**.

Replace `<value from Resend>` with the exact strings shown in the Resend dashboard.

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` | 3600 |
| CNAME | `resend._domainkey` | `<DKIM value from Resend>` | 3600 |
| CNAME | `<dkim2 name from Resend>` | `<DKIM2 value from Resend>` | 3600 |
| CNAME | `<dkim3 name from Resend>` | `<DKIM3 value from Resend>` | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:noreply@norevify.com` | 3600 |

> The DMARC record is not required by Resend for domain verification but is required for GDPR/LGPD compliance and deliverability.

---

## Step 3 — Set environment variable on Vercel

Vercel Dashboard → your project → **Settings** → **Environment Variables** → set for **Production**:

| Variable | Value |
|---|---|
| `EMAIL_FROM` | `noreply@norevify.com` |

Also set in your local `.env` for integration tests that send real emails.

---

## Step 4 — Wait for Resend verification

Resend polls DNS every few minutes. The domain status changes from **Pending** to **Verified** when all records are found (usually < 1 h; up to 24 h on slow registrars).

---

## Step 5 — Test email delivery

After verification, send a test email:

```bash
# Using curl against your running server
curl -X POST https://app.norevify.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-real-email@example.com"}'
```

Check:
- Email arrives from `noreply@norevify.com` (not `onboarding@resend.dev`).
- Not in spam.
- SPF / DKIM headers show `pass` (Gmail: view original → check Authentication-Results).

---

## Verify propagation

```bash
# SPF
nslookup -type=TXT norevify.com

# DKIM (replace with actual selector from Resend)
nslookup -type=CNAME resend._domainkey.norevify.com

# DMARC
nslookup -type=TXT _dmarc.norevify.com
```

Or use [dnschecker.org](https://dnschecker.org) for multi-region view.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Domain stays "Pending" on Resend | DNS not propagated | Wait up to 24 h; check with `nslookup` |
| Email arrives from `onboarding@resend.dev` | `EMAIL_FROM` env not set / not redeployed | Complete Step 3 and trigger redeploy |
| Email lands in spam | SPF/DKIM not yet verified | Complete domain verification first |
| DKIM check fails in Gmail headers | CNAME typo | Re-check exact name/value from Resend dashboard |
