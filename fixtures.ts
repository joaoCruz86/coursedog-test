import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { ShopPage } from './pages/shop.page';
import { ShippingDetailsPage } from './pages/shipping-details.page';
import { FileUploadPage } from './pages/file-upload.page';
import { CREDENTIALS } from './test-data/test.data';

type Fixtures = {
  loginPage: LoginPage;
  shopPage: ShopPage;
  shippingDetailsPage: ShippingDetailsPage;
  uploadPage: FileUploadPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
  },

  shopPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(CREDENTIALS.valid.email, CREDENTIALS.valid.password);

    const shopPage = new ShopPage(page);
    await expect(shopPage.addToCartButtons.first()).toBeVisible();

    await use(shopPage);
  },

  shippingDetailsPage: async ({ page }, use) => {
    const shippingDetailsPage = new ShippingDetailsPage(page);
    await use(shippingDetailsPage);
  },

  uploadPage: async ({ page }, use) => {
    const uploadPage = new FileUploadPage(page);
    await uploadPage.navigate();
    await use(uploadPage);
  },
});

export { expect } from '@playwright/test';
