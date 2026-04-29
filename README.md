# QA Practice — Playwright Test Suite

End-to-end tests for the [QA Practice](https://qa-practice.netlify.app) site, covering the e-commerce auth/order flow and file upload scenarios.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Playwright | 1.52 (installed via `npm install`) |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install the Chromium browser
npx playwright install chromium

# 3. Configure credentials
cp .env.example .env
# Fill in USER_EMAIL and USER_PASSWORD in .env
```

> The `.env` file is git-ignored. Credentials are never hardcoded — the test suite will throw a clear error if the required variables are missing.

---

## Running tests

The default `npm test` command runs the **UI suite only** (no Docker, no extra setup). The bonus API tests are opt-in — see [Bonus: API tests](#bonus-api-tests) below.

| Command | Description |
|---------|-------------|
| `npm test` | Run the UI suite (chromium project, headless) — **no Docker required** |
| `npm run test:headed` | Run the UI suite with a visible browser window |
| `npm run test:ui` | Open the interactive Playwright UI |
| `npm run test:auth` | Auth suite only |
| `npm run test:order` | Order flow suite only |
| `npm run test:upload` | File upload suite only |
| `npm run test:api` | Bonus API suite only (**requires Docker** — see below) |
| `npm run test:all` | UI **and** API suites (requires Docker) |
| `npm run report` | Open the last HTML report |

---

## Test structure

```
├── pages/                    # Page Object Model
│   ├── login.page.ts         # navigate(), login(), expectErrorVisible()
│   ├── shop.page.ts          # addToCart(), proceedToCheckout(), logout()
│   ├── checkout.page.ts      # fillShippingDetails(), submitOrder(), expectConfirmationContains()
│   └── file-upload.page.ts   # uploadFile(), submit(), expectSuccessVisible()
│
├── tests/
│   ├── auth.spec.ts          # 6 tests — login/logout happy path + edge cases
│   ├── order.spec.ts         # 5 tests — cart, checkout, data integrity
│   └── file-upload.spec.ts   # 5 tests — file types, input state, empty submit
│
├── test-data/
│   ├── test.data.ts          # Centralised credentials, products, shipping values
│   └── uploads/              # Sample files used by the upload tests
│
├── fixtures.ts               # loggedIn fixture — handles login before order tests
├── playwright.config.ts
├── .env.example              # Environment variable template
└── .env                      # Local credentials (git-ignored)
```

---

## Scenarios covered

### Authentication (`auth.spec.ts`)
- Valid credentials log in and show the product list
- Invalid credentials show an error message
- Wrong password for a valid email shows an error message
- Empty email field prevents login (HTML5 validation)
- Empty password field prevents login (HTML5 validation)
- Logout redirects back to the login form

### Order flow (`order.spec.ts`)
- Happy path — add one item, fill shipping details, submit and see confirmation
- **Confirmation message contains the correct price and shipping address** *(data integrity)*
- Cart shows all five products available to add
- Adding multiple items updates the cart total
- Submitting the checkout form with empty required fields shows validation

### File upload (`file-upload.spec.ts`)
- Uploading a `.txt` file shows a success message
- Uploading a `.pdf` file shows a success message
- Uploading a `.png` image shows a success message
- Selected file name is reflected in the input before submit
- Submitting without selecting a file does not show a success message

---

## Design decisions

**No hardcoded credentials** — `test-data/test.data.ts` reads `USER_EMAIL` and `USER_PASSWORD` from environment variables and throws at startup if either is missing. This prevents accidental credential leaks in version control.

**POM with focused responsibilities** — each page object exposes only the interactions its page owns. The `CheckoutPage` includes `expectConfirmationContains()` which asserts price and address are correctly reflected in the order summary, verifying end-to-end data integrity through the full purchase flow.

**Stable locators** — selectors prefer `getByRole`, `getByText`, and known element IDs (`#logout`). CSS class names are avoided where possible since they are presentational and change more frequently than semantic structure.

**Shared login fixture** — `fixtures.ts` exposes a `shopPage` fixture that handles login once before each order test, keeping test bodies focused on the scenario under test rather than setup boilerplate.

**Sample upload files are minimal and purpose-built** — `sample.txt`, `sample.pdf`, and `sample.png` contain no real data and are kept small to keep the repo lightweight.

---

## Bonus: API tests

A small API suite ([`tests/bonus-api.spec.ts`](tests/bonus-api.spec.ts)) exercises the practice REST API using Playwright's `request` fixture. It is isolated in its own `api` project in [`playwright.config.ts`](playwright.config.ts) so the UI suite can run on its own — `npm test` does not touch this suite, and skipping it has no impact on UI coverage.

### Prerequisite

Docker must be installed and running. (CPU virtualization must be enabled in BIOS — Docker Desktop will not start otherwise.)

### Start the API container

```bash
docker run -d --rm --name qa-practice-api -p 8887:8081 rvancea/qa-practice-api:latest
```

Swagger UI is then available at <http://localhost:8887/swagger-ui.html>.

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
