import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });

try {
  for (const test of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'wide', width: 1920, height: 1080 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'small-phone', width: 320, height: 667 },
    { name: 'landscape', width: 844, height: 390 },
    { name: 'arabic', width: 390, height: 844, arabic: true },
    { name: 'reduced-motion', width: 390, height: 844, reduce: true },
    { name: 'data-saver', width: 390, height: 844, saveData: true },
    { name: 'extra-content', width: 390, height: 844, extra: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, serviceWorkers: 'block', reducedMotion: test.reduce ? 'reduce' : 'no-preference' });
    if (test.arabic) await context.addInitScript(() => localStorage.setItem('trc-lang', 'ar'));
    if (test.saveData) await context.addInitScript(() => Object.defineProperty(navigator.connection, 'saveData', { value: true }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let content;
    await page.route('**/data/query/**', async route => {
      const response = await route.fetch();
      const data = await response.json();
      content = data.result.about;
      if (test.extra && content?.sections?.length) {
        content.sections.push({ ...content.sections[0], _key: 'test-extra', title: 'A longer chapter for future discoveries', paragraphs: Array(4).fill(content.sections[0].paragraphs[0]) });
      }
      await route.fulfill({ response, json: data });
    });
    await page.goto(base + '/about');
    await page.locator('.about-chapter').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${test.name}: horizontal overflow`);
    await noOverflow();
    assert.ok(content?.sections.length >= 2, 'Published About content missing');
    assert.equal(await page.locator('.about-chapter').count(), content.sections.length);
    for (const text of [...content.intro, ...content.sections.flatMap(s => s.paragraphs), ...content.closing]) {
      assert.ok((await page.locator('main').textContent()).includes(text), 'Client wording was changed or lost');
    }
    assert.ok(await page.locator('.about-hero-title').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${test.name}: title is clipped`);
    await page.waitForFunction(() => { const img = document.querySelector('.about-hero .is-active img'); return img?.complete && img.naturalWidth; });
    if (screenshots) await page.screenshot({ path: `${screenshots}/${test.name}-hero.png` });
    const beforeView = await page.locator('.about-hero .is-active img').getAttribute('src');
    await page.locator('.about-film-controls button').first().click();
    await page.waitForTimeout(950);
    assert.notEqual(await page.locator('.about-hero .is-active img').getAttribute('src'), beforeView);
    await page.locator('.about-film-controls button').last().click();
    assert.equal(await page.locator('video').evaluateAll(es => es.every(e => e.paused)), true, 'Pause must stop every film');
    await page.locator('.about-film-controls button').last().click();
    const planeStart = await page.locator('.about-flight g').getAttribute('transform');

    const jumpTo = async index => {
      const nav = test.width >= 1280 ? '.about-desktop-nav' : '.route-bar';
      await page.locator(`${nav} a[href="#about-s${index}"]`).click();
      await page.waitForFunction(i => document.querySelector('.about-chapter-selector a[aria-current]')?.getAttribute('href') === `#about-s${i}`, index);
      await page.waitForTimeout(1200);
      assert.equal(new URL(page.url()).hash, `#about-s${index}`);
      const layout = await page.locator(`#about-s${index} h2`).evaluate(el => {
        const header = document.querySelector('#tier2-nav').getBoundingClientRect();
        const stage = document.querySelector('.about-journal-stage');
        const pinned = innerWidth < 900 && getComputedStyle(stage).position === 'sticky';
        return { heading: el.getBoundingClientRect().top, clear: pinned ? stage.getBoundingClientRect().bottom : header.bottom, textFits: el.scrollWidth <= el.clientWidth + 1 };
      });
      assert.ok(layout.heading >= layout.clear - 2, `${test.name}: chapter heading is covered`);
      assert.ok(layout.textFits, `${test.name}: chapter heading overflows`);
      await noOverflow();
    };
    await jumpTo(0);
    if (screenshots) await page.screenshot({ path: `${screenshots}/${test.name}-journal.png` });
    const film0 = await page.locator('.about-journal-stage .is-active img').getAttribute('src');
    await jumpTo(1);
    assert.notEqual(await page.locator('.about-journal-stage .is-active img').getAttribute('src'), film0, 'Film must change with chapter');
    assert.notEqual(await page.locator('.about-flight g').getAttribute('transform'), planeStart, 'Plane must follow reading progress');
    if (screenshots) await page.screenshot({ path: `${screenshots}/${test.name}-chapter-two.png` });
    if (test.extra) await jumpTo(2);
    await jumpTo(0);
    if (test.reduce || test.saveData) assert.equal(await page.locator('video').evaluateAll(es => es.every(e => !e.getAttribute('src'))), true, 'Reduced-motion/data-saver must use posters');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${test.name}: content, responsive layout, film controls, chapter transitions, navigation and plane`);
  }
} finally { await browser.close(); }
