import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { DEFAULT_PASSWORD, uniqueUsername } from '../../fixtures/test-data';

test.describe('US-01: User Registration', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await registerPage.navigate();
  });

  // TC-01-01
  test('[TC-01-01] should redirect to /login with success banner after valid registration', async ({ page }) => {
    const username = uniqueUsername('reg');
    await registerPage.register(username, DEFAULT_PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  // TC-01-02 / TC-01-03
  test('[TC-01-02/03] should show error banner when username is already taken', async ({ page, request }) => {
    const username = uniqueUsername('dup');

    await request.post('/api/auth/register', {
      data: { username, password: DEFAULT_PASSWORD, email: `${username}@test.com` },
    });

    await registerPage.register(username, DEFAULT_PASSWORD);

    await expect(page).toHaveURL('/register');
    await expect(registerPage.errorBanner).toContainText('username already taken', { ignoreCase: true });
  });
});
