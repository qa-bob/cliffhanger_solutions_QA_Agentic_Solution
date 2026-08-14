---
name: Test Failure / Bug Report
about: A Playwright test is failing or producing unexpected results
labels: bug, test-failure
assignees: ''
---

## Test Name and File

<!-- e.g. "navigation menu is visible @navigation" in tests/navigation/nav-links.spec.ts -->

## Failure Type

- [ ] Test was passing, now fails (regression)
- [ ] Test has never passed (new test, bad selector)
- [ ] Flaky — sometimes passes, sometimes fails
- [ ] Wrong assertion — test is incorrect
- [ ] Site changed — selector is stale

## Error Message

```
Paste the full Playwright error output here.
```

## Steps to Reproduce

```bash
npx playwright test tests/<path>/<file>.spec.ts --headed
```

## Expected Behavior

<!-- What should the test do? -->

## Actual Behavior

<!-- What is the test actually doing? -->

## Environment

- OS: <!-- e.g. Windows 11, Ubuntu 22.04 -->
- Node.js version: <!-- node --version -->
- Playwright version: <!-- npx playwright --version -->
- Branch: <!-- git branch --show-current -->

## Site Status

<!-- Was the site reachable when this failed? Run: bash .claude/hooks/pre-test.sh -->

## Additional Context

<!-- Screenshots, HTML snippets, or anything else useful -->
