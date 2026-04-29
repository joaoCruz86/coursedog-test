import { test, expect } from '../fixtures';
import { ShippingDetailsPage } from '../pages/shipping-details.page';
import { PRODUCTS } from '../test-data/test.data';

test.describe('Shop cart', { tag: '@cart' }, () => {
  test('displays all five products with their names', async ({ page, shopPage }) => {
    expect(await shopPage.addToCartButtons.count()).toBe(5);
    for (const product of Object.values(PRODUCTS)) {
      await expect(page.getByText(product.name, { exact: true })).toBeVisible();
    }
  });

  test('adds a product to cart and it appears in the cart row', async ({ shopPage }) => {
    await shopPage.addToCart(PRODUCTS.nokia.name);
    await expect(shopPage.cartItemRow(PRODUCTS.nokia.name)).toBeVisible();
  });

  test('cart reflects correct products, prices and total for multiple items', async ({ shopPage }) => {
    const selected = [PRODUCTS.nokia, PRODUCTS.samsung, PRODUCTS.huawei];

    for (const product of selected) {
      await shopPage.addToCart(product.name);
    }

    for (const product of selected) {
      const row = shopPage.cartItemRow(product.name);
      await expect(row).toBeVisible();
      await expect(row.getByText(`$${product.price.toFixed(2)}`)).toBeVisible();
    }

    const expectedTotal = selected.reduce((sum, p) => sum + p.price, 0);
    const actualTotal   = await shopPage.getCartTotalAmount();
    expect(actualTotal).toBeCloseTo(expectedTotal, 2);
  });

  test('adding a duplicate item shows an alert and does not add it twice', async ({ page, shopPage }) => {
    await shopPage.addToCart(PRODUCTS.nokia.name);

    let alertMessage = '';
    page.once('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    await shopPage.addToCart(PRODUCTS.nokia.name);

    expect(alertMessage).toBe('This item is already added to the cart');
    expect(await shopPage.cartItemRow(PRODUCTS.nokia.name).count()).toBe(1);
  });

  test('removing an item updates the cart and reduces the total', async ({ shopPage }) => {
    await shopPage.addToCart(PRODUCTS.nokia.name);
    await shopPage.addToCart(PRODUCTS.samsung.name);
    const totalBefore = await shopPage.getCartTotalAmount();

    await shopPage.removeFromCart(PRODUCTS.nokia.name);

    await expect(shopPage.cartItemRow(PRODUCTS.nokia.name)).not.toBeVisible();
    const totalAfter = await shopPage.getCartTotalAmount();
    expect(totalAfter).toBeCloseTo(totalBefore - PRODUCTS.nokia.price, 2);
  });

  test.fixme('should not allow proceeding to shipping details with empty cart @cart @checkout', async ({ shopPage, page }) => {
  const shippingPage = new ShippingDetailsPage(page);

  await shopPage.proceedToCheckout();

  await expect(shippingPage.shippingDetailsHeader).not.toBeVisible();
  });
});
