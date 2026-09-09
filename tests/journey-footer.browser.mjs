import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  for (const test of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'small-phone', width: 320, height: 667 },
    { name: 'country', width: 390, height: 844, path: '/asia/maldives', hash: '#cd-hero' },
    { name: 'arabic', width: 390, height: 844, arabic: true },
    { name: 'reduced-motion', width: 1440, height: 900, reduce: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, reducedMotion: test.reduce ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
    if (test.arabic) await context.addInitScript(() => localStorage.setItem('trc-lang', 'ar'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + (test.path || '/'));
    const footer = page.locator('#journey-footer');
    await footer.waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => !document.querySelector('.premium-loader.is-active'));
    await page.waitForTimeout(400);
    await footer.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('#journey-footer').classList.contains('has-arrived'));
    await page.waitForTimeout(950);
    assert.equal(await page.getByRole('contentinfo').count(), 1);
    assert.equal(await footer.locator('.footer-contact').count(), 3);
    assert.equal(await footer.locator('.footer-social').count(), 3);
    assert.equal(await page.locator('main #journey-footer').count(), 0, 'Footer must not extend the flight timeline');
    const layout = await footer.evaluate(el => {
      const main = document.querySelector('#tier2-journey');
      const svg = document.querySelector('#tier2-flight-svg');
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        fit: [...el.querySelectorAll('h2, .footer-contact, .footer-social, .footer-return')].every(e => e.scrollWidth <= e.clientWidth + 1),
        touch: [...el.querySelectorAll('a, button')].every(e => e.getBoundingClientRect().height >= 44),
        drawingMatchesJourney: Math.abs(Number(svg.getAttribute('height')) - main.offsetHeight) < 24,
        logoLoaded: el.querySelector('img').complete && el.querySelector('img').naturalWidth > 0 };
    });
    assert.deepEqual(layout, { overflow: false, fit: true, touch: true, drawingMatchesJourney: true, logoLoaded: true }, test.name);
    if (test.reduce) assert.equal(await footer.locator('.footer-arrival-stamp').evaluate(el => getComputedStyle(el).animationName), 'none');
    const url = page.url();
    for (const link of await footer.locator('.footer-contact, .footer-social').all()) {
      await link.click();
      assert.equal(page.url(), url, 'Mock links must not navigate to unverified contacts');
      assert.ok((await footer.getByRole('status').innerText()).length > 0);
      assert.ok(await footer.getByRole('status').evaluate(el => {
        const r = el.getBoundingClientRect();
        const nav = [...document.querySelectorAll('nav')].find(e => getComputedStyle(e).position === 'fixed' && e.getClientRects().length && e.getBoundingClientRect().top > innerHeight / 2);
        return r.top >= 0 && r.bottom <= (nav?.getBoundingClientRect().top ?? innerHeight);
      }), `${test.name}: placeholder feedback is outside the usable viewport`);
    }
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(200);
    const visible = await footer.locator('.footer-return').evaluate(el => {
      const r = el.getBoundingClientRect();
      const bottomNav = [...document.querySelectorAll('nav')].find(nav => getComputedStyle(nav).position === 'fixed' && nav.getClientRects().length && nav.getBoundingClientRect().top > innerHeight / 2);
      return r.top >= 0 && r.bottom <= (bottomNav?.getBoundingClientRect().top ?? innerHeight);
    });
    assert.ok(visible, `${test.name}: return control is covered by mobile navigation`);
    await footer.locator('.footer-return').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => scrollY < 2);
    assert.equal(new URL(page.url()).hash, test.hash || '#tier2-hero');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${test.name}: layout, contacts, placeholders, return navigation and flight bounds`);
  }
} finally { await browser.close(); }
