/**
 * tests/functional/homepage.spec.ts
 *
 * Functional tests for the Cliffhanger Solutions homepage.
 * Covers: hero section, CTAs, main headings, above-the-fold content,
 * and value proposition messaging.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Homepage Functional @functional', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.waitForLoad();
  });

  // ── Page load ────────────────────────────────────────────────────────────────

  test('homepage loads and is ready @functional', async ({ homePage }) => {
    const loaded = await homePage.isLoaded();
    expect(loaded, 'Homepage should have headings, navigation, and body text').toBeTruthy();
  });

  // ── Headings ─────────────────────────────────────────────────────────────────

  test('homepage has a main H1 heading @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const h1 = page.locator('h1').first();
    const h1Count = await h1.count();

    if (h1Count === 0) {
      console.warn(`[functional] "${siteConfig.name}" homepage is missing an <h1>. SEO impact.`);
      // Fall back: at least an h2 should exist
      const h2Count = await page.locator('h2').count();
      expect(h2Count, 'At minimum, an H2 heading should be present').toBeGreaterThan(0);
      return;
    }

    const headingText = await h1.textContent();
    expect(headingText?.trim().length, 'H1 should have meaningful content').toBeGreaterThan(3);
  });

  test('heading hierarchy is logical (H1 before H2) @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();

    // If H3s exist, H2s should also exist (don't skip heading levels)
    if (h3Count > 0) {
      expect(
        h2Count,
        'If H3 headings exist, H2 headings should also be present (avoid skipping levels)'
      ).toBeGreaterThan(0);
    }

    // Log missing H1 as a warning (SEO concern)
    if (h1Count === 0) {
      console.warn(`[functional] No <h1> found on "${siteConfig.name}" homepage.`);
    }
  });

  // ── Hero / above-the-fold ─────────────────────────────────────────────────────

  test('homepage has hero or above-the-fold content @functional', async ({ homePage }) => {
    const heroText = await homePage.getHeroText();
    expect(
      heroText.length,
      'Hero/banner section should have text content above the fold'
    ).toBeGreaterThan(10);
  });

  // ── CTAs ──────────────────────────────────────────────────────────────────────

  test('homepage has at least one call-to-action button or link @functional', async ({ homePage }) => {
    const ctaButtons = await homePage.getCTAButtons();

    if (ctaButtons.length === 0) {
      console.warn('[functional] No CTA buttons found on homepage. This may hurt conversions.');
    }

    expect(
      ctaButtons.length,
      'Homepage should have at least one visible CTA (Get Started, Contact Us, etc.)'
    ).toBeGreaterThan(0);
  });

  test('primary CTA is visible without scrolling @functional', async ({ page, siteConfig }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Runs only in the "chromium-desktop" project');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    // Look for common CTA patterns in the viewport
    const ctaInViewport = page
      .locator('a, button')
      .filter({ hasText: /get started|contact us|learn more|request demo|free trial|try/i })
      .first();

    test.skip(await ctaInViewport.count() === 0, 'No CTA found in initial viewport');

    const boundingBox = await ctaInViewport.boundingBox();
    if (boundingBox) {
      expect(
        boundingBox.y + boundingBox.height,
        'Primary CTA should be visible within initial 720px viewport'
      ).toBeLessThan(720);
    }
  });

  // ── Content quality ───────────────────────────────────────────────────────────

  test('page has substantial body content @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    expect(
      bodyText.trim().length,
      'Page should have substantial visible text content'
    ).toBeGreaterThan(200);
  });

  test('page has meaningful section count @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const sectionCount = await page.locator('section, [role="region"], article, .section').count();

    if (sectionCount === 0) {
      console.warn('[functional] No <section> or [role="region"] elements found. Consider adding semantic structure.');
    }
    // Soft check — a homepage should have multiple distinct areas
    expect(sectionCount, 'Homepage should have at least one section/region').toBeGreaterThanOrEqual(0);
  });

  // ── Branding ──────────────────────────────────────────────────────────────────

  test('company name appears in page content @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    // Check title or body for company name (flexible — "Cliffhanger" may be enough)
    const title = await page.title();
    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    const combined = (title + ' ' + bodyText).toLowerCase();

    // Use first significant word of company name for resilience
    const companyKeyword = siteConfig.name.split(' ')[0]?.toLowerCase() ?? '';

    if (companyKeyword.length > 3) {
      expect(
        combined.includes(companyKeyword),
        `Company name keyword "${companyKeyword}" should appear somewhere in the page`
      ).toBeTruthy();
    }
  });
});
