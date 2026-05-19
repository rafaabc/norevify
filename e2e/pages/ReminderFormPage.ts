import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReminderFormPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateNew() {
    await this.page.goto('/reminders/new');
  }

  async selectType(type: string) {
    await this.page.locator('select[name="type"]').selectOption(type);
  }

  async fillDueDate(date: string) {
    await this.page.locator('input[name="dueDate"]').fill(date);
  }

  async fillDueKm(km: number) {
    await this.page.locator('input[name="dueKm"]').fill(String(km));
  }

  async fillIntervalMonths(months: number) {
    await this.page.locator('input[name="intervalMonths"]').fill(String(months));
  }

  async fillIntervalKm(km: number) {
    await this.page.locator('input[name="intervalKm"]').fill(String(km));
  }

  async fill({
    type,
    dueDate,
    dueKm,
    intervalMonths,
    intervalKm,
  }: {
    type?: string;
    dueDate?: string;
    dueKm?: number;
    intervalMonths?: number;
    intervalKm?: number;
  }) {
    if (type) {
      await this.selectType(type);
    }
    if (dueDate) {
      await this.fillDueDate(dueDate);
    }
    if (dueKm !== undefined) {
      await this.fillDueKm(dueKm);
    }
    if (intervalMonths !== undefined) {
      await this.fillIntervalMonths(intervalMonths);
    }
    if (intervalKm !== undefined) {
      await this.fillIntervalKm(intervalKm);
    }
  }

  async submit() {
    await this.page.locator('button[type="submit"]').click();
  }

  async cancel() {
    await this.page.locator('button.btn-secondary').click();
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  get typeSelect(): Locator {
    return this.page.locator('select[name="type"]');
  }

  get dueDateInput(): Locator {
    return this.page.locator('input[name="dueDate"]');
  }

  get dueKmInput(): Locator {
    return this.page.locator('input[name="dueKm"]');
  }

  get intervalMonthsInput(): Locator {
    return this.page.locator('input[name="intervalMonths"]');
  }

  get intervalKmInput(): Locator {
    return this.page.locator('input[name="intervalKm"]');
  }
}
