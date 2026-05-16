import { test, expect } from '@playwright/test';
import { createAndLoginUser } from '../../fixtures/api';
import { LoginPage } from '../../pages/LoginPage';
import { DEFAULT_PASSWORD } from '../../fixtures/test-data';

test.describe('Language switching (i18n)', () => {
  let username: string;
  let loginPage: LoginPage;

  test.beforeAll(async ({ request }) => {
    const user = await createAndLoginUser(request, 'i18n');
    username = user.username;
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('i18nextLng'));
  });

  // TC-LG-E2E-01: PT-BR strings visible when language is set to pt-BR
  test('[TC-LG-E2E-01] should show PT-BR strings by default when visiting the login page', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'pt-BR'));
    await page.reload();

    // The login page heading renders auth.login.heading — "Entrar" in PT-BR, "Sign in" in EN
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();

    // Also confirm the "Não tem uma conta?" link text is in PT-BR
    await expect(page.getByText('Não tem uma conta?')).toBeVisible();
  });

  // TC-LG-E2E-02: Login → Settings → switch to EN → verify nav + localStorage
  test('[TC-LG-E2E-02] should switch UI to English and persist lang in localStorage when EN is selected', async ({ page }) => {
    // Explicitly set PT-BR to ensure a consistent starting language
    await loginPage.navigate();
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'pt-BR'));
    await page.reload();

    // Log in
    await page.locator('[name="username"]').fill(username);
    await page.locator('[name="password"]').fill(DEFAULT_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/');

    // Verify PT-BR sidebar label before switching
    await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible();

    // Navigate to Settings
    await page.goto('/settings');

    // Select English in the language dropdown (id="settings-language")
    await page.locator('#settings-language').selectOption('en');

    // Click the Save button in the language form
    // The language form is the second form — target the button that becomes enabled after change
    const langForm = page.locator('form', { has: page.locator('#settings-language') });
    await langForm.getByRole('button', { name: /Salvar|Save/i }).click();

    // Wait for success banner: "Language updated successfully."
    await expect(page.getByText('Language updated successfully.')).toBeVisible();

    // Sidebar should now show English labels
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Expenses' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible();

    // localStorage must record the chosen language
    const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'));
    expect(storedLang).toBe('en');
  });

  // TC-LG-E2E-03: Reload preserves EN language
  test('[TC-LG-E2E-03] should keep English UI after page reload when EN was previously selected', async ({ page }) => {
    // Log in and pre-set language to EN via localStorage + reload
    await loginPage.navigate();
    await loginPage.login(username, DEFAULT_PASSWORD);
    await page.waitForURL('/');

    // Force EN in localStorage and reload to simulate returning user with persisted preference
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'en'));
    await page.reload();

    // After reload sidebar labels must remain in English
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Expenses' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible();
  });

  // TC-LG-E2E-04: Switch back to PT-BR → verify nav shows "Painel"
  test('[TC-LG-E2E-04] should revert sidebar to PT-BR labels when language is switched back to Português', async ({ page }) => {
    // Log in with EN already in localStorage
    await loginPage.navigate();
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'en'));
    await page.reload();

    await page.locator('[name="username"]').fill(username);
    await page.locator('[name="password"]').fill(DEFAULT_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');

    // Confirm English is active
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    // Go to Settings and switch back to PT-BR
    await page.goto('/settings');
    await page.locator('#settings-language').selectOption('pt-BR');

    const langForm = page.locator('form', { has: page.locator('#settings-language') });
    await langForm.getByRole('button', { name: /Save|Salvar/i }).click();

    // Wait for PT-BR success banner: "Idioma atualizado com sucesso."
    await expect(page.getByText('Idioma atualizado com sucesso.')).toBeVisible();

    // Sidebar must now display PT-BR labels
    await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Despesas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Resumo' })).toBeVisible();
  });
});
