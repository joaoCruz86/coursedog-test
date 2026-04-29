import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ShopPage } from '../pages/shop.page';
import { ShippingDetailsPage } from '../pages/shipping-details.page';
import { CREDENTIALS, PRODUCTS, SHIPPING } from '../test-data/test.data';

test('should allow a user to place an order from login to confirmation', { tag: ['@smoke', '@order'] }, async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(CREDENTIALS.valid.email, CREDENTIALS.valid.password);

  const shopPage = new ShopPage(page);
  await expect(shopPage.addToCartButtons.first()).toBeVisible();
  await shopPage.addToCart(PRODUCTS.nokia.name);
  await shopPage.proceedToCheckout();

  const shippingPage = new ShippingDetailsPage(page);
  await expect(shippingPage.submitOrderButton).toBeVisible();
  await shippingPage.fillShippingDetails(
    SHIPPING.valid.phone,
    SHIPPING.valid.street,
    SHIPPING.valid.city,
  );
  await shippingPage.selectCountry(SHIPPING.valid.country);
  await expect(shippingPage.countrySelect).toHaveValue(SHIPPING.valid.country);
  await shippingPage.submitOrder();
  await expect(shippingPage.confirmationMessage).toBeVisible();

  await shopPage.logout();
  await loginPage.expectLoginFormVisible();
});
