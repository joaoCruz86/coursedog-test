import { test, expect } from '@playwright/test';

const CREDENTIALS = { username: 'admin', password: 'admin' };

test.describe('Bonus: API tests', { tag: '@api' }, () => {
  test('GET /api/v1/employees returns the list of employees', async ({ request }) => {
    const response = await request.get('/api/v1/employees');
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('POST /api/v1/simulate/token returns a JWT for valid credentials', async ({ request }) => {
    const response = await request.post('/api/v1/simulate/token', { data: CREDENTIALS });
    expect(response.status()).toBe(200);

    const { token } = await response.json();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/simulate/get/employees returns 200 with a valid JWT', async ({ request }) => {
    const tokenRes = await request.post('/api/v1/simulate/token', { data: CREDENTIALS });
    const { token } = await tokenRes.json();

    const response = await request.get('/api/v1/simulate/get/employees', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('GET /api/v1/simulate/get/employees returns 401 when no token is provided', async ({ request }) => {
    const response = await request.get('/api/v1/simulate/get/employees');
    expect(response.status()).toBe(401);
  });
});
