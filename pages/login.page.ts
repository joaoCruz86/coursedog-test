import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get emailInput()    { return this.page.getByPlaceholder(/email/i); }
  get passwordInput() { return this.page.getByPlaceholder(/password/i); }
  get submitButton()  { return this.page.getByRole('button', { name: /submit/i }); }
  get errorMessage()  { return this.page.getByRole('alert').or(this.page.locator('.alert, .error, [class*="error"], [class*="alert"]')).first(); }

  async navigate(): Promise<void> {
    await this.page.goto('/auth_ecommerce');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async hasEmailValidationError(): Promise<boolean> {
    const isInvalid = await this.emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const hasError  = await this.errorMessage.isVisible().catch(() => false);
    return isInvalid || hasError;
  }

  async hasPasswordValidationError(): Promise<boolean> {
    const isInvalid = await this.passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const hasError  = await this.errorMessage.isVisible().catch(() => false);
    return isInvalid || hasError;
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
