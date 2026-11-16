import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';

test.describe('US-01: User Registration (Google only)', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await registerPage.navigate();
  });

  test('[TC-01-01] should ask only for currency and consent — no username, email or password', async () => {
    await expect(registerPage.currencySelect).toBeVisible();
    await expect(registerPage.consentCheckbox).not.toBeChecked();
    await expect(registerPage.usernameInput).toHaveCount(0);
    await expect(registerPage.emailInput).toHaveCount(0);
    await expect(registerPage.passwordInput).toHaveCount(0);
  });

  test('[TC-01-02] should let the user tick and untick the consent box', async () => {
    await registerPage.consentCheckbox.check();
    await expect(registerPage.consentCheckbox).toBeChecked();
    await registerPage.consentCheckbox.uncheck();
    await expect(registerPage.consentCheckbox).not.toBeChecked();
  });

  test('[TC-01-03] should keep the old password sign-up endpoint closed', async ({ request }) => {
    const res = await request.post('/api/auth/register', { data: {} });

    expect([404, 405]).toContain(res.status());
  });
});
