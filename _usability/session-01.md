# Usability Test — Participant #1
**Date:** ____  
**Device / OS:** ____  
**Profile:** ____

---

## Tasks

### T1 — Register with email
- **Time:** 2 min
- **Completed?** [x] Yes
- **Notes:**
  - Thought aloud about password restrictions — no indicator shown
  - At login screen, unclear whether field accepts username or email

### T2 — Verify email
- **Time:** 1 min
- **Completed?** [x] Yes
- **Notes:**
  - "Verify your email" banner persisted after verification completed → #50

### T3 — Create Fuel expense (Shell, R$5.89/L, 40L)
- **Time:** 10 min
- **Completed?** [ ] Yes  [x] No  [ ] With help
- **Notes:**
  - Numeric fields had no mask — unsure whether to use dot or comma → #54
  - "Amount" field purpose unclear; user deduced litres × price/L on their own → #51
  - Tried to edit amount field — no feedback that it is calculated → #51
  - **CRASH:** saving Fuel expense redirected to login, data lost → #48
  - Wanted to add a free-text note (like in reminder form)
  - Explored editing other categories (Maintenance, Tax) and month/year filters
  - Surprised by Dashboard charts
  - "Monthly average" subtitle year label unclear — asked aloud what period it referred to

### T4 — Create reminder (oil change in 60 days)
- **Time:** 2 min
- **Completed?** [x] No
- **Notes:**
  - Generic "something went wrong, try again" error on Maintenance reminder → #49

### T5 — Switch language PT-BR → EN → PT-BR
- **Time:** 1 min
- **Completed?** [x] Yes
- **Notes:** —

### T6 — Install PWA
- **Time:** 2 min
- **Completed?** [ ] Yes  [x] No
- **Notes:**
  - Safari blocked connection — likely corporate device with network restrictions

---

## Issues logged
| Issue | Severity |
|-------|----------|
| [#48](https://github.com/rafaabc/norevify/issues/48) crash: saving Fuel expense redirects to login | 🔴 Critical | ✅ Fixed — `withAuth` now returns 401 for invalid token; frontend auto-logout scoped to 401 only; 403 (email not verified) surfaces as form error |
| [#49](https://github.com/rafaabc/norevify/issues/49) crash: creating reminder returns generic error | 🔴 Critical |
| [#50](https://github.com/rafaabc/norevify/issues/50) "verify email" banner persists after verification | 🟡 Medium |
| [#51](https://github.com/rafaabc/norevify/issues/51) "amount" field does not communicate it is auto-calculated | 🟡 Medium |
| [#52](https://github.com/rafaabc/norevify/issues/52) no password requirements indicator on registration | 🟢 Low |
| [#53](https://github.com/rafaabc/norevify/issues/53) login field ambiguous — username or email? | 🟢 Low |
| [#54](https://github.com/rafaabc/norevify/issues/54) numeric fields have no decimal mask | 🟢 Low |
| [#55](https://github.com/rafaabc/norevify/issues/55) Sentry did not capture usability test crashes | 🟡 Medium |
