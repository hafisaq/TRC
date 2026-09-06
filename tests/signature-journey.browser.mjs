// Uses a locally installed Playwright, or PLAYWRIGHT_MODULE pointing to a
// shared runtime. The CMS variants are intercepted only inside the browser.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const cases = [
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'small-phone', width: 375, height: 667 },
  { name: 'landscape', width: 844, height: 390, linear: true },
  { name: 'reduced-motion', width: 390, height: 844, reducedMotion: 'reduce', linear: true },
  { name: 'long-copy', width: 390, height: 844, variant: 'long', linear: true },
  { name: 'one-signature', width: 1440, height: 900, variant: 'one', linear: true },
  { name: 'many-signatures', width: 1440, height: 900, variant: 'many' },
  { name: 'empty-signatures', width: 390, height: 844, variant: 'empty' },
  { name: 'arabic', width: 390, height: 844, arabic: true },
];
try {
  for (const test of cases) {
    const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, reducedMotion: test.reducedMotion, serviceWorkers: 'block' });
    if (test.arabic) await context.addInitScript(() => localStorage.setItem('trc-lang', 'ar'));
    if (test.variant) await context.route('https://*.apicdn.sanity.io/**', async route => {
      const response = await route.fetch();
      const data = await response.json();
      const page = data.result.pages[0];
      assert.ok(page?.days?.length, 'CMS fixture must have signatures');
      if (test.variant === 'empty') page.days = [];
      if (test.variant === 'one') page.days = page.days.slice(0, 1);
      if (test.variant === 'many') page.days = Array.from({ length: 13 }, (_, i) => ({ ...page.days[i % page.days.length], title: `${page.days[i % page.days.length].title} ${i + 1}` }));
      if (test.variant === 'long') page.days[0] = { ...page.days[0], copy: page.days[0].copy.repeat(8), title: page.days[0].title.repeat(5) };
      await route.fulfill({ response, json: data });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/asia/maldives${test.name === 'laptop' ? '#cd-day-2' : ''}`);
    await page.waitForSelector('#tier2-flight-plane');
    await page.waitForTimeout(1000);
    if (test.variant === 'empty') {
      assert.equal(await page.locator('.signature-journey').count(), 0);
      assert.equal(await page.locator('a[href="#cd-day-0"]').count(), 0);
    } else {
      const section = page.locator('.signature-journey');
      await section.waitFor();
      const pinned = await section.evaluate(el => el.classList.contains('is-pinned'));
      if (test.name === 'laptop') assert.equal(await page.locator('.signature-navigator a[aria-current]').getAttribute('href'), '#cd-day-2', 'Shared signature URL should open its scene');
      if (test.linear) assert.equal(pinned, false, `${test.name}: should allow natural reading`);
      const count = await page.locator('.signature-panel').count();
      if (test.name === 'small-phone' && pinned) {
        const range = await section.evaluate(el => {
          const runway = el.querySelector('.signature-runway');
          const start = runway.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(el).getPropertyValue('--signature-top'));
          return { start, end: start + runway.offsetHeight - el.querySelector('.signature-stage').offsetHeight };
        });
        let last = -Infinity;
        for (let y = range.start - 1000; y <= range.end + 1000; y += 80) {
          await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y);
          await page.waitForTimeout(50);
          const position = await page.locator('#tier2-flight-plane').evaluate(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 + scrollY; });
          assert.ok(position >= last - 2, 'Plane must not reverse when entering or leaving the held scenes');
          last = position;
        }
      }
      for (const i of [...new Set([0, Math.floor(count / 2), count - 1])]) {
        await page.evaluate(i => {
          const target = document.getElementById(`cd-day-${i}`);
          const top = parseFloat(getComputedStyle(document.querySelector('.signature-journey')).getPropertyValue('--signature-top'));
          window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - top, behavior: 'instant' });
        }, i);
        await page.waitForTimeout(1000);
        const state = await section.evaluate(el => {
          const active = el.querySelector('.signature-panel.is-active');
          const film = active.querySelector('.signature-film').getBoundingClientRect();
          const title = active.querySelector('.signature-title').getBoundingClientRect();
          const paragraph = active.querySelector('.signature-copy p');
          const copy = paragraph.getBoundingClientRect();
          const plane = document.querySelector('#tier2-flight-plane').getBoundingClientRect();
          return { overflow: document.documentElement.scrollWidth > innerWidth, titleFits: title.top >= film.top && title.bottom <= film.bottom, copyFits: paragraph.scrollWidth <= paragraph.clientWidth + 1, planeInFilm: plane.top >= film.top - 5 && plane.bottom <= film.bottom + 5, activeCount: el.querySelectorAll('.signature-panel.is-active').length, copyBottom: copy.bottom, playing: [...el.querySelectorAll('video')].filter(v => !v.paused).length };
        });
        assert.equal(state.overflow, false, `${test.name}: horizontal overflow`);
        assert.equal(state.titleFits, true, `${test.name}: clipped title`);
        assert.equal(state.copyFits, true, `${test.name}: clipped copy`);
        assert.equal(state.activeCount, 1);
        if (pinned) {
          assert.ok(state.planeInFilm, `${test.name}: plane outside film`);
          assert.ok(state.copyBottom <= test.height, `${test.name}: copy below screen`);
          assert.ok(state.playing <= 1, `${test.name}: inactive films playing`);
        }
      }
      if (pinned && count > 1) {
        await page.locator('.signature-navigator a').nth(1).click();
        await page.waitForTimeout(1500);
        assert.equal(await page.locator('.signature-navigator a[aria-current]').getAttribute('href'), '#cd-day-1');
        await page.locator('.signature-navigator a').first().focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);
        assert.equal(await page.locator('.signature-navigator a[aria-current]').getAttribute('href'), '#cd-day-0');
        const aligned = await section.evaluate(el => Math.abs(el.querySelector('.signature-stage').getBoundingClientRect().top - parseFloat(getComputedStyle(el).getPropertyValue('--signature-top'))) < 2);
        assert.ok(aligned, `${test.name}: navigation must align the held scene`);
      }
      if (test.reducedMotion) assert.equal(await section.locator('video').evaluateAll(videos => videos.every(v => v.paused)), true);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${test.name}`);
    await context.close();
  }
} finally {
  await browser.close();
}
