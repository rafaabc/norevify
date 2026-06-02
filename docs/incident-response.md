# Incident Response — Drive Ledger

## Contact

| Role                       | Contact                            |
| -------------------------- | ---------------------------------- |
| DPO / Owner                | faelsabc21@gmail.com               |
| ANPD (BR)                  | anpd.gov.br/web/guest/contato      |
| GDPR supervisory authority | varies by country of affected user |

---

## Severity levels

| Level         | Definition                                    | Example                                       |
| ------------- | --------------------------------------------- | --------------------------------------------- |
| P0 — Critical | Data breach or service fully down             | DB credentials leaked, all API 500s           |
| P1 — High     | Partial data exposure or major feature broken | Auth bypass, export returns other user's data |
| P2 — Medium   | Degraded functionality, no data exposure      | Rate limiter not firing, emails not sending   |
| P3 — Low      | Minor bug, no user impact                     | UI misalignment, log noise                    |

---

## Response phases

### 1. Detection

Sources:

- Sentry alert (5xx spike or new error class)
- User report (email to DPO contact above)
- Vercel logs (abnormal pattern)
- Atlas alerts (connection spike, storage near limit)

**First action**: confirm the incident is real, not a monitoring false positive.

### 2. Containment

Immediate actions depending on incident type:

| Incident                   | Containment                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Leaked `JWT_SECRET`        | Rotate secret in Vercel → redeploy (invalidates all sessions)                                          |
| Leaked DB credentials      | Atlas → Database Access → reset password → update `MONGODB_URI`                                        |
| Leaked `RESEND_API_KEY`    | Resend Dashboard → delete key → create new one                                                         |
| Active brute-force         | Confirm rate limiter is firing (check logs for 429s); if not, temporarily block IP via Vercel Firewall |
| Data exposed to wrong user | Disable affected endpoint via Vercel (set maintenance page or feature flag)                            |

### 3. Assessment

Answer:

- What data was exposed? (categories: name, email, expenses, reminders, password hash)
- How many users are affected?
- Is the exposure still ongoing or already contained?
- What was the root cause?

Document answers before notifying anyone.

### 4. Notification

#### Users (LGPD Art. 48 / GDPR Art. 33)

Notify affected users by email if personal data was exposed. Use the template below.

**LGPD**: notify ANPD within **3 business days** of confirmed breach.  
**GDPR**: notify supervisory authority within **72 hours**.

#### Email template (PT-BR)

```
Assunto: [Drive Ledger] Aviso importante sobre sua conta

Olá [username],

Identificamos um incidente de segurança que pode ter afetado sua conta no Drive Ledger.

O que aconteceu: [descrição objetiva]
Dados potencialmente afetados: [lista]
O que fizemos: [ações de contenção]
O que você deve fazer: [ex: trocar senha, monitorar transações]

Se tiver dúvidas, entre em contato: faelsabc21@gmail.com

— Equipe Drive Ledger
```

#### Email template (EN)

```
Subject: [Drive Ledger] Important notice about your account

Hi [username],

We identified a security incident that may have affected your Drive Ledger account.

What happened: [objective description]
Data potentially affected: [list]
What we did: [containment actions]
What you should do: [e.g. change password, monitor activity]

Questions? Contact us: faelsabc21@gmail.com

— Drive Ledger Team
```

### 5. Recovery

- Deploy fix to production.
- Verify the vulnerability is closed (run relevant test suite; manual smoke test).
- Confirm monitoring shows normal baseline.

### 6. Post-mortem

Within 5 business days of resolution, write a brief post-mortem covering:

- Timeline of events
- Root cause
- Impact (users, data, duration)
- Fix applied
- Preventive measures

Store in `docs/post-mortems/YYYY-MM-DD-<slug>.md`.

---

## Quick-reference: key actions

```bash
# Rotate JWT_SECRET — invalidates all sessions
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# 2. Update JWT_SECRET in Vercel env vars
# 3. Trigger redeploy

# Export all user data for forensics (requires mongodump)
mongodump --uri "$MONGODB_URI" --out incident-$(date +%Y%m%d)

# Check rate limiter in Vercel logs — look for 429 responses
# Vercel Dashboard → Logs → filter: "429"
```
