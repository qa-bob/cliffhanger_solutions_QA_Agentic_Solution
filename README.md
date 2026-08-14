# Cliffhanger Solutions — QA Agentic Solution

Automated regression, functional, and visual test suite for [Cliffhanger Solutions](http://www.cliffhanger-solutions.com/) — a data visualization analytics company serving utility companies.

Built with **Playwright + TypeScript** using the **Page Object Model (POM)** design pattern and **OOP** principles. Structured for agentic execution by [Claude Code](https://claude.ai/code).

---

## Quick Start

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18.0 |
| npm | 9.0 |
| Git | 2.x |

### Installation

```bash
# 1. Install Node dependencies
npm install

# 2. Install Playwright browser binaries
npx playwright install --with-deps chromium

# 3. Verify TypeScript compiles cleanly
npm run typecheck

# 4. Verify the site is reachable (optional sanity check)
bash .claude/hooks/pre-test.sh
```

### Run Tests

```bash
npm test                     # All tests, all browser projects
npm run test:smoke           # @smoke — availability and load checks
npm run test:navigation      # @navigation — nav links, menus, routing
npm run test:forms           # @forms — form fields and validation
npm run test:visual          # @visual — screenshot regression
npm run test:responsive      # @responsive — layout at mobile/tablet/desktop
npx playwright test --ui     # Interactive UI mode (great for debugging)
npx playwright test --headed # Visible browser window
npx playwright show-report   # Open the last HTML report
```

### Update Visual Baselines

Run this after intentional design changes on the target site:

```bash
npm run baseline
```

---

## What This Repo Tests

**Target:** `http://www.cliffhanger-solutions.com`
**Company:** Cliffhanger Solutions — data visualization analytics for utility companies

| Category | Tag | What It Verifies |
|----------|-----|-----------------|
| Smoke | `@smoke` | Site loads, HTTP 2xx, page title, no critical JS errors, HTTPS |
| Navigation | `@navigation` | Nav links present, no 404s, mobile menu toggle, logo link |
| Forms | `@forms` | Contact form presence, required fields, labels, HTML5 validation |
| Functional | `@functional` | Hero/CTAs, content sections, footer links, SEO meta, accessibility landmarks |
| Visual | `@visual` | Screenshot regression at desktop (1280px), mobile (390px), tablet (768px) |
| Responsive | `@responsive` | No horizontal overflow, readable text, image alt attributes, viewport meta |

Tests **never** submit forms, create accounts, or enter real credentials.

---

## Project Architecture

This project follows strict **Page Object Model (POM)** and **OOP** conventions:

```
site.config.json             ← Target URL, flags, viewport settings
playwright.config.ts         ← Browser projects, timeouts, reporters
src/
  pages/
    base.page.ts             ← BasePage base class (all page objects extend this)
    home.page.ts             ← HomePage
    navigation.page.ts       ← NavigationPage
    contact.page.ts          ← ContactFormPage
  fixtures/
    site.fixture.ts          ← Custom test fixtures (exposes page objects to tests)
  utils/
    link-checker.ts          ← HTTP link reachability helper
    visual-helper.ts         ← Cookie banner dismissal, screenshot utils
  types/
    site-config.types.ts     ← SiteConfig TypeScript interface
tests/
  smoke/                     ← Fast go/no-go checks
  navigation/                ← Routing and menu tests
  forms/                     ← Contact form validation
  functional/                ← Business logic, CTAs, SEO, accessibility
  visual/                    ← Screenshot regression
  responsive/                ← Layout breakpoint checks
.claude/
  commands/                  ← Slash command (skill) definitions
  agents/                    ← Subagent behavior files
  hooks/
    pre-test.sh              ← Pre-test reachability check
```

### POM Rules

1. Every page or major section gets one class in `src/pages/` that extends `BasePage`
2. Locators are `readonly Locator` properties — defined once, reused everywhere
3. Methods model **user actions** (click, fill, navigate) — never assertions
4. `expect()` calls belong in test files only, never inside page objects
5. Tests access page objects only through the fixture in `src/fixtures/site.fixture.ts`

---

## Claude Code Agent Setup

This repo is fully configured for [Claude Code](https://claude.ai/code).

### Key Configuration Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary instructions for Claude Code — architecture, rules, workflow |
| `AGENTS.md` | Instructions for all AI agents (Cursor, Copilot, Codex, etc.) |
| `SKILLS.md` | Full documentation for all slash commands and subagents |
| `.claude/settings.json` | Permissions and hook configuration |
| `.claude/commands/` | Slash command definitions (one `.md` per command) |
| `.claude/agents/` | Subagent behavior specs |
| `.claude/hooks/pre-test.sh` | Pre-test lifecycle hook |
| `site.config.json` | Target site URL and feature flags |

### Slash Commands (Skills)

Invoke any skill by typing `/command-name` in a Claude Code session:

| Command | What It Does |
|---------|-------------|
| `/analyze-site` | Crawl the live site and populate `site.config.json` with discovered values |
| `/generate-full-suite` | Analyze site structure and generate complete POM + test suite |
| `/run-smoke` | Run smoke tests and report pass/fail summary |
| `/update-baseline` | Refresh visual regression screenshot baselines |
| `/generate-report` | Parse test results and produce a human-readable summary |

See [SKILLS.md](./SKILLS.md) for full documentation on each skill.

### Subagents

| Agent File | Role |
|-----------|------|
| `.claude/agents/site-analyzer.md` | Crawls a live site and produces a populated `site.config.json` |
| `.claude/agents/test-generator.md` | Generates site-specific Playwright test files from `site.config.json` |

---

## .github Folder

The `.github/` directory contains GitHub-specific configuration:

| Path | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | GitHub Actions CI — runs tests on push/PR, uploads HTML report artifact |
| `.github/CONTRIBUTING.md` | Full contributor guide: adding tests, POM conventions, PR process |
| `.github/pull_request_template.md` | PR checklist: TypeScript, tags, no hardcoded URLs, baselines |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report template for test failures |
| `.github/ISSUE_TEMPLATE/test_request.md` | Template for requesting new test coverage |

---

## Contributor Rules

### Before Writing Tests

1. Read `site.config.json` — get the URL and feature flags (`hasContactForm`, `skipVisual`, etc.)
2. Inspect the live site — run `/analyze-site` or use `WebFetch` in Claude Code to check current HTML
3. Write selectors from **actual page HTML**, not guesses or generic placeholders

### Page Objects (`src/pages/`)

- One class per page or major section, extending `BasePage`
- Locators as `readonly Locator` properties
- Methods = actions only (click, fill, navigate)
- Zero `expect()` calls inside page objects

### Tests

- Import `{ test, expect }` from `@fixtures/site.fixture` only — never from `@playwright/test`
- Tag every test with at least one: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
- Base URL comes from `baseURL` in Playwright config — never hardcode `http://www.cliffhanger-solutions.com`
- Never submit forms, never create accounts, never enter real credentials
- No `page.waitForTimeout()` — use `waitForSelector`, `waitForLoadState`, or Playwright auto-waiting

### TypeScript

- `strict: true` is enabled — `any` must be justified with an inline comment
- Run `npm run typecheck` before pushing
- All page object properties must have explicit types

### Pull Request Checklist

See `.github/pull_request_template.md` for the full checklist.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_URL` | From `site.config.json` | Override the target site URL |
| `CI` | (unset) | Set by GitHub Actions — enables retries and reduces worker count |

---

## Troubleshooting

**Tests fail immediately with network errors**
Run `bash .claude/hooks/pre-test.sh` to check if the site is reachable. The site at
`http://www.cliffhanger-solutions.com` may use HTTP (not HTTPS) — the smoke test
for HTTPS will fail if the site doesn't redirect.

**Visual tests fail with pixel differences**
The site may have changed. Update baselines with `npm run baseline` after confirming
the changes are intentional.

**TypeScript errors after adding a page object**
Run `npm run typecheck` to see the full error. Common causes: missing `readonly` on
locators, `any` without annotation, or missing type on method return value.

**`Cannot find module '@fixtures/site.fixture'`**
Check `tsconfig.json` path aliases — `@fixtures/*` maps to `src/fixtures/*`.

---

*Part of the Phoenix Startup QA Agentic Solutions project.*
