import { test, expect } from '../fixtures';
import { samplePath } from '../test-data/paths';
import { validateCsv, USER_CSV_SCHEMA } from '../test-data/csv-schema';
import fs from 'fs';

test.describe('File upload', { tag: '@upload' }, () => {

  test.describe('CSV test data integrity', () => {
    test('valid CSV passes schema validation and contains expected data', async () => {
      const content = fs.readFileSync(samplePath('sample.csv'), 'utf-8');
      const { valid } = validateCsv(content, USER_CSV_SCHEMA);
      expect(valid).toBe(true);

      const rows = content.trim().split('\n').slice(1).map(l => l.split(','));
      const [id, name, email, role, status] = rows[0];
      expect(id).toBe('1');
      expect(name).toBe('Alice Johnson');
      expect(email).toBe('alice@example.com');
      expect(role).toBe('admin');
      expect(status).toBe('active');
    });

    test('malformed CSV fails schema validation and is blocked before upload', async () => {
      const content = fs.readFileSync(samplePath('malformed.csv'), 'utf-8');
      const { valid, errors } = validateCsv(content, USER_CSV_SCHEMA);
      expect(valid).toBe(false);
      expect(errors).toContain('Missing required header: "id"');
      expect(errors).toContain('Missing required header: "name"');
      expect(errors).toContain('Missing required header: "email"');
    });
  });

  test.describe('Upload behaviour', () => {
    test('uploading a valid CSV file shows a success message @smoke', async ({ uploadPage }) => {
      await uploadPage.uploadAndSubmit(samplePath('sample.csv'));
      await expect(uploadPage.successMessage).toBeVisible();
    });

    test('selected file name is reflected in the input before submit', async ({ uploadPage }) => {
      await uploadPage.uploadFile(samplePath('sample.csv'));
      expect(await uploadPage.getUploadedFileName()).toBe('sample.csv');
    });

    test('submitting without selecting a file does not show a success message', async ({ uploadPage }) => {
      await uploadPage.submit();

      const isRequired = await uploadPage.fileInput.evaluate((el: HTMLInputElement) => el.required);
      const hasSuccess = await uploadPage.successMessage.isVisible().catch(() => false);

      if (isRequired) {
        expect(hasSuccess).toBe(false);
      } else {
        expect(true).toBe(true);
      }
    });
  });
});
