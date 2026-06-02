import { test, expect } from '@playwright/test';
import { createAndLoginUser } from '../../fixtures/api';
import { LoginPage } from '../../pages/LoginPage';
import { DEFAULT_PASSWORD } from '../../fixtures/test-data';
import { expectEnglishNav } from '../../fixtures/i18n';

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe('Sidebar responsiveness', () => {
  let username: string;
  let loginPage: LoginPage;

  test.beforeAll(async ({ request }) => {
    const user = await createAndLoginUser(request, 'sidebar');
    username = user.username;
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  });

  async function loginAndGoTo(page: (typeof loginPage)['page'], path = '/') {
    await loginPage.navigate();
    await loginPage.login(username, DEFAULT_PASSWORD);
    await page.waitForURL('/dashboard');
    // Hide Next.js dev portal if present (Turbopack dev-mode overlay)
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    });
    if (path !== '/') await page.goto(path);
  }

  // ── Mobile ──────────────────────────────────────────────────────────

  test('[TC-UI-01] should hide sidebar and show bottom tab navigation on mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAndGoTo(page);

    // Sidebar is fully hidden on mobile — replaced by bottom tabs
    await expect(page.locator('aside')).not.toBeVisible();
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  });

  test('[TC-UI-02] should hide nav labels on mobile and show only icons', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAndGoTo(page);
    await expectEnglishNav(page);
  });

  test('[TC-UI-03] should navigate correctly via icon links on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAndGoTo(page);

    const bottomNav = page.locator('nav[aria-label="Main navigation"]');

    await bottomNav.getByRole('link', { name: 'Expenses' }).click();
    await expect(page).toHaveURL('/expenses');

    await bottomNav.getByRole('link', { name: 'Summary' }).click();
    await expect(page).toHaveURL('/summary');

    await bottomNav.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('[TC-UI-04] should not overflow the viewport horizontally on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginAndGoTo(page);

    const scrollWidth: number = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
  });

  // ── Desktop ─────────────────────────────────────────────────────────

  test('[TC-UI-05] should show full sidebar with labels on desktop viewport', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await loginAndGoTo(page);

    const sidebar = page.locator('aside');
    const box = await sidebar.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(220);

    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Expenses')).toBeVisible();
    await expect(sidebar.getByText('Summary')).toBeVisible();
  });
});
