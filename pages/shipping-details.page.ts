import { Page, expect } from '@playwright/test';

export class ShippingDetailsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get shippingDetailsHeader(){ return this.page.getByRole('heading', { name: 'Shipping Details' }); }
  get submitOrderButton()    { return this.page.getByRole('button', { name: /submit order/i }); }
  get confirmationMessage()  { return this.page.getByText(/congrats/i); }
  get phoneInput()           { return this.page.getByPlaceholder(/phone/i); }
  get cityInput()            { return this.page.getByRole('textbox').nth(2); }
  get countrySelect()        { return this.page.getByRole('combobox'); }

  private get streetInput() { return this.page.getByPlaceholder(/street/i); }

  async fillShippingDetails(phone: string, street: string, city: string): Promise<void> {
    await this.phoneInput.fill(phone);
    await this.streetInput.fill(street);
    await this.cityInput.fill(city);
  }

  async selectCountry(country: string): Promise<void> {
    await this.countrySelect.selectOption({ label: country });
  }

  async submitOrder(): Promise<void> {
    await this.submitOrderButton.click();
  }

  async hasFormValidationError(): Promise<boolean> {
    const isInvalid = await this.phoneInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const hasError  = await this.page.getByRole('alert').or(this.page.locator('.alert, [class*="error"]')).first().isVisible().catch(() => false);
    return isInvalid || hasError;
  }

  async expectConfirmationContains(price: string, street: string, city: string, country: string): Promise<void> {
    await expect(this.confirmationMessage).toBeVisible();
    const text = await this.confirmationMessage.innerText();
    expect(text).toContain(price);
    expect(text).toContain(street);
    expect(text).toContain(city);
    expect(text).toContain(country);
  }
}
