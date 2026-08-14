# SKILLS.md — Claude Code Skills Reference

All slash commands and subagents available in this repository.
Skills are defined in `.claude/commands/` and `.claude/agents/`.

---

## Slash Commands

Invoke any skill by typing `/skill-name` in a Claude Code session.

---

### `/analyze-site`

**Definition:** `.claude/commands/analyze-site.md`

Navigates to the site defined in `site.config.json`, inspects the live DOM, and produces
a fully-populated config with all discovered values.

**Usage:**
```
/analyze-site
/analyze-site https://custom-url.com
```

**What it checks:**
- Page `<title>` and `<meta name="description">`
- Primary navigation: link text and `href` values
- Presence of `<form>` elements (especially with email fields)
- H1 and main heading text
- Primary CTA buttons
- Meta viewport tag and HTTPS status
- Favicon presence
- Horizontal overflow at 390px viewport

**Output:**
1. A complete `site.config.json` JSON block ready to paste into the repo
2. An issues checklist (missing meta, no HTTPS, broken links, missing alt text, etc.)
3. A confidence assessment (High / Medium / Low) with reasoning

**Edge cases handled:**
- SPAs: waits for `networkidle` + additional delay for hydration
- Cookie banners: dismisses before inspecting structure
- Auth-gated sites: sets `auth.required: true`, skips forms and visual
- Redirect chains: uses the final canonical URL

---

### `/generate-full-suite`

**Definition:** `.claude/commands/generate-full-suite.md`

Analyzes the live site and generates a complete Page Object Model plus test suite
covering all discoverable pages, forms, navigation, and interactive elements.

**Usage:**
```
/generate-full-suite
```

**Steps performed:**
1. Runs `/analyze-site` to discover site structure
2. Updates `site.config.json` with discovered values
3. Creates or updates page object classes in `src/pages/`
4. Generates test specs in `tests/` for all applicable categories
5. Updates `src/fixtures/site.fixture.ts` with any new page objects
6. Runs `npx tsc --noEmit` to verify TypeScript compiles cleanly

**Output:**
- New/updated files in `src/pages/`, `tests/`, and `src/fixtures/`
- TypeScript compilation status

---

### `/run-smoke`

**Definition:** `.claude/commands/run-smoke.md`

Executes all `@smoke`-tagged tests and reports a pass/fail summary.

**Usage:**
```
/run-smoke
```

**Output:**
- Console summary of passed/failed smoke tests
- Console errors captured during test runs
- Recommendation if smoke tests fail (site down, selector stale, etc.)

**When to use:**
- Quick sanity check before running the full suite
- Verifying the site is up after a deployment
- CI gate before deeper tests

---

### `/update-baseline`

**Definition:** `.claude/commands/update-baseline.md`

Refreshes all visual regression screenshot baselines by running Playwright with
`--update-snapshots`. Baselines are stored in `__snapshots__/`.

**Usage:**
```
/update-baseline
```

**When to use:**
- After intentional design changes to the site
- When visual tests are failing due to expected UI updates
- Initial setup (baselines don't exist yet on first run)

**Output:**
- Count of PNG baselines updated in `__snapshots__/`
- Warning if baseline update runs on a site that appears to be down

---

### `/generate-report`

**Definition:** `.claude/commands/generate-report.md`

Parses the latest test results from `test-results/results.json` and produces a
human-readable summary grouped by test category.

**Usage:**
```
/generate-report
```

**Output:**
- Total passed / failed / skipped counts
- Counts broken down by tag (`@smoke`, `@navigation`, etc.)
- List of failing tests with error messages and file locations
- Recommended next steps based on failure patterns

---

## Subagents

Subagents run automatically when Claude Code determines they're needed,
or can be mentioned explicitly in a prompt.

---

### `site-analyzer`

**Definition:** `.claude/agents/site-analyzer.md`

Crawls a live website using a headless browser context and produces a fully-populated
`site.config.json`. This agent is invoked by `/analyze-site` and `/generate-full-suite`.

**Capabilities:**
- Navigate to URLs with `waitUntil: 'networkidle'`
- Inspect DOM: text content, attributes, element counts
- Issue HTTP HEAD requests to check link status codes
- Follow redirects and identify the canonical URL
- Set viewport to mobile/tablet/desktop sizes
- Dismiss cookie consent banners

**Input:** `url` (required), `companyName` (optional override)

**Output:** A valid `site.config.json` object with all fields populated.

---

### `test-generator`

**Definition:** `.claude/agents/test-generator.md`

Reads a populated `site.config.json` and generates site-specific Playwright test files
for features not covered by the shared framework tests.

**Output:** `tests/custom/<scenario-name>.spec.ts`

**Invoked when:**
- Running `/generate-full-suite`
- A site has unique functionality (pricing calculators, video embeds, live chat)
- Regression tests are needed for a newly discovered bug
- Site-specific selectors are needed because generic ones fail

---

## Hooks

### `pre-test.sh`

**Definition:** `.claude/hooks/pre-test.sh`

Runs before any test command to verify the target site is reachable.
Issues a `curl` HEAD request to the URL in `site.config.json`.

**Behavior:**
- HTTP 2xx/3xx → "OK, site is reachable"
- HTTP 5xx → warning (proceeds anyway)
- Network timeout / curl error → warning (proceeds anyway)
- Always exits 0 — never blocks test execution

**Purpose:** Surface connectivity issues early, before Playwright tries to load pages
and produces harder-to-read errors.
