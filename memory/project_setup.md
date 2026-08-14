---
name: project-setup
description: Key facts about the Cliffhanger Solutions QA repo structure, fixed bugs, and conventions
metadata:
  type: project
---

Playwright + TypeScript test suite for http://www.cliffhanger-solutions.com (data visualization analytics for utility companies).

**Why:** Part of the Phoenix Startup QA Agentic Solutions project. Tests cover smoke, navigation, forms, functional, visual, and responsive categories using POM + OOP.

**How to apply:** Read site.config.json before any test work; use `/analyze-site` to inspect live HTML before writing selectors; run `npm run typecheck` before finishing.

**Fixed bug (2026-06-12):** The `@types/*` tsconfig path alias conflicted with TypeScript's built-in `@types` namespace (TS6137). Renamed to `@project-types/*` in tsconfig.json and updated the two affected imports in `src/fixtures/site.fixture.ts` and `src/pages/base.page.ts`.

**Site status:** http://www.cliffhanger-solutions.com was unreachable (ECONNREFUSED) at time of test generation. Functional tests use resilient selectors with graceful degradation. Re-run `/analyze-site` when the site is accessible to refine selectors.
