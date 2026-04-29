import { test, expect } from '../fixtures';
import { ShopPage } from '../pages/shop.page';
import { CREDENTIALS } from '../test-data/test.data';

test.describe('Authentication', { tag: '@auth' }, () => {
  test('login with valid credentials and show the product list', async ({ page, loginPage }) => {
    await loginPage.login(CREDENTIALS.valid.email, CREDENTIALS.valid.password);

    const shopPage = new ShopPage(page);
    await expect(shopPage.addToCartButtons.first()).toBeVisible();
    await expect(shopPage.logoutButton).toBeVisible();
  });

  test('login with invalid credentials show an error message', async ({ loginPage }) => {
    await loginPage.login(CREDENTIALS.invalid.email, CREDENTIALS.invalid.password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('wrong password for valid email shows an error message', async ({ loginPage }) => {
    await loginPage.login(CREDENTIALS.wrongPassword.email, CREDENTIALS.wrongPassword.password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('empty email field prevents login', async ({ loginPage }) => {
    await loginPage.login('', CREDENTIALS.valid.password);
    expect(await loginPage.hasEmailValidationError()).toBe(true);
  });

  test('empty password field prevents login', async ({ loginPage }) => {
    await loginPage.login(CREDENTIALS.valid.email, '');
    expect(await loginPage.hasPasswordValidationError()).toBe(true);
  });

  test('logout redirects back to the login form', async ({ page, loginPage }) => {
    await loginPage.login(CREDENTIALS.valid.email, CREDENTIALS.valid.password);

    const shopPage = new ShopPage(page);
    await shopPage.logout();

    await loginPage.expectLoginFormVisible();
  });
});
