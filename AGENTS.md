# AGENTS.md — AI Coding Agent Instructions

> This file provides instructions for AI coding agents: Cursor, GitHub Copilot, OpenAI Codex,
> Google Gemini Code Assist, and others.
>
> **Claude Code** reads `CLAUDE.md` instead — that file imports this one via `@AGENTS.md`.
> See `CLAUDE.md` for Claude-specific additions on top of these shared rules.

---

## Project Overview

This is a **Playwright + TypeScript regression test suite** for the website in `site.config.json`.

The current target is **[Cliffhanger Solutions](http://www.cliffhanger-solutions.com/)** — a
data visualization analytics company serving utility companies.

Architecture: **Page Object Model (POM)** with **OOP** principles.

---

## Target Site

Read `site.config.json` first. It is the authoritative source for:

| Field | Description |
|-------|-------------|
| `url` | Target site URL — always use this, never hardcode it |
| `name` | Company name |
| `hasContactForm` | Whether to run form tests |
| `skipVisual` | Whether to skip screenshot regression |
| `skipForms` | Whether to skip form tests |
| `expectedNavItems` | Known nav link labels |
| `viewports` | Which viewport sizes to test |
| `auth.required` | Whether the site requires login |

---

## Key Files

| File | Purpose |
|------|---------|
| `site.config.json` | Target URL and feature flags |
| `playwright.config.ts` | Browser projects, timeouts, reporters |
| `src/pages/base.page.ts` | BasePage — all page objects extend this |
| `src/pages/*.page.ts` | Page Object Model classes, one per page/section |
| `src/fixtures/site.fixture.ts` | Custom test fixtures exposing page objects |
| `src/utils/link-checker.ts` | HTTP link reachability helper |
| `src/utils/visual-helper.ts` | Cookie banner dismissal, screenshot helpers |
| `src/types/site-config.types.ts` | SiteConfig TypeScript interface |
| `tests/smoke/` | `@smoke` tests |
| `tests/navigation/` | `@navigation` tests |
| `tests/forms/` | `@forms` tests |
| `tests/functional/` | `@functional` tests |
| `tests/visual/` | `@visual` tests |
| `tests/responsive/` | `@responsive` tests |

---

## Architecture Rules

### Page Objects (`src/pages/`)

- Every page or major section has exactly **one class** extending `BasePage`
- Locators must be `readonly Locator` properties defined on the class
- Methods model user **actions** (navigate, click, fill) — never assertions
- **No `expect()` calls inside page object methods** — assertions belong in tests
- Use semantic/role-based selectors: `getByRole`, `getByText`, `[aria-label]`, `[data-testid]`
- Avoid brittle selectors: no XPath, no deeply nested CSS, no auto-generated class names

### Tests (`tests/`)

- Always import `{ test, expect }` from `@fixtures/site.fixture` — never from `@playwright/test`
- Tag every test with at least one of: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
- Never hardcode the base URL — use `baseURL` from Playwright config (reads `site.config.json`)
- Never submit forms, create accounts, or log in (unless `auth.required: true` in config)
- No `page.waitForTimeout()` — use `waitForSelector`, `waitForLoadState`, or Playwright auto-waiting
- No `page.locator()` raw calls inside test bodies — go through page object methods

### TypeScript

- `strict: true` is enabled — avoid `any`; if necessary, annotate with a comment explaining why
- Run `npx tsc --noEmit` before committing to verify clean compilation
- All page object properties must have explicit types

---

## Test Categories

| Directory | Tag | What to put here |
|-----------|-----|-----------------|
| `tests/smoke/` | `@smoke` | Does the site load? HTTP 200? Title present? No JS errors? |
| `tests/navigation/` | `@navigation` | Nav links work? No 404s? Mobile menu toggles? Logo links home? |
| `tests/forms/` | `@forms` | Form fields present? Labels? HTML5 required validation? No submission |
| `tests/functional/` | `@functional` | Business content: hero, CTAs, services, footer, SEO meta, accessibility |
| `tests/visual/` | `@visual` | Screenshot regression with `toHaveScreenshot()` |
| `tests/responsive/` | `@responsive` | No horizontal scroll, readable text, images have alt, viewport meta |

---

## npm Scripts

```bash
npm test                 # All tests
npm run test:smoke       # @smoke only
npm run test:navigation  # @navigation only
npm run test:forms       # @forms only
npm run test:visual      # @visual only
npm run test:responsive  # @responsive only
npm run baseline         # Update visual snapshots
npm run typecheck        # TypeScript check
npm run lint             # ESLint
```

---

## DO NOT

- Submit any form
- Create accounts or log in (unless `auth.required: true` in `site.config.json`)
- Hardcode the base URL (`http://www.cliffhanger-solutions.com`) in any test file
- Add `expect()` assertions inside page object methods
- Use `page.waitForTimeout()` with values > 500ms
- Use `any` type without a justifying comment
- Write raw `page.locator()` calls in test bodies — always use page object methods
- Introduce new npm dependencies without discussion
- Modify `playwright.config.ts` browser projects without discussion
