import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RemindersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.page.goto('/reminders');
  }

  get newReminderButton(): Locator {
    return this.page.locator('a[href="/reminders/new"]');
  }

  async clickNewReminder() {
    await this.newReminderButton.click();
  }

  reminderRow(index: number = 0): Locator {
    return this.page.locator('li').nth(index);
  }

  reminderByType(_typeKey: string): Locator {
    return this.page
      .locator('li')
      .filter({
        has: this.page.locator(`[data-testid="reminder-status-badge"]`),
      })
      .first();
  }

  async clickCompleteOnReminder(index: number = 0) {
    await this.reminderRow(index)
      .locator('button.btn-primary')
      .filter({ hasText: /complete|feito/i })
      .click();
  }

  async fillCompletedKm(km: number) {
    await this.page.locator('input[id="complete-km"]').fill(String(km));
    // Save button inside dialog
    await this.page.locator('[role="dialog"] button[type="submit"]').click();
  }

  async switchToHistory() {
    await this.page
      .locator('button')
      .filter({ hasText: /history|histórico/i })
      .click();
  }

  async expectBadgeStatus(status: string, index: number = 0) {
    await this.reminderRow(index)
      .locator('[data-testid="reminder-status-badge"]')
      .locator(`[data-status="${status}"]`);
  }

  async clickDeleteOnReminder(index: number = 0) {
    await this.reminderRow(index).locator('button.btn-danger').first().click();
  }

  async confirmDelete() {
    // Single confirm — click the Delete/Excluir button in the dialog
    await this.page.locator('[role="dialog"] button.btn-danger').click();
  }

  async confirmDoubleDelete() {
    // First click "Continue", then click delete
    await this.page.locator('[role="dialog"] button.btn-danger').click(); // "Continue"
    await this.page.locator('[role="dialog"] button.btn-danger').click(); // actual delete
  }

  get emptyState(): Locator {
    return this.page.getByText(/no reminders/i);
  }

  get remindersList(): Locator {
    return this.page.locator('li');
  }
}
