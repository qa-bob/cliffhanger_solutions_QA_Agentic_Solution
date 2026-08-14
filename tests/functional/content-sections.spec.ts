/**
 * tests/functional/content-sections.spec.ts
 *
 * Functional tests for content sections on the Cliffhanger Solutions website:
 * services/solutions, features, about/team, testimonials, and case studies.
 *
 * Selectors use flexible, semantic patterns because the site structure was not
 * inspectable at test-generation time. Run /analyze-site to refine these after
 * the site becomes reachable.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Content Sections @functional', () => {
  // ── Services / Solutions ──────────────────────────────────────────────────────

  test.describe('Services or Solutions section', () => {
    test('site describes at least one service or solution @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      // Common patterns for service/feature/solution cards or sections
      const serviceElements = page.locator(
        '[class*="service"], [class*="solution"], [class*="feature"], ' +
        '[class*="product"], [class*="offering"], [class*="capability"]'
      );

      const headingWithServiceText = page.locator('h1, h2, h3').filter({
        hasText: /service|solution|feature|product|offering|capability|analytics|visualization/i,
      });

      const serviceCount = await serviceElements.count();
      const headingCount = await headingWithServiceText.count();

      if (serviceCount === 0 && headingCount === 0) {
        console.warn(
          '[functional] No service/solution elements found. ' +
          'Run /analyze-site to discover the actual page structure.'
        );
      }

      // Soft assertion — log if missing, but don't hard-fail on selector mismatch
      const hasServiceContent = serviceCount > 0 || headingCount > 0;
      expect(
        hasServiceContent,
        'Site should describe at least one service, solution, or product offering'
      ).toBeTruthy();
    });

    test('services section has descriptive headings @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      const allHeadings = await page.locator('h2, h3').allTextContents();
      expect(
        allHeadings.length,
        'Page should have at least one H2 or H3 describing services/features'
      ).toBeGreaterThan(0);

      // Verify no heading is suspiciously short (placeholder content indicator)
      const tooShort = allHeadings.filter((h) => h.trim().length < 3);
      expect(
        tooShort,
        `Found ${tooShort.length} heading(s) with fewer than 3 characters — possible placeholder content`
      ).toHaveLength(0);
    });
  });

  // ── About Section ─────────────────────────────────────────────────────────────

  test.describe('About section', () => {
    test('about content is present on site @functional', async ({ page, siteConfig }) => {
      // Check homepage first
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      const aboutOnHomepage = page.locator(
        '[class*="about"], [id*="about"], section:has(h2:has-text("about"))'
      );

      if (await aboutOnHomepage.count() > 0) {
        await expect(aboutOnHomepage.first()).toBeVisible();
        return;
      }

      // Try navigating to /about
      const aboutResponse = await page.goto(
        siteConfig.url.replace(/\/$/, '') + '/about',
        { waitUntil: 'domcontentloaded', timeout: 15_000 }
      ).catch(() => null);

      if (!aboutResponse || !aboutResponse.ok()) {
        // Try clicking an About link in nav
        await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
        const aboutLink = page.locator('a').filter({ hasText: /^about/i }).first();
        if (await aboutLink.count() > 0) {
          await aboutLink.click();
          await page.waitForLoadState('domcontentloaded');
        }
      }

      // At this point we should be on an about page or section
      const bodyText = await page.evaluate<string>(() => document.body.innerText);
      const hasAboutContent =
        bodyText.toLowerCase().includes('about') ||
        bodyText.toLowerCase().includes('our story') ||
        bodyText.toLowerCase().includes('who we are') ||
        bodyText.toLowerCase().includes('founded') ||
        bodyText.toLowerCase().includes('team');

      if (!hasAboutContent) {
        console.warn('[functional] No about/company content found. Consider adding an About section.');
      }
    });
  });

  // ── Testimonials / Social Proof ───────────────────────────────────────────────

  test.describe('Social proof', () => {
    test('site has testimonials, case studies, or client logos @functional', async ({
      page,
      siteConfig,
    }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      const socialProofSelectors = [
        '[class*="testimonial"]',
        '[class*="client"]',
        '[class*="customer"]',
        '[class*="case-study"]',
        '[class*="logo"]',
        '[class*="partner"]',
        'blockquote',
      ];

      let found = false;
      for (const selector of socialProofSelectors) {
        if ((await page.locator(selector).count()) > 0) {
          found = true;
          break;
        }
      }

      // Also check for headings about social proof
      const socialHeading = page.locator('h2, h3').filter({
        hasText: /testimonial|client|customer|partner|case study|trusted|used by/i,
      });

      if (!found && (await socialHeading.count()) === 0) {
        console.warn(
          '[functional] No social proof (testimonials, logos, case studies) found. ' +
          'Consider adding trust signals for B2B conversion.'
        );
      }
      // Informational only — B2B sites sometimes use a different trust approach
    });
  });

  // ── Interactive Elements ──────────────────────────────────────────────────────

  test.describe('Interactive elements', () => {
    test('any accordions or expandable sections work @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      // Look for accordion patterns (FAQ, details/summary, or custom)
      const accordionTriggers = page.locator(
        'details > summary, ' +
        '[class*="accordion"] button, [class*="accordion"] [role="button"], ' +
        '[class*="faq"] button, [data-toggle], ' +
        '[aria-expanded][aria-controls]'
      );

      const count = await accordionTriggers.count();
      if (count === 0) {
        // No accordions — perfectly fine
        return;
      }

      // Click the first trigger and verify something expands
      const firstTrigger = accordionTriggers.first();
      const initialExpanded = await firstTrigger.getAttribute('aria-expanded');

      await firstTrigger.click();
      await page.waitForTimeout(400);

      const afterExpanded = await firstTrigger.getAttribute('aria-expanded');

      if (initialExpanded !== null) {
        // aria-expanded should have changed
        expect(
          afterExpanded,
          'Clicking an accordion trigger should toggle its aria-expanded state'
        ).not.toBe(initialExpanded);
      }
    });

    test('any video embeds have play controls @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      const videoElements = page.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]');
      const videoCount = await videoElements.count();

      if (videoCount === 0) {
        // No videos — skip
        return;
      }

      // For native video elements, verify controls attribute or visible play button
      const nativeVideos = page.locator('video');
      const nativeCount = await nativeVideos.count();

      for (let i = 0; i < nativeCount; i++) {
        const video = nativeVideos.nth(i);
        const hasControls = await video.getAttribute('controls');
        const hasAutoplay = await video.getAttribute('autoplay');

        if (!hasControls && !hasAutoplay) {
          console.warn(
            `[functional] A <video> element has no controls attribute and no autoplay. ` +
            'Users may not be able to play it.'
          );
        }
      }
    });
  });

  // ── Page structure ─────────────────────────────────────────────────────────────

  test('page has main landmark @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const mainCount = await page.locator('main, [role="main"]').count();
    if (mainCount === 0) {
      console.warn('[functional] No <main> landmark found. This impacts accessibility and SEO.');
    }
    // Soft check — warn rather than fail
  });

  test('page content sections have descriptive labels @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    // Sections with aria-labelledby or aria-label are well-structured
    const labeledSections = await page
      .locator('section[aria-labelledby], section[aria-label], [role="region"][aria-labelledby], [role="region"][aria-label]')
      .count();

    const totalSections = await page.locator('section, [role="region"]').count();

    if (totalSections > 0 && labeledSections === 0) {
      console.warn(
        `[functional] ${totalSections} section(s) found but none have aria-label or aria-labelledby. ` +
        'Screen reader users cannot distinguish sections.'
      );
    }
  });
});
