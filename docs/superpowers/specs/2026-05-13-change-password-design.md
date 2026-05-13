# Change Password Feature — Design Spec

**Date:** 2026-05-13  
**Status:** Approved

## Overview

Add a public "Change password" flow that lets a registered user reset their password by providing their username and new password. No authentication token required. No email/SMS verification — this is a single-user learning app. The feature spans backend, frontend, all test layers, and documentation.

---

## Backend

### `src/models/user.model.js`

Add one method:

```js
updatePassword: (username, hashedPassword) =>
  User.updateOne({ username }, { $set: { password: hashedPassword } })
```

### `src/services/auth.service.js`

New function `changePassword({ username, newPassword })`:

1. Validate `username` and `newPassword` are present — throw `400` if missing.
2. Validate `newPassword` length: 8–20 chars (same rules as `register`) — throw `400` if invalid.
3. `userModel.findByUsername(username)` — throw `404 'User not found'` if not found.
4. `bcrypt.hash(newPassword, 10)`.
5. `userModel.updatePassword(username, hash)`.
6. Return `{ message: 'Password updated successfully' }`.

### `src/controllers/auth.controller.js`

New `changePassword` handler — same async try/catch pattern as `register` and `login`. Returns `200` on success.

### `src/routes/auth.routes.js`

```js
router.patch('/password', authController.changePassword);
```

No auth middleware. Public endpoint.

### `resources/swagger.json`

Add `PATCH /api/auth/password` with request body schema `{ username: string, newPassword: string }` and responses `200`, `400`, `404`.

---

## Frontend

### `frontend/src/services/apiService.js`

Add to `authApi`:

```js
changePassword: (data) =>
  request('/auth/password', { method: 'PATCH', body: data, auth: false })
```

### `frontend/src/pages/ChangePasswordPage.jsx` (new)

- Split-screen layout by importing `LoginPage.module.css` directly — avoids creating a third identical copy of the 102-line split-screen stylesheet (`LoginPage.module.css` and `RegisterPage.module.css` are already identical, adding a third would worsen Sonar duplication).
- Fields: `username`, `newPassword`, `confirmPassword`.
- Client-side validation: if `newPassword !== confirmPassword` show inline error without calling the API.
- On success: `navigate('/login', { state: { passwordChanged: true } })`.
- On API error: display via `<ErrorBanner>`.

### `frontend/src/App.jsx`

Add public route:

```jsx
<Route path="/change-password" element={<ChangePasswordPage />} />
```

No `<ProtectedRoute>` wrapper.

### `frontend/src/pages/LoginPage.jsx`

Two additions:

1. `showPasswordChanged` state initialized from `location.state?.passwordChanged`, renders `"Password updated. Please log in."` success banner with the existing 3 s auto-dismiss pattern.
2. "Change password" `<Link to="/change-password">` below the existing "Register" link.

---

## Tests

### Backend unit — `test/unit/services/auth.service.test.js`

New cases for `changePassword`:

- `should update password when username exists and password is valid`
- `should throw 404 when username not found`
- `should throw 400 when newPassword is too short (< 8 chars)`
- `should throw 400 when newPassword is too long (> 20 chars)`
- `should throw 400 when username is missing`
- `should throw 400 when newPassword is missing`

### Backend unit — `test/unit/models/user.model.test.js`

New case for `updatePassword`:

- `should persist hashed password to the user document`

### Integration — `test/integration/change-password.flow.test.js` (new file)

Full cross-layer flow using real in-memory Mongo, no mocks:

1. Register user.
2. Call `changePassword` service with new password.
3. Attempt login with old password → expect `401`.
4. Login with new password → expect success and valid token.

### API — `test/api/change-password.test.js` (new file)

HTTP tests against live server. Test case naming follows `[TC-XX-YY]` convention:

- `[TC-05-01] should return 200 when username exists and password is valid`
- `[TC-05-02] should return 404 when username does not exist`
- `[TC-05-03] should return 400 when newPassword is too short`
- `[TC-05-04] should return 400 when required fields are missing`

### Frontend unit — `frontend/test/pages/ChangePasswordPage.test.jsx` (new file)

- Renders all three fields and submit button.
- Shows inline error when passwords do not match (no API call made).
- Calls `authApi.changePassword` with correct payload on valid submit.
- Calls `navigate('/login', { state: { passwordChanged: true } })` on success.
- Renders `<ErrorBanner>` on API error.

### E2E — `e2e/tests/change-password.spec.ts` (new file)

Golden path:

1. Register a new user via API.
2. Navigate to `/change-password`.
3. Fill username + new password + confirm password.
4. Submit → assert redirect to `/login` with `"Password updated. Please log in."` banner.
5. Log in with new password → assert dashboard loads.

---

## Documentation

### `CLAUDE.md`

- Add `PATCH /api/auth/password` to the API table (no auth required).
- Add `ChangePasswordPage` to the Frontend naming conventions section.
- Note `updatePassword` in the models description.

### `README.md`

- Add new endpoint to the API reference section.
- Add `/change-password` to the frontend routes description.

### GitHub Wiki — `01 - User Stories and Business Rules`

Add new user story:

> **US-05: Change Password** — Registered users can reset their password by providing their username and a new password. No authentication token is required. The same password validation rules as registration apply (8–20 characters, alphanumeric).

### GitHub Wiki — `02 - Test Plan and Strategy`

- Add ~8 test conditions for US-05 (missing fields, unknown username, password too short/long, passwords don't match client-side, success).
- Update total condition count: 58 → ~66.
- Update test pyramid counts to reflect new unit, integration, API, and E2E tests.

### GitHub Wiki — `03 - Expense Domain Rules`

No changes required.

---

## Duplication Budget

`ChangePasswordPage` imports `LoginPage.module.css` (existing) instead of a new identical copy. All pages reuse `form-group` / `btn-primary` global classes. No business logic is duplicated across layers — validation lives exclusively in `auth.service.js`. Target: SonarQube duplication < 3%.
