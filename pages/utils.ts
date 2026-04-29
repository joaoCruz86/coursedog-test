import { Page } from '@playwright/test';

const TRANSIENT_NAVIGATION_ERRORS = [
  'ERR_CONNECTION_RESET',
  'ERR_CONNECTION_CLOSED',
  'ERR_NETWORK_CHANGED',
  'ERR_EMPTY_RESPONSE',
  'ERR_CONNECTION_REFUSED',
];

// Retries page.goto on transient TCP-level failures. The qa-practice
// netlify free-tier site occasionally drops connections (cold starts,
// load-balancer hiccups), which surfaces as a hard ERR_CONNECTION_RESET
// rather than a slow load. Retrying at the navigation layer keeps
// test-level `retries` reserved for genuine test-side flakes.
export async function gotoWithRetry(
  page: Page,
  url: string,
  attempts = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.goto(url);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTransient = TRANSIENT_NAVIGATION_ERRORS.some(code => message.includes(code));
      if (!isTransient || attempt === attempts) throw err;
      await page.waitForTimeout(500 * attempt);
    }
  }
}
