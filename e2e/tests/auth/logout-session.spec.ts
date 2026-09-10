import { test, expect } from '@playwright/test';
import { createAndLoginUser } from '../../fixtures/api';

test.describe('Logout and Session Expiry', () => {
  // TC-02-06 — simulate expired/invalid token
  test('[TC-02-06] should redirect to /login with "session expired" banner when token is invalid', async ({
    page,
  }) => {
    // Set a structurally valid but cryptographically invalid JWT so
    // AuthContext treats the user as authenticated, but the backend rejects it
    const fakeToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJpZCI6OTk5fQ.invalid_signature'; // NOSONAR — deliberately invalid JWT for E2E test

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('i18nextLng', 'en');
    }, fakeToken);
    await page.goto('/expenses');

    // API returns 403 → auth:logout event → AuthContext navigates to /login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.alert-info')).toContainText(
      'Your session expired. Please log in again.',
    );
  });

  // Logout flow
  test('should clear session and show Login/Register links after logout', async ({
    page,
    request,
  }) => {
    const { token } = await createAndLoginUser(request, 'logout');

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('i18nextLng', 'en');
    }, token);
    await page.goto('/expenses');
    await expect(page).toHaveURL('/expenses');

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  // Regression for the audited cross-user leak: the service worker used to
  // NetworkFirst-cache every /api/ response for 24h keyed only by URL, so a
  // logout (which only clears the localStorage token) left the prior user's
  // data readable from CacheStorage. Meaningful against a production build
  // (`next build --webpack && next start`) where Serwist actually registers;
  // trivially satisfied in dev, where no cache is ever populated.
  test('should never populate an api-cache in CacheStorage, before or after logout', async ({
    page,
    request,
  }) => {
    const { token } = await createAndLoginUser(request, 'apicache');

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('i18nextLng', 'en');
    }, token);
    await page.goto('/expenses');
    await expect(page).toHaveURL('/expenses');

    const cacheKeysBeforeLogout = await page.evaluate(() => caches.keys());
    expect(cacheKeysBeforeLogout).not.toContain('api-cache');

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL('/login');

    const cacheKeysAfterLogout = await page.evaluate(() => caches.keys());
    expect(cacheKeysAfterLogout).not.toContain('api-cache');
  });
});
