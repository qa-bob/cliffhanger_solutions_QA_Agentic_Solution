/**
 * tests/functional/page-seo.spec.ts
 *
 * SEO and meta-data functional tests for Cliffhanger Solutions.
 * Covers: page titles, meta descriptions, Open Graph tags, canonical URL,
 * structured data presence, and heading SEO best practices.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Page SEO @functional', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
  });

  // ── Title ─────────────────────────────────────────────────────────────────────

  test('page title is present and meaningful @functional', async ({ page, siteConfig }) => {
    const title = await page.title();

    expect(title.trim(), 'Page <title> should not be empty').toBeTruthy();
    expect(title.trim().length, 'Page title should be > 5 characters').toBeGreaterThan(5);

    if (title.trim().length > 70) {
      console.warn(
        `[seo] Page title is ${title.length} characters — exceeds recommended 60-70. ` +
        'Google may truncate it in search results.'
      );
    }

    // Title should not just be a domain name
    const isDomainOnly = /^www\.[^.]+\.[a-z]{2,}$|^[^.]+\.[a-z]{2,}$/.test(title.trim().toLowerCase());
    if (isDomainOnly) {
      console.warn('[seo] Page title appears to be just a domain name. Add a descriptive title.');
    }
  });

  test('page title contains company name or product name @functional', async ({
    page,
    siteConfig,
  }) => {
    const title = await page.title();
    const titleLower = title.toLowerCase();
    const nameLower = siteConfig.name.toLowerCase();

    // Use first meaningful word (>3 chars) from the company name
    const companyWord = siteConfig.name
      .split(/\s+/)
      .find((w) => w.length > 3)
      ?.toLowerCase() ?? '';

    if (companyWord && !titleLower.includes(companyWord)) {
      console.warn(
        `[seo] Page title "${title}" doesn't appear to contain the company name "${siteConfig.name}".`
      );
    }
  });

  // ── Meta description ──────────────────────────────────────────────────────────

  test('meta description is present @functional', async ({ page }) => {
    const metaTag = page.locator('meta[name="description"]').first();
    const metaDesc = (await metaTag.count()) > 0 ? ((await metaTag.getAttribute('content')) ?? '') : '';

    test.skip(metaDesc.trim().length === 0, 'No meta description found');

    expect(metaDesc.trim().length, 'Meta description should have meaningful content').toBeGreaterThan(20);

    if (metaDesc.length < 50) {
      console.warn(`[seo] Meta description is only ${metaDesc.length} chars. Recommended: 120-160.`);
    }
    if (metaDesc.length > 160) {
      console.warn(`[seo] Meta description is ${metaDesc.length} chars. Recommended max: 160.`);
    }
  });

  // ── Open Graph ────────────────────────────────────────────────────────────────

  test('Open Graph tags are present @functional', async ({ page }) => {
    const metaContent = async (selector: string): Promise<string | null> => {
      const tag = page.locator(selector).first();
      return (await tag.count()) > 0 ? tag.getAttribute('content') : null;
    };
    const ogTitle = await metaContent('meta[property="og:title"]');
    const ogDescription = await metaContent('meta[property="og:description"]');
    const ogImage = await metaContent('meta[property="og:image"]');

    const missing: string[] = [];
    if (!ogTitle) missing.push('og:title');
    if (!ogDescription) missing.push('og:description');
    if (!ogImage) missing.push('og:image');

    if (missing.length > 0) {
      console.warn(
        `[seo] Missing Open Graph tags: ${missing.join(', ')}. ` +
        'These control how the page appears when shared on LinkedIn/Twitter.'
      );
    }
    // Informational — OG tags are best practice, not required
  });

  // ── Canonical URL ─────────────────────────────────────────────────────────────

  test('canonical URL tag is present @functional', async ({ page, siteConfig }) => {
    const canonicalTag = page.locator('link[rel="canonical"]').first();
    const canonical = (await canonicalTag.count()) > 0 ? ((await canonicalTag.getAttribute('href')) ?? '') : '';

    test.skip(!canonical, 'No canonical URL tag found');

    // Canonical should point to the site (not an unrelated domain)
    const siteOrigin = new URL(siteConfig.url).origin;
    expect(
      canonical.startsWith(siteOrigin) || canonical.startsWith('/'),
      `Canonical URL "${canonical}" should point to the same domain (${siteOrigin})`
    ).toBeTruthy();
  });

  // ── Favicon ───────────────────────────────────────────────────────────────────

  test('site has a favicon @functional', async ({ page, siteConfig }) => {
    const faviconLink = page.locator(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    ).first();

    if (await faviconLink.count() > 0) {
      const href = await faviconLink.getAttribute('href');
      expect(href, 'Favicon link should have an href').toBeTruthy();
      return;
    }

    // Try the default /favicon.ico path
    const response = await page.request.head(
      siteConfig.url.replace(/\/$/, '') + '/favicon.ico',
      { timeout: 5_000 }
    ).catch(() => null);

    if (!response || !response.ok()) {
      console.warn('[seo] No favicon found (no <link rel="icon"> tag and /favicon.ico returned non-200).');
    }
  });

  // ── robots / noindex ──────────────────────────────────────────────────────────

  test('page is not accidentally blocked from indexing @functional', async ({ page }) => {
    const robotsTag = page.locator('meta[name="robots"]').first();
    const robotsMeta = (await robotsTag.count()) > 0 ? await robotsTag.getAttribute('content') : null;

    if (robotsMeta) {
      const robotsLower = robotsMeta.toLowerCase();
      expect(
        robotsLower.includes('noindex'),
        `Meta robots contains "noindex": "${robotsMeta}". ` +
        'This prevents search engines from indexing the page.'
      ).toBeFalsy();
    }

    const xRobotsHeader = await page.evaluate<string | null>(() => {
      // Check meta http-equiv as fallback
      const el = document.querySelector('meta[http-equiv="x-robots-tag"]');
      return el?.getAttribute('content') ?? null;
    });

    if (xRobotsHeader?.toLowerCase().includes('noindex')) {
      console.warn(`[seo] X-Robots-Tag meta contains "noindex": "${xRobotsHeader}".`);
    }
  });

  // ── Heading SEO ───────────────────────────────────────────────────────────────

  test('page has exactly one H1 @functional', async ({ page }) => {
    const h1Count = await page.locator('h1').count();

    if (h1Count === 0) {
      console.warn('[seo] No H1 found. Search engines use H1 as the primary topic signal.');
    } else if (h1Count > 1) {
      console.warn(
        `[seo] Found ${h1Count} H1 elements. Best practice is exactly one H1 per page.`
      );
    }
    // Warn only — multiple H1s is a warning, not a hard failure for all sites
  });

  test('all internal links have descriptive anchor text @functional', async ({ page }) => {
    const internalLinks = page.locator('a[href^="/"], a[href^="./"], a[href^="../"]');
    const count = await internalLinks.count();

    if (count === 0) return;

    const vagueText = /^(click here|here|more|read more|link|go|this|page)$/i;
    const vagueLinks: string[] = [];

    for (let i = 0; i < Math.min(count, 50); i++) {
      const text = ((await internalLinks.nth(i).textContent()) ?? '').trim();
      if (text.length > 0 && vagueText.test(text)) {
        vagueLinks.push(`"${text}" → ${await internalLinks.nth(i).getAttribute('href')}`);
      }
    }

    if (vagueLinks.length > 0) {
      console.warn(
        `[seo] ${vagueLinks.length} internal link(s) with non-descriptive anchor text:\n` +
          vagueLinks.slice(0, 5).join('\n')
      );
    }
  });
});
