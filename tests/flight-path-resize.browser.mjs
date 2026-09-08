import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });

async function waitForGeometry(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('#tier2-journey');
    const svg = document.querySelector('#tier2-flight-svg');
    return main && svg && Math.abs(Number(svg.getAttribute('height')) - main.offsetHeight) < 24;
  });
  await page.waitForTimeout(400);
}

async function checkRoute(page, label) {
  const end = await page.locator('#tier2-enquire').evaluate(el => el.getBoundingClientRect().top + scrollY);
  const checkpoints = Array.from({ length: 15 }, (_, i) => Math.round((end - 160) * i / 14));
  let last = null;
  for (const y of [...checkpoints, ...checkpoints.slice().reverse()]) {
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(100);
    const position = await page.evaluate(() => {
      const p = document.querySelector('#tier2-flight-plane').getBoundingClientRect();
      const top = document.querySelector('#tier2-nav').getBoundingClientRect().bottom;
      const nav = document.querySelector('nav[aria-label="Destination navigation"]');
      const bottom = nav.getClientRects().length ? nav.getBoundingClientRect().top : innerHeight;
      const main = document.querySelector('#tier2-journey');
      return { y: scrollY, top: p.top, bottom: p.bottom, left: p.left, right: p.right,
        safeTop: top, safeBottom: bottom, width: innerWidth,
        documentY: p.top + p.height / 2 + scrollY,
        overflow: document.documentElement.scrollWidth > innerWidth,
        phantomHeight: main.scrollHeight - main.offsetHeight };
    });
    assert.equal(position.overflow, false, `${label}: page overflow`);
    assert.ok(position.phantomHeight < 24, `${label}: stale SVG creates ${position.phantomHeight}px of blank space`);
    assert.ok(position.left >= 0 && position.right <= position.width, `${label}: plane outside horizontal viewport`);
    assert.ok(position.top > position.safeTop && position.bottom < position.safeBottom,
      `${label}: plane outside visible scene at scroll ${position.y}: ${position.top}..${position.bottom}`);
    if (last && Math.abs(position.y - last.y) > 20) {
      const speed = (position.documentY - last.documentY) / (position.y - last.y);
      assert.ok(speed > .85 && speed < 1.15, `${label}: plane moves ${speed.toFixed(2)}px per scroll pixel`);
    }
    last = position;
  }
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), end);
  await page.waitForTimeout(150);
  const landing = await page.evaluate(() => {
    const path = document.querySelector('#tier2-flight-path');
    const point = path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
    const plane = document.querySelector('#tier2-flight-plane').getBoundingClientRect();
    return Math.hypot(point.x - (plane.left + plane.width / 2), point.y - (plane.top + plane.height / 2));
  });
  assert.ok(landing < 10, `${label}: plane misses boarding pass by ${landing}px`);
}

try {
  for (const test of [
    { name: 'fresh-phone', initial: { width: 430, height: 932 } },
    { name: 'desktop-to-phone', initial: { width: 1440, height: 900 }, resize: { width: 430, height: 932 }, resizeBack: true },
    { name: 'tablet-to-phone', initial: { width: 820, height: 1180 }, resize: { width: 390, height: 844 } },
    { name: 'landscape-to-portrait', initial: { width: 844, height: 390 }, resize: { width: 390, height: 844 } },
    { name: 'small-phone', initial: { width: 320, height: 667 } },
    { name: 'pwa-resize', initial: { width: 1440, height: 900 }, resize: { width: 430, height: 932 }, installed: true },
  ]) {
    const context = await browser.newContext({ viewport: test.initial, serviceWorkers: 'block', reducedMotion: 'no-preference' });
    if (test.installed) await context.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector('#tier2-flight-plane');
    await page.waitForFunction(() => !document.querySelector('.premium-loader.is-active'));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    if (test.resize) {
      // Resize the already-running page, exactly like opening phone emulation.
      await page.setViewportSize(test.resize);
      await waitForGeometry(page);
    }
    await checkRoute(page, test.name);
    if (test.resizeBack) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.setViewportSize(test.initial);
      await waitForGeometry(page);
      await checkRoute(page, `${test.name}-back-to-desktop`);
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${test.name}: visible plane, matched scroll speed, landing and no blank tail`);
  }
} finally { await browser.close(); }
