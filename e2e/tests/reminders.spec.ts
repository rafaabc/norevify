/**
 * Reminders E2E tests
 *
 * Requires Next.js dev server running on :3000 (npm run next:dev)
 *
 * Atlas cleanup is handled by e2e/global-teardown.ts which deletes
 * all users whose email matches /@test\.com$/.
 */

import { test, expect } from '@playwright/test';
import { RemindersPage } from '../pages/RemindersPage';
import { ReminderFormPage } from '../pages/ReminderFormPage';
import { createAndLoginUser, createExpenseViaApi } from '../fixtures/api';

// ---------------------------------------------------------------------------
// TC-RE-E2E-01: Full lifecycle — create → odometer update → status flip →
//               complete → recurrence → history → delete
// ---------------------------------------------------------------------------
test('[TC-RE-E2E-01] should create reminder, flip status via odometer, complete it, see recurrence, then delete history entry', async ({
  page,
  request,
}) => {
  // ── Arrange ──────────────────────────────────────────────────────────────
  const { token } = await createAndLoginUser(request, 're01');

  await page.addInitScript((tk) => {
    localStorage.setItem('token', tk);
    localStorage.setItem('i18nextLng', 'en');
  }, token);

  const remindersPage = new RemindersPage(page);
  const formPage = new ReminderFormPage(page);

  // ── Step 1: Navigate to /reminders — empty state ─────────────────────────
  await remindersPage.navigate();
  await expect(remindersPage.emptyState).toBeVisible();

  // ── Step 2: Open new reminder form ───────────────────────────────────────
  await remindersPage.clickNewReminder();
  await expect(page).toHaveURL('/reminders/new');

  // ── Step 3: Fill and save the form ───────────────────────────────────────
  await formPage.fill({ type: 'Maintenance', dueKm: 10000, intervalKm: 10000 });
  await formPage.submit();

  // ── Step 4: Verify reminder appears with status "upcoming" ───────────────
  await expect(page).toHaveURL('/reminders');
  await expect(remindersPage.remindersList.first()).toBeVisible();
  await expect(
    remindersPage.remindersList
      .first()
      .locator('[data-testid="reminder-status-badge"][data-status="upcoming"]'),
  ).toBeVisible();

  // ── Step 5: Push odometer above 9 500 km via API (dueSoon threshold) ────
  await createExpenseViaApi(request, token, {
    category: 'Fuel',
    litres: 40,
    price_per_litre: 1.5,
    odometer: 9700,
  });

  // ── Step 6: Reload and verify badge flips to "dueSoon" ───────────────────
  await page.reload();
  await expect(
    remindersPage.remindersList
      .first()
      .locator('[data-testid="reminder-status-badge"][data-status="dueSoon"]'),
  ).toBeVisible();

  // ── Step 7: Complete the reminder ────────────────────────────────────────
  await remindersPage.clickCompleteOnReminder(0);
  await expect(page.locator('.modal')).toBeVisible();
  await remindersPage.fillCompletedKm(10100);

  // ── Step 8: Verify new reminder with dueKm=20100 in active list ──────────
  await expect(page).toHaveURL('/reminders');
  await expect(remindersPage.remindersList.first()).toBeVisible();
  // dueKm = completedKm(10100) + intervalKm(10000) = 20100
  await expect(remindersPage.remindersList.first()).toContainText('20100');

  // ── Step 9: Switch to History — original reminder visible with "done" ────
  await remindersPage.switchToHistory();
  await expect(
    page.locator('[data-testid="reminder-status-badge"][data-status="done"]').first(),
  ).toBeVisible();

  // ── Step 10: Double-confirm delete ───────────────────────────────────────
  await remindersPage.clickDeleteOnReminder(0);
  await remindersPage.confirmDoubleDelete();

  // ── Step 11: Verify history is empty (or entry gone) ─────────────────────
  await expect(
    page.locator('[data-testid="reminder-status-badge"][data-status="done"]'),
  ).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// TC-RE-E2E-02: Mobile action sheet opens from BottomTabs "+" button
// ---------------------------------------------------------------------------
test('[TC-RE-E2E-02] should open mobile action sheet and navigate to /reminders/new', async ({
  page,
  request,
}) => {
  // ── Arrange ──────────────────────────────────────────────────────────────
  const { token } = await createAndLoginUser(request, 're02');

  await page.setViewportSize({ width: 390, height: 844 });

  await page.addInitScript((tk) => {
    localStorage.setItem('token', tk);
    localStorage.setItem('i18nextLng', 'en');
  }, token);

  // ── Navigate to any protected page ───────────────────────────────────────
  await page.goto('/expenses');

  // ── Click the "+" FAB in BottomTabs ──────────────────────────────────────
  await page.locator('[data-testid="bottom-tabs-add"]').click();

  // ── Action sheet (dialog) should be visible ───────────────────────────────
  await expect(page.locator('.action-sheet')).toBeVisible();

  // ── Two action buttons should be present ─────────────────────────────────
  // Use attribute/class selectors, not translated text
  await expect(page.locator('[data-action="new-expense"]')).toBeVisible();
  await expect(page.locator('[data-action="new-reminder"]')).toBeVisible();

  // ── Click the "new reminder" action ──────────────────────────────────────
  await page.locator('[data-action="new-reminder"]').click();
  await expect(page).toHaveURL('/reminders/new');
});
