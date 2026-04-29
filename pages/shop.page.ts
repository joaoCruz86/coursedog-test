import { Page } from '@playwright/test';

export class ShopPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get addToCartButtons()        { return this.page.getByRole('button', { name: /add to cart/i }); }
  // Total amount is a text node sibling of <strong>Total</strong> — use the parent wrapper
  get cartTotal()               { return this.page.locator('strong:has-text("Total")').locator('..'); }
  get proceedToCheckoutButton() { return this.page.getByRole('button', { name: /proceed to checkout/i }); }
  get logoutButton()            { return this.page.locator('#logout'); }

  cartItemRow(productName: string) {
    return this.page.locator('.cart-row').filter({ hasText: productName });
  }

  async getCartTotalAmount(): Promise<number> {
    const text = await this.cartTotal.innerText();
    return parseFloat(text.replace('Total', '').replace('$', '').trim());
  }

  async addToCart(productName: string): Promise<void> {
    await this.page
      .getByText(productName, { exact: true })
      .locator('..')
      .getByRole('button', { name: /add to cart/i })
      .click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.cartItemRow(productName)
      .getByRole('button', { name: /remove/i })
      .click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
