# Contributing to the QA Agentic Solution

This guide explains how to add tests, update page objects, and submit pull requests
for the Cliffhanger Solutions Playwright test suite.

---

## Before You Start

1. **Read `CLAUDE.md`** — the authoritative rules for this project
2. **Read `AGENTS.md`** — rules that apply to all AI and human contributors
3. **Check `site.config.json`** — confirms the target URL and which features are active
4. **Inspect the live site** — run `/analyze-site` in Claude Code, or use your browser's DevTools

Never write selectors from memory or guesses. Always verify against the actual page HTML.

---

## Development Setup

```bash
npm install
npx playwright install --with-deps chromium
npm run typecheck          # Should produce zero errors
```

---

## Adding a New Test

### 1. Identify the right test category

| You want to test... | Add to... | Tag with... |
|--------------------|-----------|-------------|
| Site loads, HTTP 200, no JS errors | `tests/smoke/` | `@smoke` |
| Nav links, menus, routing | `tests/navigation/` | `@navigation` |
| Form fields, labels, validation | `tests/forms/` | `@forms` |
| Business content, CTAs, SEO | `tests/functional/` | `@functional` |
| Screenshots, visual appearance | `tests/visual/` | `@visual` |
| Mobile/tablet layout | `tests/responsive/` | `@responsive` |

### 2. Check if a page object already exists

```bash
ls src/pages/
```

If the page already has a class, add your locators and methods there.
If not, create a new class that extends `BasePage`.

### 3. Create or update the page object

```typescript
// src/pages/services.page.ts
import { type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';

export class ServicesPage extends BasePage {
  readonly serviceCards: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.serviceCards = this.page.locator('[class*="service"], [class*="feature"]');
  }

  async getServiceCount(): Promise<number> {
    return this.serviceCards.count();
  }
}
```

Rules:
- Extend `BasePage`
- Locators as `readonly Locator` properties
- Methods = actions, no `expect()` calls

### 4. Register the page object in the fixture (if new)

If you created a new page class, add it to `src/fixtures/site.fixture.ts`:

```typescript
import { ServicesPage } from '@pages/services.page';

// Add to Fixtures interface:
servicesPage: ServicesPage;

// Add to test.extend():
servicesPage: async ({ page, siteConfig }, use) => {
  const servicesPage = new ServicesPage(page, siteConfig);
  await use(servicesPage);
},
```

### 5. Write the test

```typescript
// tests/functional/services.spec.ts
import { test, expect } from '@fixtures/site.fixture';

test.describe('Services Section @functional', () => {
  test('services section has at least one service card @functional', async ({ servicesPage, siteConfig }) => {
    await servicesPage.navigate();
    const count = await servicesPage.getServiceCount();
    expect(count, 'At least one service/feature card should be visible').toBeGreaterThan(0);
  });
});
```

Rules:
- Import from `@fixtures/site.fixture` only
- Tag every test
- Never hardcode URLs
- Never submit forms

### 6. Verify TypeScript

```bash
npm run typecheck
```

Fix any errors before opening a PR.

---

## Updating Visual Baselines

If you change visual test selectors or the site has had a confirmed design update:

```bash
npm run baseline
```

Commit the updated PNG files in `__snapshots__/` alongside your code changes.

---

## Running Tests Locally

```bash
# Run only the tests you changed
npx playwright test tests/functional/services.spec.ts

# Run with visible browser for debugging
npx playwright test tests/functional/services.spec.ts --headed

# Run in UI mode (interactive, great for building new tests)
npx playwright test --ui

# Run a specific tag
npm run test:functional
```

---

## Pull Request Process

1. Create a feature branch: `git checkout -b test/add-services-coverage`
2. Make your changes
3. Run `npm run typecheck` — must pass
4. Run the relevant test suite to confirm your tests work
5. Update baselines if visual tests changed
6. Open a PR using the PR template in `.github/pull_request_template.md`
7. A maintainer or Claude Code review will check for POM compliance

### PR Title Convention

```
test: add services section functional coverage
fix: update nav selector after site redesign
feat: add ServicesPage page object
chore: refresh visual regression baselines
```

---

## Common Mistakes

**Using raw `page.locator()` in tests**
Tests must use page object methods. Add the locator to the page object class.

**Hardcoding the site URL**
Use `siteConfig.url` from the fixture. Never type `http://www.cliffhanger-solutions.com` in a test.

**Calling `expect()` in a page object method**
Move the assertion into the test. Page objects are action-only.

**Using `page.waitForTimeout(5000)`**
Replace with `page.waitForSelector('...')` or `page.waitForLoadState('networkidle')`.

**Forgetting to tag the test**
Every test must have at least one `@tag` so it can be run in isolation.

---

## Questions?

Open an issue using the test request template in `.github/ISSUE_TEMPLATE/test_request.md`,
or ask Claude Code directly — it has full context about this repo's architecture.
