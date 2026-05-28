import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExpenseFormPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateNew() {
    await this.page.goto('/expenses/new');
  }

  async selectCategory(category: string) {
    await this.page.locator('select[name="category"]').selectOption(category);
  }

  async fillDate(date: string) {
    await this.page.locator('input[name="date"]').fill(date);
  }

  async fillAmount(amount: string) {
    await this.page.locator('input[name="amount"]').fill(amount);
  }

  async fillLitres(litres: string) {
    await this.page.locator('input[name="litres"]').fill(litres);
  }

  async fillPricePerLitre(price: string) {
    await this.page.locator('input[name="price_per_litre"]').fill(price);
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

  get computedAmountDisplay(): Locator {
    return this.page.locator('#field-amount');
  }

  get litresInput(): Locator {
    return this.page.locator('input[name="litres"]');
  }

  get pricePerLitreInput(): Locator {
    return this.page.locator('input[name="price_per_litre"]');
  }

  get amountInput(): Locator {
    return this.page.locator('input[name="amount"]');
  }
}
