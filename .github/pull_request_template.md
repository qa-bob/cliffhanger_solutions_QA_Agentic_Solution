## Description

<!-- What does this PR add or fix? One or two sentences. -->

## Test Category

<!-- Check all that apply -->
- [ ] `@smoke`
- [ ] `@navigation`
- [ ] `@forms`
- [ ] `@functional`
- [ ] `@visual`
- [ ] `@responsive`
- [ ] Page object / fixture update
- [ ] Infrastructure / config

## Checklist

- [ ] `npm run typecheck` passes with zero errors
- [ ] All new tests are tagged with at least one `@tag`
- [ ] No hardcoded URLs — `baseURL` / `siteConfig.url` used throughout
- [ ] No `expect()` calls inside page object methods
- [ ] No `page.waitForTimeout()` with values > 500ms
- [ ] No form submissions, account creation, or real credentials
- [ ] New page object classes registered in `src/fixtures/site.fixture.ts` (if applicable)
- [ ] Visual baselines updated in `__snapshots__/` (if visual tests changed)
- [ ] Selectors verified against live HTML (not guessed)

## Related Issues

<!-- Closes #... -->
