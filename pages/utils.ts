import { Page } from '@playwright/test';

const TRANSIENT_NAVIGATION_ERRORS = [
  'ERR_CONNECTION_RESET',
  'ERR_CONNECTION_CLOSED',
  'ERR_NETWORK_CHANGED',
  'ERR_EMPTY_RESPONSE',
  'ERR_CONNECTION_REFUSED',
  'ERR_ABORTED',
  'frame was detached',
  'Timeout',
];

// Retries page.goto on transient navigation failures. The qa-practice
// netlify free-tier site occasionally drops connections (cold starts,
// load-balancer hiccups) and sometimes never fires the `load` event
// because a third-party resource hangs. We use `domcontentloaded` to
// avoid blocking on those resources — Playwright auto-waits on the
// next locator anyway — and bound each attempt so a single hang can't
// eat the whole test budget.
export async function gotoWithRetry(
  page: Page,
  url: string,
  attempts = 3,
  perAttemptTimeoutMs = 15_000,
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: perAttemptTimeoutMs,
      });
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTransient = TRANSIENT_NAVIGATION_ERRORS.some(code => message.includes(code));
      if (!isTransient || attempt === attempts) throw err;
      await page.waitForTimeout(500 * attempt);
    }
  }
}
