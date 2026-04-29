# QA Practice — Playwright Test Suite

[![CI](https://github.com/joaoCruz86/coursedog-test/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joaoCruz86/coursedog-test/actions/workflows/ci.yml)

End-to-end tests for the [QA Practice](https://qa-practice.netlify.app/auth_ecommerce) site, covering the e-commerce auth/order flow and file upload scenarios. Built as a take-home for the **Coursedog Data Integration QA Engineer** role.

The main deliverable is the **UI suite** — runs locally with nothing more than Node + Playwright. A bonus **API suite** was added as a separate set of tests as an additional exercise to demonstrate backend testing approach, focusing on request validation, response handling, and test structure. it requires Docker but is fully optional.

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

## Design decisions

**No hardcoded credentials.** `test-data/test.data.ts` reads `USER_EMAIL` / `USER_PASSWORD` from the environment via `requireEnv()`, which throws at startup with a clear message if either is missing. `.env` is git-ignored.

**POM with public-getter locators.** Each page object exposes locators as public getters; assertions live in the tests, not in the page objects. The only `expect*` methods on a page object are compound ones that assert 3+ elements together (e.g. `expectConfirmationContains()` validates price + street + city + country in the order summary).

**Stable, semantic locators.** Selectors prefer `getByRole`, `getByText`, and known IDs (`#logout`). CSS class names are avoided. Notable non-obvious locators are kept inside the page objects so tests stay readable.

**Two-project split in `playwright.config.ts`.** `chromium` ignores the API spec and runs against the live site; `api` matches only the API spec and points at the local Docker container. This means `npm test` never touches Docker.

**Shared fixtures.** `fixtures.ts` exposes `loginPage`, `shopPage`, `shippingDetailsPage` and `uploadPage`. `shopPage` handles login once so cart/checkout tests can focus on the scenario under test.

**Data integrity validation as a Data-Integration signal.** The cart and confirmation tests assert *exact* prices and addresses, and the upload suite validates the CSV schema and a specific cell value before upload. These are direct demonstrations of the kind of validation the role is about.

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
