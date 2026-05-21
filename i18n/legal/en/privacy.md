# Privacy Policy

**Version: 2026-05-20**

---

## 1. Who we are

**Drive Ledger** is an automotive expense tracking service for individual drivers, available at **app.norevify.com**, developed and operated by Rafael ABC ("we", "our", "us").

For privacy-related questions, please contact our Data Protection Officer (DPO) at **faelsabc21@gmail.com**.

---

## 2. What data we collect

We collect and store the following categories of personal data:

| Data | Description |
|---|---|
| Username | Identifier chosen by the user at registration |
| Email address | Used for authentication and service communications |
| Password (hash) | Stored in irreversible format (bcrypt); never in plain text |
| Automotive expenses | Category, amount, date, litres fuelled, price per litre (where applicable) |
| Reminders | Type, due date, due mileage, recurrence interval |
| Odometer reading | Current mileage recorded by the user |
| IP hash | One-way hash of the access IP address, used for security purposes |

We do not collect sensitive data (health, biometrics, race, religion, etc.) or data from individuals under 18 years of age.

---

## 3. Why we collect this data

We use the data collected exclusively for:

- **Service operation**: user authentication, storage and display of expenses and reminders, calculation of financial and mileage summaries.
- **Notifications and reminders**: alerting users about upcoming maintenance, insurance, and other registered item deadlines.
- **Security**: detecting anomalous access and protecting user accounts.

We do not use your data for advertising, sale to third parties, or any purpose other than those described above.

---

## 4. Legal basis

The processing of personal data in Drive Ledger is carried out on the basis of:

- **LGPD (Brazil)** — Art. 7, V: performance of a contract or preliminary procedures related to a contract of which the data subject is a party, at the request of the data subject.
- **GDPR (EU/UK)** — Art. 6(1)(b): processing is necessary for the performance of a contract to which the data subject is party.

For specific security and fraud prevention purposes, we also rely on **LGPD Art. 7, IX** (legitimate interest of the controller) and **GDPR Art. 6(1)(f)** (legitimate interests).

---

## 5. How long we keep your data

We retain your personal data for **14 (fourteen) months from the date of your last login** to the service. After this period, data is automatically deleted from our servers.

You may also request immediate deletion at any time (see Section 6).

---

## 6. Your rights as a data subject

Under LGPD (Art. 18) and GDPR (Art. 15–22), you have the following rights regarding your personal data:

- **Access**: know what data we hold about you.
- **Rectification**: correct incomplete, inaccurate, or outdated data.
- **Erasure**: request deletion of your data and account.
- **Portability**: receive your data in a structured, machine-readable format.
- **Information**: obtain information about with whom we share your data (currently: no one outside of necessary subprocessors).
- **Restriction**: request that we restrict processing of your data in certain circumstances.
- **Objection**: object to processing based on legitimate interests.

### How to exercise your rights

You may exercise your rights directly through the platform or by email:

| Right | How to exercise |
|---|---|
| Export my data (portability / access) | `GET /api/auth/me/export` — available in the settings panel |
| Delete my account and all data | `DELETE /api/auth/me` — available in the settings panel |
| Other requests or questions | Email: **faelsabc21@gmail.com** |

We will respond to requests within **15 business days** (LGPD) or **30 calendar days** (GDPR), as required by applicable law.

---

## 7. Data sharing

We do not sell, rent, or share your personal data with third parties for commercial purposes.

We use the following subprocessors strictly necessary for service operation:

| Subprocessor | Purpose | Country |
|---|---|---|
| MongoDB Atlas (MongoDB, Inc.) | Database | USA (Standard Contractual Clauses) |
| Vercel Inc. | Hosting and CDN | USA (Standard Contractual Clauses) |
| Resend Inc. | Transactional email delivery | USA (Standard Contractual Clauses) |

All subprocessors operate under agreements ensuring adequate protection of personal data, including Standard Contractual Clauses where applicable under GDPR.

---

## 8. Security

We implement technical and organizational measures to protect your data, including:

- Passwords stored only as bcrypt hashes (cost factor ≥ 10).
- Communications protected by TLS/HTTPS.
- JWT tokens with configurable expiration.
- One-way hashing of IP addresses for security purposes.

---

## 9. Cookies and local storage

Drive Ledger does not use tracking cookies. We exclusively use the browser's `localStorage` to store the JWT authentication token and the user's language preference. No data is sent to advertising networks.

---

## 10. Changes to this policy

We may update this Privacy Policy periodically. When we do, we will update the version date at the top of this document. For material changes, we will notify active users by email at least 15 days in advance.

---

## 11. Contact and DPO

**Data Protection Officer (DPO):** faelsabc21@gmail.com

To exercise your rights, report security incidents, or clarify questions about this policy, please send an email to the address above.

---

*Last updated: 2026-05-20*
