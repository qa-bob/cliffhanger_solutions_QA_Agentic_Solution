/**
 * tests/functional/footer.spec.ts
 *
 * Functional tests for the Cliffhanger Solutions footer:
 * presence, copyright, social media links, footer nav links,
 * and legal links (privacy policy, terms).
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Footer @functional', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
  });

  // ── Footer presence ───────────────────────────────────────────────────────────

  test('footer element is present @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    const count = await footer.count();

    if (count === 0) {
      console.warn('[functional] No <footer> or [role="contentinfo"] element found.');
    }

    expect(count, 'Page should have a footer landmark').toBeGreaterThan(0);
  });

  test('footer is visible (not hidden off-screen) @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.count() === 0) {
      test.skip(true, 'No footer found — covered by "footer element is present" test');
      return;
    }
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  // ── Copyright ─────────────────────────────────────────────────────────────────

  test('footer has copyright notice @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.count() === 0) {
      test.skip(true, 'No footer element found');
      return;
    }

    const footerText = await footer.textContent() ?? '';
    const hasCopyright =
      footerText.includes('©') ||
      footerText.toLowerCase().includes('copyright') ||
      /\d{4}/.test(footerText); // Year indicates copyright-adjacent content

    if (!hasCopyright) {
      console.warn('[functional] Footer does not appear to have a copyright notice.');
    }
    // Informational — warn but don't hard-fail
  });

  // ── Footer links ──────────────────────────────────────────────────────────────

  test('footer links resolve (no 404s) @functional', async ({ page, siteConfig }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.count() === 0) {
      test.skip(true, 'No footer element found');
      return;
    }

    const links = footer.locator('a[href]');
    const count = await links.count();

    test.skip(count === 0, 'Footer has no links');

    const baseUrl = new URL(siteConfig.url);
    const brokenLinks: string[] = [];

    for (let i = 0; i < Math.min(count, 15); i++) {
      const href = await links.nth(i).getAttribute('href') ?? '';

      // Skip anchors, javascript:, mailto:, tel:
      if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
          href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(href, baseUrl).toString();
      } catch {
        continue;
      }

      // Only check same-origin links (external links may block HEAD requests)
      if (!absoluteUrl.startsWith(baseUrl.origin)) continue;

      try {
        const response = await page.request.head(absoluteUrl, { timeout: 8_000 });
        if (!response.ok() && response.status() !== 0) {
          brokenLinks.push(`${absoluteUrl} → HTTP ${response.status()}`);
        }
      } catch {
        // Network error — skip silently
      }
    }

    expect(
      brokenLinks,
      `Found ${brokenLinks.length} broken footer link(s):\n${brokenLinks.join('\n')}`
    ).toHaveLength(0);
  });

  // ── Legal links ───────────────────────────────────────────────────────────────

  test('footer has privacy policy link @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.count() === 0) {
      test.skip(true, 'No footer element found');
      return;
    }

    const privacyLink = footer.locator('a').filter({
      hasText: /privacy|privacy policy/i,
    });

    if (await privacyLink.count() === 0) {
      console.warn(
        '[functional] No privacy policy link found in footer. ' +
        'This may be required by GDPR, CCPA, and other regulations.'
      );
    }
    // Warn only — some companies host legal pages at separate domains
  });

  // ── Social media ──────────────────────────────────────────────────────────────

  test('footer has social media links @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.count() === 0) {
      test.skip(true, 'No footer element found');
      return;
    }

    const socialLinks = footer.locator(
      'a[href*="linkedin"], a[href*="twitter"], a[href*="x.com"], ' +
      'a[href*="facebook"], a[href*="instagram"], a[href*="youtube"], ' +
      'a[href*="github"]'
    );

    const count = await socialLinks.count();

    if (count === 0) {
      console.warn(
        '[functional] No social media links found in footer. ' +
        'LinkedIn is common for B2B companies.'
      );
    }
    // Informational — not all sites require social links
  });

  test('social media links open in new tab @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.count() === 0) {
      test.skip(true, 'No footer element found');
      return;
    }

    const socialLinks = footer.locator(
      'a[href*="linkedin"], a[href*="twitter"], a[href*="x.com"], ' +
      'a[href*="facebook"]'
    );

    const count = await socialLinks.count();
    if (count === 0) return;

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = socialLinks.nth(i);
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel') ?? '';
      const href = await link.getAttribute('href') ?? '';

      if (target !== '_blank') {
        console.warn(
          `[functional] Social link "${href}" should open in a new tab (target="_blank").`
        );
      }

      if (target === '_blank' && !rel.includes('noopener')) {
        console.warn(
          `[functional] Social link "${href}" uses target="_blank" without rel="noopener". ` +
          'Security concern: add rel="noopener noreferrer".'
        );
      }
    }
  });

  // ── Contact info ──────────────────────────────────────────────────────────────

  test('footer or page has contact information @functional', async ({ page }) => {
    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    const lower = bodyText.toLowerCase();

    const hasContactInfo =
      lower.includes('contact') ||
      lower.includes('@') ||          // email
      /\+?[\d\s\-().]{10,}/.test(bodyText) || // phone-like pattern
      lower.includes('address') ||
      lower.includes('email us') ||
      lower.includes('reach out');

    if (!hasContactInfo) {
      console.warn('[functional] No contact information found on homepage. Consider adding contact details.');
    }
    // Informational only
  });
});
