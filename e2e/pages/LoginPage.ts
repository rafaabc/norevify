import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Google is the only sign-in method. Real Google OAuth can't be automated, so the
// page object only exposes what is reachable without it. Authenticated specs get a
// session from createAndLoginUser() (seeded user + minted JWT) instead.
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.page.goto('/login');
  }

  get usernameInput(): Locator {
    return this.page.locator('[name="username"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]');
  }
}
