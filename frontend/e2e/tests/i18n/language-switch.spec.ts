import { test, expect } from '@playwright/test';
import { createAndLoginUser } from '../../fixtures/api';
import { LoginPage } from '../../pages/LoginPage';
import { DEFAULT_PASSWORD } from '../../fixtures/test-data';
import {
  setLanguage,
  switchToLanguage,
  expectEnglishNav,
  expectPtBrNav,
} from '../../fixtures/i18n';

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
    await setLanguage(page, 'pt-BR');

    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByText('Não tem uma conta?')).toBeVisible();
  });

  // TC-LG-E2E-02: Login → Settings → switch to EN → verify nav + localStorage
  test('[TC-LG-E2E-02] should switch UI to English and persist lang in localStorage when EN is selected', async ({ page }) => {
    await loginPage.navigate();
    await setLanguage(page, 'pt-BR');

    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await loginPage.login(username, DEFAULT_PASSWORD);
    await page.waitForURL('/');

    await expect(page.getByRole('link', { name: 'Painel' })).toBeVisible();

    await switchToLanguage(page, 'en');
    await expect(page.getByText('Language updated successfully.')).toBeVisible();

    await expectEnglishNav(page);

    const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'));
    expect(storedLang).toBe('en');
  });

  // TC-LG-E2E-03: Reload preserves EN language
  test('[TC-LG-E2E-03] should keep English UI after page reload when EN was previously selected', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.login(username, DEFAULT_PASSWORD);
    await page.waitForURL('/');

    await setLanguage(page, 'en');
    await expectEnglishNav(page);
  });

  // TC-LG-E2E-04: Switch back to PT-BR → verify nav shows "Painel"
  test('[TC-LG-E2E-04] should revert sidebar to PT-BR labels when language is switched back to Português', async ({ page }) => {
    await loginPage.navigate();
    await setLanguage(page, 'en');

    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await loginPage.login(username, DEFAULT_PASSWORD);
    await page.waitForURL('/');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    await switchToLanguage(page, 'pt-BR');
    await expect(page.getByText('Idioma atualizado com sucesso.')).toBeVisible();

    await expectPtBrNav(page);
  });
});
