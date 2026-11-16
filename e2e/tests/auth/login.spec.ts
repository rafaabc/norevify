import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { createAndLoginUser } from '../../fixtures/api';

test.describe('US-02: User Login (Google only)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  });

  test('[TC-02-01] should show the login page without any username/password fields', async ({
    page,
  }) => {
    await loginPage.navigate();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(loginPage.usernameInput).toHaveCount(0);
    await expect(loginPage.passwordInput).toHaveCount(0);
    await expect(page.locator('a[href="/forgot-password"]')).toHaveCount(0);
  });

  test('[TC-02-02] should send an authenticated user straight into the app', async ({
    page,
    request,
  }) => {
    const { username, token } = await createAndLoginUser(request, 'login');
    await page.addInitScript((t: string) => localStorage.setItem('token', t), token);

    await page.goto('/dashboard');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(username)).toBeVisible();
  });

  // TC-02-07 — access protected route without token
  test('[TC-02-07] should redirect to /login when navigating to /expenses without a token', async ({
    page,
  }) => {
    await page.goto('/expenses');

    await expect(page).toHaveURL('/login');
  });
});
