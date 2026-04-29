import { test, expect } from '../fixtures';
import { PRODUCTS, SHIPPING } from '../test-data/test.data';

test.describe('Shipping details', { tag: '@checkout' }, () => {
  test.beforeEach(async ({ shopPage }) => {
    await shopPage.addToCart(PRODUCTS.nokia.name);
    await shopPage.proceedToCheckout();
  });

  test('shipping form is visible after proceeding to checkout', async ({ shippingDetailsPage }) => {
    await expect(shippingDetailsPage.submitOrderButton).toBeVisible();
    await expect(shippingDetailsPage.phoneInput).toBeVisible();
    await expect(shippingDetailsPage.cityInput).toBeVisible();
    await expect(shippingDetailsPage.countrySelect).toBeVisible();
    await expect(shippingDetailsPage.submitOrderButton).toBeVisible();
  });

  test('submitting with empty required fields shows validation', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.submitOrder();
    expect(await shippingDetailsPage.hasFormValidationError()).toBe(true);
  });

  test('valid shipping details allow the order to be submitted', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.fillShippingDetails(
      SHIPPING.valid.phone,
      SHIPPING.valid.street,
      SHIPPING.valid.city,
    );
    await shippingDetailsPage.selectCountry(SHIPPING.valid.country);
    await expect(shippingDetailsPage.countrySelect).toHaveValue(SHIPPING.valid.country);
    await shippingDetailsPage.submitOrder();
    await expect(shippingDetailsPage.confirmationMessage).toBeVisible();
  });

  test('confirmation contains the correct price and shipping address', async ({ shippingDetailsPage }) => {
    await shippingDetailsPage.fillShippingDetails(
      SHIPPING.valid.phone,
      SHIPPING.valid.street,
      SHIPPING.valid.city,
    );
    await shippingDetailsPage.selectCountry(SHIPPING.valid.country);
    await expect(shippingDetailsPage.countrySelect).toHaveValue(SHIPPING.valid.country);
    await shippingDetailsPage.submitOrder();
    await shippingDetailsPage.expectConfirmationContains(
      `$${PRODUCTS.nokia.price.toFixed(2)}`,
      SHIPPING.valid.street,
      SHIPPING.valid.city,
      SHIPPING.valid.country,
    );
  });
});
