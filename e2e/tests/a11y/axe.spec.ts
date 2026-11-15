import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createAndLoginUser } from '../../fixtures/api';

// Rules behind the axe-core scan that opened #266–#274.
const RULES = [
  'color-contrast',
  'link-in-text-block',
  'scrollable-region-focusable',
  'page-has-heading-one',
  'landmark-one-main',
  'region',
  'heading-order',
  'aria-allowed-attr',
];

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
    .withRules(RULES)
    .analyze();
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    `a11y violations on ${path}`,
  ).toEqual([]);
}

test.describe('a11y — public pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  });

  for (const path of ['/', '/login', '/register', '/privacy', '/terms']) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await expectNoViolations(page, path);
    });
  }
});

test.describe('a11y — authenticated pages', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    ({ token } = await createAndLoginUser(request, 'axe'));
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('i18nextLng', 'en');
    }, token);
  });

  for (const path of ['/expenses', '/summary', '/income', '/reminders', '/vehicles']) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await expectNoViolations(page, path);
    });
  }
});
