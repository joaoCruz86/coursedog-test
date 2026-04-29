import { Page } from '@playwright/test';

export class FileUploadPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get fileInput()      { return this.page.locator('input[type="file"]'); }
  get submitButton()   { return this.page.getByRole('button', { name: /submit/i }); }
  get successMessage() { return this.page.getByRole('alert').or(this.page.locator('.alert, .success, [class*="success"], [class*="upload"]')).first(); }

  async navigate(): Promise<void> {
    await this.page.goto('/file-upload');
  }

  async uploadFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async uploadAndSubmit(filePath: string): Promise<void> {
    await this.uploadFile(filePath);
    await this.submit();
  }

  async getUploadedFileName(): Promise<string> {
    return this.fileInput.evaluate((el: HTMLInputElement) => el.files?.[0]?.name ?? '');
  }
}
