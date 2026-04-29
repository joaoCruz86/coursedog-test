# QA Practice — Playwright Test Suite

[![CI](https://github.com/joaoCruz86/coursedog-test/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joaoCruz86/coursedog-test/actions/workflows/ci.yml)

End-to-end tests for the [QA Practice](https://qa-practice.netlify.app/auth_ecommerce) site, covering the e-commerce auth/order flow and file upload scenarios. Built as a take-home for the **Coursedog Data Integration QA Engineer** role.

The main deliverable is the **UI suite**, that runs locally with nothing more than Node + Playwright. A bonus **API suite** was added as a separate set of tests, as an additional exercise to demonstrate backend testing approach, focusing on request validation, response handling, and test structure. it requires Docker but is fully optional.

While Playwright enables cross-browser testing, this project uses Chromium to ensure consistent execution and simplify the scope of the exercise.

**Live CI:** [github.com/joaoCruz86/coursedog-test/actions](https://github.com/joaoCruz86/coursedog-test/actions) — every run includes a downloadable HTML report, traces, and (on failure) screenshots and videos.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 22 (Active LTS) |
| npm | ≥ 10 |
| Playwright | 1.52 (installed via `npm install`) |
| Docker | Only required for the bonus API suite |

---

## Setup

```bash
1. Install dependencies
npm install

2. Install the Chromium browser
npx playwright install chromium

3. Configure credentials
cp .env.example .env
.env already contains the public test creds (admin@admin.com / admin123)
```

The `.env` file is git-ignored. Credentials are never hardcoded, the suite throws a clear error at startup if `USER_EMAIL` or `USER_PASSWORD` are missing.

---

## Running tests (Playwright UI — no Docker required)

```bash
npm test            # full UI suite (chromium, headless)
npm run test:headed # UI suite with a visible browser window
npm run test:ui     # interactive Playwright UI mode
npm run report      # open the most recent HTML report
```

| Targeted commands | What it runs |
|---|---|
| `npm run test:auth` | Login / logout scenarios |
| `npm run test:upload` | File upload + CSV schema validation |
| `npx playwright test tests/shop-cart.spec.ts` | Cart behaviour |
| `npx playwright test tests/shipping-details.spec.ts` | Checkout form + confirmation |
| `npx playwright test tests/order-flow.spec.ts` | Full login > order > logout smoke |

---

## Running on CI (GitHub Actions)

The CI pipeline runs automatically on every push and pull request. Otherwise you can run it manualy as per below steps:

### Run manually

1. Go to the **Actions** tab in this repository
2. Select the **CI** workflow
3. Click **Run workflow**
4. Choose the branch (main) and confirm

The pipeline will:
- Start the API via Docker
- Run Playwright tests (UI + API)
- Generate a test report

## Test structure

```
├── pages/                         # Page Object Model — locators as public getters
│   ├── login.page.ts
│   ├── shop.page.ts
│   ├── shipping-details.page.ts
│   └── file-upload.page.ts
│
├── tests/
│   ├── auth.spec.ts               # 6 tests — login/logout + edge cases
│   ├── shop-cart.spec.ts          # 7 tests — add, remove, totals, duplicate alert
│   ├── shipping-details.spec.ts   # 4 tests — checkout form, validation, confirmation
│   ├── order-flow.spec.ts         # 1 e2e smoke — full login → order → logout journey
│   ├── file-upload.spec.ts        # 5 tests — CSV schema validation + upload behaviour
│   └── bonus-api.spec.ts          # 4 tests — bonus API suite (Docker)
│
├── test-data/
│   ├── test.data.ts               # CREDENTIALS, PRODUCTS, SHIPPING constants + requireEnv()
│   ├── csv-schema.ts              # CSV schema validator used by the upload suite
│   ├── paths.ts                   # samplePath() helper (no fs in page objects)
│   └── uploads/
│       ├── sample.csv             # well-formed test data
│       └── malformed.csv          # negative case for schema validation
│
├── fixtures.ts                    # loginPage / shopPage / shippingDetailsPage / uploadPage
├── playwright.config.ts           # 2 projects: chromium (UI) + api (Docker, bonus)
├── .env.example                   # Environment variable template
└── .github/workflows/ci.yml       # GitHub Actions matrix: chromium + api
```

**27 tests total** across 6 spec files: 23 UI (chromium project) + 4 API (api project).

---

## Scenarios covered

### Authentication ([`auth.spec.ts`](tests/auth.spec.ts))
- Valid credentials log in and show the product list
- Invalid credentials show an error message
- Wrong password for a valid email shows an error message
- Empty email field prevents login (HTML5 validation)
- Empty password field prevents login (HTML5 validation)
- Logout redirects back to the login form

### Shop & cart ([`shop-cart.spec.ts`](tests/shop-cart.spec.ts))
- All five products are listed by name
- Adding a product makes it appear in the cart row
- Cart reflects correct products, prices and total for multiple items *(data integrity)*
- Adding multiple items updates the cart total
- Adding a duplicate item triggers a native alert and does not add it twice
- Removing an item updates the cart and reduces the total
- *(fixme)* Empty cart should not allow proceeding to checkout — site bug, kept as `fixme` to surface it

### Shipping & checkout ([`shipping-details.spec.ts`](tests/shipping-details.spec.ts))
- Shipping form is visible after proceeding to checkout
- Submitting with empty required fields shows validation
- Valid shipping details allow the order to be submitted
- **Confirmation contains the correct price and shipping address** *(end-to-end data integrity)*

### Order flow ([`order-flow.spec.ts`](tests/order-flow.spec.ts))
- Single e2e smoke covering the brief's happy path: **login → add to cart → checkout → confirmation → logout**

### File upload ([`file-upload.spec.ts`](tests/file-upload.spec.ts))
- Valid CSV passes schema validation and contains the expected first row *(data integrity)*
- Malformed CSV fails schema validation and lists missing headers
- Uploading a valid CSV shows a success message
- Selected file name is reflected in the input before submit
- Submitting without a file does not show success

---

## Design Decisions

### Page Object Model
Each page is a class in [`pages/`](pages/) that encapsulates its locators and actions. Tests interact only with page methods and getters — never with raw locators directly — so a UI change is a one-line update in one file rather than a search-and-replace across specs.

Locators are exposed as **public getters** rather than wrapped in single-assertion methods like `isLoginButtonVisible()`. This keeps assertions where they belong — in the test — and avoids hiding `expect()` calls inside page objects, where a failure is harder to attribute to either the app or the test setup. The only `expect*` methods on a page object are *compound* ones that assert 3+ related elements together (e.g. `expectConfirmationContains()` validates price + street + city + country in the order summary in one call).

### Fixtures
[`fixtures.ts`](fixtures.ts) extends Playwright's base `test` with four fixtures — `loginPage`, `shopPage`, `shippingDetailsPage`, `uploadPage` — so individual specs stay focused on their scenario rather than repeating setup. Notably, the `shopPage` fixture performs login once before each cart/checkout test, while `loginPage` deliberately does **not** log in (so the auth suite can test the login flow itself). The split is intentional: setting up auth shouldn't be the same fixture used to test auth.

### Test Data
Fixed test inputs and expected values are centralised in [`test-data/test.data.ts`](test-data/test.data.ts):
- **`CREDENTIALS`** — login emails/passwords. The valid pair is read from environment variables via `requireEnv()`, which throws at startup with a clear message if `USER_EMAIL` or `USER_PASSWORD` is missing. The invalid/wrong-password variants are intentional constants for negative tests.
- **`PRODUCTS`** — product names paired with their **exact** prices. Tests assert these values directly, which is what catches a silent price-display bug.
- **`SHIPPING`** — phone, street, city, country used for the checkout flow.

Sample upload files live in [`test-data/uploads/`](test-data/uploads/), and CSV schema validation lives in [`test-data/csv-schema.ts`](test-data/csv-schema.ts). File-system concerns (path resolution) are kept out of page objects via the `samplePath()` helper in [`test-data/paths.ts`](test-data/paths.ts) — page objects model the UI only.

This data-integrity discipline (exact prices, exact addresses, schema-validated CSVs, specific cell values) is the most direct signal for the **Data Integration QA Engineer** role: every assertion verifies that a value flows through the system unchanged.

### Locator Strategy
Locators follow Playwright's recommended priority, from most to least stable:

1. **`getByRole`** — semantic, accessible, resilient to DOM restructuring. Used wherever an element has a meaningful role + accessible name (e.g. `getByRole('button', { name: /add to cart/i })`, `getByRole('heading', { name: 'Shipping Details' })`).
2. **`getByPlaceholder` / `getByText`** — used when no role is exposed but a stable text anchor exists (e.g. `getByPlaceholder(/phone/i)`, `getByText(/congrats/i)` for the confirmation message).
3. **Stable IDs** — used where the DOM exposes a unique, semantic ID (e.g. `#logout`, chosen because `getByText(/log.?out/i)` matched two elements on the page).
4. **CSS class names** — avoided as a default since they're presentational, but used pragmatically when the markup leaves no semantic hook. The cart row uses `.cart-row` filtered by product text — the only stable way to scope a row on this site — and the cart total wrapper uses `strong:has-text("Total")` then `..` to walk to the parent that holds the price text node.
5. **`.nth()` positional locators** — last resort. The shipping form's city input is `getByRole('textbox').nth(2)` because its label is a `<div>`, not a `<label>` element, so `getByLabel(/city/i)` does not bind to it. Documented inline so a future maintainer doesn't waste time second-guessing it.

Notable locator gotchas are kept inside the page objects (with comments where the choice is non-obvious) so the test bodies stay readable.

### Two-project split (`chromium` and `api`)
[`playwright.config.ts`](playwright.config.ts) defines two projects:
- **`chromium`** — the UI suite. Ignores `bonus-api.spec.ts`, runs against the live `qa-practice.netlify.app` site.
- **`api`** — the bonus API suite. Matches only `bonus-api.spec.ts`, points at `http://localhost:8887` (the Docker container).

This split is what makes `npm test` work with **zero Docker setup** — recruiters can clone, install, and run the main deliverable in under a minute. The API suite is opt-in via `npm run test:api` only when Docker is running.

### CI Configuration
[`playwright.config.ts`](playwright.config.ts) is tuned differently for local versus CI:
- **Workers**: `4` — fast local feedback. CI uses the same value; the suite is small enough that contention isn't an issue.
- **Retries**: `0` locally for fast feedback, `2` on CI (`process.env.CI ? 2 : 0`) to absorb network flakiness on shared runners without masking real failures.
- **`forbidOnly: !!process.env.CI`** — fails the build if anyone accidentally commits a `test.only(...)`.
- **Trace**: `on-first-retry` — full step-by-step trace captured the moment a flaky test retries, available in the HTML report for inspection.
- **Screenshots**: `only-on-failure` — keeps report size minimal while still capturing what went wrong.
- **Video**: `on-first-retry` — same trade-off as trace.
- **Reporter**: `[['html', { open: 'never' }], ['list']]` — the `list` reporter gives readable per-test progress in CI logs, while `html` produces the downloadable artifact.

---

## Continuous Integration (GitHub Actions)

Every push to `main` and every pull request runs the full suite on GitHub-hosted Ubuntu runners.

**Workflow:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

**What it does:**
1. Checks out the repo, sets up Node 22 with `npm` cache
2. `npm ci` installs deps
3. `npx playwright install --with-deps chromium` (UI leg only)
4. `docker run` starts the qa-practice-api container (API leg only) and a curl loop polls `/api/v1/employees` until it responds 200
5. Runs `playwright test --project=<chromium|api>`
6. Uploads the HTML report and (on failure) traces, videos and container logs as artifacts

**Matrix strategy:** the `chromium` (UI) and `api` jobs run in parallel via a matrix with `fail-fast: false`, so one leg failing doesn't cancel the other.

**Required GitHub repository secrets:**
- `USER_EMAIL` — login email for the auth tests
- `USER_PASSWORD` — login password for the auth tests

(Without these, `requireEnv()` throws at startup. Set them in **Settings → Secrets and variables → Actions**.)

### How to view CI runs and reports — no clone, no install

The repo is public, so anyone can browse the full CI history straight from GitHub:

1. **Open the Actions tab:** [github.com/joaoCruz86/coursedog-test/actions](https://github.com/joaoCruz86/coursedog-test/actions)
2. Click the most recent **CI** run to see both jobs (`Playwright (chromium)` and `Playwright (api)`) with per-step logs.
3. Scroll to the **Artifacts** section at the bottom of the run page and download `playwright-report-chromium` (and/or `playwright-report-api`).
4. Unzip it and open `index.html` in any browser — the full Playwright HTML report opens with status per test, durations, traces, screenshots, and videos for any failure.

### How to manually trigger a fresh run

The workflow has `workflow_dispatch` enabled, so anyone with write access (or anyone running it on a fork) can re-run the suite on demand:

- **From the GitHub UI:** Actions tab → **CI** workflow → **Run workflow** → pick `main` → **Run workflow**.
- **From the CLI:**
  ```bash
  gh workflow run ci.yml
  gh run watch
  ```

### From the CLI

If you have `gh` installed and prefer the terminal:

```bash
gh run view --web                                # open latest run in browser
gh run list                                      # list recent runs
gh run download --name playwright-report-chromium  # download the UI report
npx playwright show-report                       # open the downloaded report
```

---

## Bonus: API tests

A small API suite ([`tests/bonus-api.spec.ts`](tests/bonus-api.spec.ts)) exercises a practice REST API using Playwright's `request` fixture. It is isolated in its own `api` project — `npm test` does not touch it, and skipping it has no impact on UI coverage.

### Prerequisite

Docker installed and running.

### Start the API container

```bash
docker run -d --rm --name qa-practice-api -p 8887:8081 rvancea/qa-practice-api:latest
```

The container listens on port 8081 internally; the `8887:8081` mapping exposes it on `http://localhost:8887`. Swagger UI is then available at <http://localhost:8887/swagger-ui.html>.

### Run the suite

```bash
npm run test:api
```

To target a different host, set `API_BASE_URL` (defaults to `http://localhost:8887`):

```bash
API_BASE_URL=http://localhost:9000 npm run test:api
```

### Stop the container

```bash
docker stop qa-practice-api
```

### Coverage

- `GET /api/v1/employees` — basic list endpoint returns 200 and an array
- `POST /api/v1/simulate/token` — valid credentials return a JWT
- `GET /api/v1/simulate/get/employees` — protected endpoint returns 200 with a valid JWT
- `GET /api/v1/simulate/get/employees` — protected endpoint returns 401 with no token *(catches missing auth middleware — the most common production-side bug)*
