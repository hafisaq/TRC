// Native browser dialogs are simulated here; installation still needs device QA.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const shots = process.env.SCREENSHOT_DIR;
if (shots) await mkdir(shots, { recursive: true });

async function setup({ width = 390, height = 844, apple = false, ipad = false, installed = false, arabic = false, mockFullscreen = true, reducedMotion = 'reduce' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', reducedMotion });
  await context.addInitScript(({ apple, ipad, installed, arabic, mockFullscreen }) => {
    window.pwaTest = { installs: 0, shares: 0, copies: [], installOutcome: 'dismissed', shareError: '', copyError: false, fullscreenError: false, fullscreen: false, installed };
    if (arabic) localStorage.setItem('trc-lang', 'ar');
    if (apple) Object.defineProperty(navigator, 'userAgent', { value: ipad ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15' : 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile Safari/604.1' });
    if (ipad) Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    Object.defineProperty(navigator, 'standalone', { get: () => window.pwaTest.installed });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
      window.pwaTest.shares++;
      window.pwaTest.shared = data;
      if (window.pwaTest.shareError) throw new DOMException('Share rejected', window.pwaTest.shareError);
    } });
    Object.defineProperty(navigator, 'canShare', { value: () => true });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => {
      if (window.pwaTest.copyError) throw new DOMException('Clipboard rejected', 'NotAllowedError');
      window.pwaTest.copies.push(text);
    } } });
    if (mockFullscreen) {
      Object.defineProperty(document, 'fullscreenEnabled', { value: !apple });
      Object.defineProperty(document, 'fullscreenElement', { get: () => window.pwaTest.fullscreen ? document.documentElement : null });
      Element.prototype.requestFullscreen = async function () {
        if (window.pwaTest.fullscreenError) throw new DOMException('Fullscreen rejected', 'NotAllowedError');
        window.pwaTest.fullscreen = true;
        document.dispatchEvent(new Event('fullscreenchange'));
      };
      document.exitFullscreen = async () => {
        window.pwaTest.fullscreen = false;
        document.dispatchEvent(new Event('fullscreenchange'));
      };
    }
    window.pwaInstallEvent = () => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = async () => { window.pwaTest.installs++; };
      e.userChoice = Promise.resolve({ outcome: window.pwaTest.installOutcome });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
  }, { apple, ipad, installed, arabic, mockFullscreen });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, errors };
}

async function ready(page, path = '/') {
  await page.goto(base + path);
  await page.locator('.app-tools-trigger').waitFor();
  await page.waitForFunction(() => !document.querySelector('.premium-loader.is-active'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}
async function open(page) {
  await page.locator('.app-tools-trigger').click();
  await page.locator('.app-tools-sheet[open]').waitFor();
}
async function fits(page) {
  const result = await page.locator('.app-tools-sheet').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { sheetFits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight + 1,
      noOverflow: el.scrollWidth <= el.clientWidth, pageFits: document.documentElement.scrollWidth <= innerWidth,
      controlsFit: [...el.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width).every(b => b.scrollWidth <= b.clientWidth && b.clientHeight >= 44) };
  });
  assert.deepEqual(result, { sheetFits: true, noOverflow: true, pageFits: true, controlsFit: true });
}

