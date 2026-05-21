# Domain Setup — app.norevify.com

## Overview

| Component | Value |
|---|---|
| Registrar | Hostinger |
| Apex domain | `norevify.com` (reserved for future landing page) |
| App subdomain | `app.norevify.com` → Vercel Fluid Compute |
| DNS provider | Hostinger hPanel (or active nameserver if different) |

---

## Step 1 — Add domain on Vercel

1. Vercel Dashboard → your project → **Settings** → **Domains** → **Add**.
2. Enter `app.norevify.com` → **Add**.
3. Vercel shows the CNAME target — it will be `cname.vercel-dns.com`.

---

## Step 2 — Create DNS records on Hostinger

Open **hPanel** → **Domains** → `norevify.com` → **DNS / Nameservers**.

> **If Hostinger shows nameservers outside Hostinger** (e.g. Cloudflare), create the records in the active nameserver's dashboard, not here.

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `app` | `cname.vercel-dns.com` | 3600 |

---

## Step 3 — Update environment variables on Vercel

Vercel Dashboard → your project → **Settings** → **Environment Variables** → set for **Production**:

| Variable | Value |
|---|---|
| `BASE_URL` | `https://app.norevify.com` |
| `FRONTEND_URL` | `https://app.norevify.com` |

Trigger a redeploy after saving so the new values take effect.

---

## Step 4 — Add origin to Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials** → your OAuth 2.0 Client ID.
2. Under **Authorized JavaScript origins**, add:
   ```
   https://app.norevify.com
   ```
3. **Save**. Changes propagate within minutes.

---

## Step 5 — Verify propagation

```bash
# CNAME should resolve to cname.vercel-dns.com
nslookup -type=CNAME app.norevify.com
```

Or use [dnschecker.org](https://dnschecker.org) to check multiple regions.

**Vercel dashboard**: the domain turns green with a valid TLS certificate (auto-provisioned via Let's Encrypt).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Domain still red on Vercel | DNS not yet propagated (up to 48 h) | Wait; check with `nslookup` |
| `ERR_SSL_PROTOCOL_ERROR` | TLS not yet provisioned | Wait 5–15 min after DNS propagates |
| Google Sign-In fails on new domain | Origin not added to Google Console | Complete Step 4 |
| Password-reset link points to old URL | `FRONTEND_URL` env not updated | Complete Step 3 + redeploy |
