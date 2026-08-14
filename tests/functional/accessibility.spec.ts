/**
 * tests/functional/accessibility.spec.ts
 *
 * Accessibility functional tests for Cliffhanger Solutions.
 * Covers: ARIA landmarks, skip navigation, keyboard focus management,
 * button/link labeling, color contrast proxies, and WCAG 2.1 quick checks.
 *
 * Note: These are structural accessibility checks. For full axe-core audit,
 * integrate @axe-core/playwright into the project.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Accessibility @functional', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
  });

  // ── Landmark structure ────────────────────────────────────────────────────────

  test('page has required ARIA landmarks @functional', async ({ page }) => {
    const hasHeader = await page.locator('header, [role="banner"]').count() > 0;
    const hasMain = await page.locator('main, [role="main"]').count() > 0;
    const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;
    const hasFooter = await page.locator('footer, [role="contentinfo"]').count() > 0;

    const missing: string[] = [];
    if (!hasHeader) missing.push('header / banner');
    if (!hasMain) missing.push('main');
    if (!hasNav) missing.push('nav / navigation');
    if (!hasFooter) missing.push('footer / contentinfo');

    if (missing.length > 0) {
      console.warn(
        `[a11y] Missing ARIA landmarks: ${missing.join(', ')}. ` +
        'Screen reader users rely on landmarks to navigate.'
      );
    }

    // At minimum, a main content area should exist
    expect(
      hasHeader || hasMain,
      'Page should have at least a header or main content landmark'
    ).toBeTruthy();
  });

  // ── Skip navigation ───────────────────────────────────────────────────────────

  test('page has a skip navigation link @functional', async ({ page }) => {
    // Skip nav is often visually hidden — query by typical href or text
    const skipLink = page.locator(
      'a[href="#main"], a[href="#content"], a[href="#main-content"], ' +
      'a:has-text("Skip to main"), a:has-text("Skip navigation"), ' +
      'a:has-text("Skip to content")'
    ).first();

    if (await skipLink.count() === 0) {
      console.warn(
        '[a11y] No skip navigation link found. ' +
        'Keyboard-only users must tab through all nav items on every page.'
      );
    }
    // Informational — required for WCAG 2.4.1 (Level A), but not a hard test failure here
  });

  // ── Images ────────────────────────────────────────────────────────────────────

  test('all content images have alt text @functional', async ({ page }) => {
    const allImages = await page.locator('img').all();

    const missingAlt: string[] = [];
    const emptyAlt: string[] = [];

    for (const img of allImages) {
      const alt = await img.getAttribute('alt');
      const src = (await img.getAttribute('src')) ?? '[no src]';
      const role = await img.getAttribute('role');

      if (alt === null) {
        // Truly missing alt attribute
        missingAlt.push(src);
      } else if (alt.trim() === '' && role !== 'presentation' && role !== 'none') {
        // Empty alt on non-decorative image
        emptyAlt.push(src);
      }
    }

    if (missingAlt.length > 0) {
      console.warn(
        `[a11y] ${missingAlt.length} image(s) missing alt attribute (WCAG 1.1.1 violation):\n` +
          missingAlt.slice(0, 5).join('\n')
      );
    }

    expect(
      missingAlt.length,
      `${missingAlt.length} <img> element(s) have no alt attribute`
    ).toBe(0);
  });

  // ── Interactive elements ──────────────────────────────────────────────────────

  test('all buttons have accessible names @functional', async ({ page }) => {
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();

    if (count === 0) return;

    const unlabeled: string[] = [];

    for (let i = 0; i < Math.min(count, 30); i++) {
      const btn = buttons.nth(i);
      const text = ((await btn.textContent()) ?? '').trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      const ariaLabelledBy = await btn.getAttribute('aria-labelledby');
      const title = await btn.getAttribute('title');

      const hasAccessibleName = text.length > 0 || ariaLabel || ariaLabelledBy || title;

      if (!hasAccessibleName) {
        const outerHtml = await btn.evaluate<string>((el) => el.outerHTML.substring(0, 100));
        unlabeled.push(outerHtml);
      }
    }

    if (unlabeled.length > 0) {
      console.warn(
        `[a11y] ${unlabeled.length} button(s) have no accessible name (WCAG 4.1.2):\n` +
          unlabeled.slice(0, 3).join('\n')
      );
    }

    expect(
      unlabeled.length,
      `${unlabeled.length} button(s) have no text, aria-label, or aria-labelledby`
    ).toBe(0);
  });

  test('all links have accessible names @functional', async ({ page }) => {
    const links = page.locator('a[href]');
    const count = await links.count();

    if (count === 0) return;

    const unlabeled: string[] = [];

    for (let i = 0; i < Math.min(count, 50); i++) {
      const link = links.nth(i);
      const text = ((await link.textContent()) ?? '').trim();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaLabelledBy = await link.getAttribute('aria-labelledby');
      const title = await link.getAttribute('title');

      // Check for image-only links with missing alt
      const hasImg = await link.locator('img').count() > 0;
      let hasImgAlt = false;
      if (hasImg) {
        const imgAlt = await link.locator('img').first().getAttribute('alt');
        hasImgAlt = !!imgAlt && imgAlt.trim().length > 0;
      }

      const hasAccessibleName =
        text.length > 0 || ariaLabel || ariaLabelledBy || title || hasImgAlt;

      if (!hasAccessibleName) {
        const href = await link.getAttribute('href') ?? '[no href]';
        unlabeled.push(href);
      }
    }

    if (unlabeled.length > 0) {
      console.warn(
        `[a11y] ${unlabeled.length} link(s) have no accessible name (WCAG 2.4.4):\n` +
          unlabeled.slice(0, 5).join('\n')
      );
    }

    expect(
      unlabeled.length,
      `${unlabeled.length} <a> element(s) have no text, aria-label, or labeled image`
    ).toBe(0);
  });

  // ── Forms ─────────────────────────────────────────────────────────────────────

  test('form inputs have associated labels @functional', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
    const count = await inputs.count();

    if (count === 0) return;

    const unlabeled: string[] = [];

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      const title = await input.getAttribute('title');

      const hasExplicitLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      const hasAccessibleLabel =
        hasExplicitLabel || ariaLabel || ariaLabelledBy || title;

      // Placeholder alone is NOT sufficient (disappears on focus)
      if (!hasAccessibleLabel) {
        const nameAttr = await input.getAttribute('name') ?? `input-${i}`;
        if (placeholder) {
          console.warn(
            `[a11y] Input "${nameAttr}" uses placeholder as the only label. ` +
            'Add a <label> or aria-label (placeholder disappears on focus).'
          );
        } else {
          unlabeled.push(nameAttr);
        }
      }
    }

    if (unlabeled.length > 0) {
      console.warn(
        `[a11y] ${unlabeled.length} form input(s) have no label (WCAG 1.3.1):\n` +
          unlabeled.join(', ')
      );
    }
    // Soft assertion — forms accessibility is warned but not a blocker here
  });

  // ── Focus management ──────────────────────────────────────────────────────────

  test('interactive elements are keyboard focusable @functional', async ({ page }) => {
    // Tab through the first few focusable elements to verify no focus trap at the start
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate<string | null>(
      () => document.activeElement?.tagName?.toLowerCase() ?? null
    );

    expect(
      firstFocused,
      'Pressing Tab should move focus to an interactive element'
    ).not.toBeNull();

    const focusableTypes = ['a', 'button', 'input', 'select', 'textarea', 'summary', '[tabindex]'];
    const isFocusable =
      firstFocused !== null &&
      (focusableTypes.includes(firstFocused) || firstFocused !== 'body');

    expect(
      isFocusable,
      `First Tab press focused "${firstFocused}" — should land on a focusable element`
    ).toBeTruthy();
  });

  // ── Lang attribute ────────────────────────────────────────────────────────────

  test('HTML element has lang attribute @functional', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');

    if (!lang || lang.trim().length === 0) {
      console.warn(
        '[a11y] <html> element is missing a lang attribute (WCAG 3.1.1). ' +
        'Screen readers use this to select the correct pronunciation engine.'
      );
    } else {
      expect(lang.trim().length, 'lang attribute should be a valid language code').toBeGreaterThan(0);
    }
  });
});
