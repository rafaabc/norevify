import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Sign-up happens through Google (the button is disabled until consent is given), so
// this page object covers the form controls that precede it.
export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.page.goto('/register');
  }

  get consentCheckbox(): Locator {
    return this.page.locator('#reg-consent');
  }

  get currencySelect(): Locator {
    return this.page.locator('#reg-currency');
  }

  get inviteCodeInput(): Locator {
    return this.page.locator('#reg-invite-code');
  }

  get usernameInput(): Locator {
    return this.page.locator('[name="username"]');
  }

  get emailInput(): Locator {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]');
  }
}