try {
  // Catch the Chrome event before the CMS has finished and the header mounts.
  {
    const { page, context, errors } = await setup();
    let release;
    const hold = new Promise(resolve => { release = resolve; });
    await context.route('https://*.apicdn.sanity.io/**', async route => { await hold; await route.continue(); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.displayMode);
    assert.equal(await page.locator('.app-tools-trigger').count(), 0);
    assert.equal(await page.evaluate(() => pwaInstallEvent()), true);
    assert.equal(await page.evaluate(() => pwaTest.installs), 0, 'No prompt without a click');
    release();
    await page.locator('.app-tools-trigger').waitFor();
    await open(page);
    await page.getByRole('button', { name: 'Install Retreat', exact: true }).click();
    assert.equal(await page.evaluate(() => pwaTest.installs), 1);
    await page.getByRole('button', { name: 'Add to Home Screen', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Add to Home Screen', exact: true }).click();
    assert.equal(await page.evaluate(() => pwaTest.installs), 1, 'Consumed prompt cannot run twice');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.evaluate(() => { pwaTest.installOutcome = 'accepted'; pwaInstallEvent(); });
    await page.getByRole('button', { name: 'Install Retreat', exact: true }).click();
    assert.equal(await page.getByRole('status').innerText(), 'Installation requested');
    await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
    await page.getByText('Retreat is installed', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Install Retreat|Add to Home Screen/ }).count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS early install capture, one-use prompt, dismissal and installation');
  }

  for (const test of [
    { name: 'iphone', apple: true },
    { name: 'small-iphone', width: 320, height: 667, apple: true },
    { name: 'ipad', width: 820, height: 1180, apple: true, ipad: true },
    { name: 'android', path: '/asia/maldives#cd-day-0' },
    { name: 'landscape', width: 844, height: 390 },
    { name: 'arabic', arabic: true, apple: true },
    { name: 'installed', apple: true, installed: true, path: '/asia/maldives' },
  ]) {
    const { page, context, errors } = await setup(test);
    await ready(page, test.path);
    const header = await page.locator('#tier2-nav').evaluate(el => {
      const logo = el.querySelector('a img').getBoundingClientRect();
      const trigger = el.querySelector('.app-tools-trigger').getBoundingClientRect();
      const language = el.querySelector('.mobile-language-switch button')?.getBoundingClientRect();
      return { logoClear: trigger.right <= logo.left && (!language || logo.right <= language.left), headerFits: el.scrollWidth <= el.clientWidth };
    });
    assert.deepEqual(header, { logoClear: true, headerFits: true }, test.name);
    await open(page);
    await fits(page);
    if (test.apple) assert.equal(await page.getByRole('button', { name: 'Full screen', exact: true }).count(), 0);
    if (test.installed) {
      assert.equal(await page.locator('html').getAttribute('data-display-mode'), 'standalone');
      assert.equal(await page.locator('.app-tools-installed').count(), 1);
    }
    if (shots) await page.screenshot({ path: `${shots}/${test.name}.png` });
    if (test.apple && !test.arabic && !test.installed) {
      await page.getByRole('button', { name: 'Add to Home Screen', exact: true }).click();
      await page.getByText("Open this page in Safari, then open the browser's Share menu (it may be under More).").waitFor();
      assert.equal(await page.locator('.app-tools-help li').count(), 3);
      await fits(page);
      if (shots) await page.screenshot({ path: `${shots}/${test.name}-install-help.png` });
    }
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement.closest('dialog')), 'Focus stays in sheet');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.app-tools-sheet').open);
    assert.equal(await page.evaluate(() => document.activeElement.className), 'app-tools-trigger');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${test.name} layout, capabilities and keyboard`);
  }

  {
    const { page, context, errors } = await setup();
    await ready(page, '/asia/maldives#cd-day-0');
    await open(page);
    await page.getByRole('button', { name: 'Share this journey', exact: true }).click();
    assert.equal(await page.evaluate(() => pwaTest.shared.url), page.url());
    await page.evaluate(() => { pwaTest.shareError = 'AbortError'; });
    await page.getByRole('button', { name: 'Share this journey', exact: true }).click();
    assert.equal(await page.locator('.app-tools-status').textContent(), '', 'Share cancellation is not an error');
    await page.evaluate(() => { pwaTest.shareError = 'NotAllowedError'; });
    await page.getByRole('button', { name: 'Share this journey', exact: true }).click();
    await page.getByText('Sharing is unavailable right now. You can copy the link instead.').waitFor();
    await page.getByRole('button', { name: 'Copy link', exact: true }).click();
    assert.equal(await page.evaluate(() => pwaTest.copies.at(-1)), page.url());
    await page.evaluate(() => { pwaTest.copyError = true; });
    await page.getByRole('button', { name: 'Copy link', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Select and copy this link' }).inputValue(), page.url());
    await page.evaluate(() => { pwaTest.fullscreenError = true; });
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    await page.getByText('Full screen was not allowed by this browser.').waitFor();
    await page.evaluate(() => { pwaTest.fullscreenError = false; });
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.app-tools-sheet').open);
    assert.equal(await page.locator('html').getAttribute('data-display-mode'), 'fullscreen');
    await open(page);
    assert.equal(await page.locator('.app-tools-installed').count(), 0, 'Fullscreen is not installation');
    await page.getByRole('button', { name: 'Exit full screen', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.app-tools-sheet').open);
    assert.equal(await page.locator('html').getAttribute('data-display-mode'), 'browser');
    await page.evaluate(() => { pwaTest.installed = true; dispatchEvent(new Event('pageshow')); });
    assert.equal(await page.locator('html').getAttribute('data-display-mode'), 'standalone');
    await context.setOffline(true);
    await open(page);
    await page.getByText('You are offline. Some photos and films may be unavailable.').waitFor();
    await context.setOffline(false);
    await page.waitForFunction(() => !document.querySelector('.app-tools-offline'));
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS sharing, clipboard, rejected permissions, fullscreen, display-mode and network changes');
  }

  {
    const { page, context, errors } = await setup({ mockFullscreen: false });
    await ready(page);
    await open(page);
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    await page.waitForFunction(() => document.fullscreenElement === document.documentElement);
    await page.waitForFunction(() => !document.querySelector('.app-tools-sheet').open);
    await open(page);
    await page.getByRole('button', { name: 'Exit full screen', exact: true }).click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS real Chromium fullscreen enter and exit');
  }

  {
    const { page, context, errors } = await setup({ reducedMotion: 'no-preference' });
    await ready(page, '/asia/maldives');
    await page.locator('[data-country-bottom-nav] a[href="#cd-day-0"]').click();
    await page.waitForTimeout(1600);
    const y = await page.evaluate(() => scrollY);
    await open(page);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 2, 'Modal pauses smooth scroll');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 2, 'Closing preserves the journey position');
    await page.locator('[data-country-bottom-nav] a[href="#cd-stays"]').click();
    await page.waitForTimeout(1600);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) > 500, 'Smooth navigation resumes');
    await open(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => !document.querySelector('.app-tools-sheet').open);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS animated route position, scroll restoration and desktop resize');
  }

  {
    const { page, context, errors } = await setup();
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined });
      Object.defineProperty(navigator, 'clipboard', { value: undefined });
    });
    await ready(page);
    await open(page);
    assert.equal(await page.getByRole('button', { name: 'Share this journey', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Copy link', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Select and copy this link' }).inputValue(), page.url());
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS unsupported share and clipboard fallbacks');
  }

  {
    const { page, context, errors } = await setup({ width: 1440, height: 900 });
    await page.goto(base);
    await page.locator('#tier2-nav').waitFor();
    assert.equal(await page.locator('.app-tools-trigger').isVisible(), false);
    assert.equal(await page.locator('nav[aria-label="Destination navigation"]').isVisible(), false);
    if (shots) await page.screenshot({ path: `${shots}/desktop.png` });
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS desktop navigation unchanged');
  }
} finally { await browser.close(); }
