// Phone and tablet compatibility test across both mobile engines:
// WebKit (what every iPhone/iPad browser uses) and Chromium (Android Chrome, Samsung Internet, Edge).
// Needs: npm i --no-save playwright-core, `npx playwright-core install webkit`, Microsoft Edge,
// and `npm run preview` running. Usage: BASE=http://localhost:4321 node scripts/device-test.mjs [shots-dir]
import { chromium, webkit, devices } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4321';
const SHOTS = process.argv[2];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const PAGES = ['/', '/gallery/', '/film/', '/publications/', '/about/', '/contact/', '/disclaimer/'];

const MATRIX = [
  { engine: 'webkit', name: 'iPhone SE', device: devices['iPhone SE'] },
  { engine: 'webkit', name: 'iPhone 15 Pro Max', device: devices['iPhone 15 Pro Max'] },
  { engine: 'webkit', name: 'iPhone 13 landscape', device: devices['iPhone 13 landscape'] },
  { engine: 'webkit', name: 'iPad Mini', device: devices['iPad Mini'] },
  { engine: 'chromium', name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
  { engine: 'chromium', name: 'Pixel 7', device: devices['Pixel 7'] },
  { engine: 'chromium', name: 'Galaxy Tab S4', device: devices['Galaxy Tab S4'] },
  { engine: 'chromium', name: 'Desktop 1440', device: { viewport: { width: 1440, height: 900 } } },
];

const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browsers = {
  webkit: await webkit.launch(),
  chromium: await chromium.launch({ channel: 'msedge', args: ['--autoplay-policy=no-user-gesture-required'] }),
};

for (const { engine, name, device } of MATRIX) {
  const tag = `[${engine} ${name}]`;
  const ctx = await browsers[engine].newContext({ ...device });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const isTouch = !!device.hasTouch;

  for (const p of PAGES) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    await sleep(400);
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [...document.querySelectorAll('main *, header *, footer *')]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && !e.closest('dialog') && !e.matches('.skip'); })
        .map((e) => `${e.tagName}.${e.className}`).slice(0, 4);
      return { vw, sw: document.documentElement.scrollWidth, over };
    });
    ok(`${tag} ${p} no sideways scroll`, m.sw <= m.vw && m.over.length === 0, `vw ${m.vw} sw ${m.sw}${m.over.length ? ' over: ' + m.over.join(' ') : ''}`);
  }

  // Background video: right size chosen, covers the screen, plays (or poster stands in).
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const bg = await page.locator('.bg-video').evaluate(async (v) => {
    const deadline = Date.now() + 8000;
    while (v.readyState < 2 && !v.error && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
    const t0 = v.currentTime; await new Promise((r) => setTimeout(r, 1200));
    const r = v.getBoundingClientRect();
    return { src: v.currentSrc.split('/').pop(), rs: v.readyState, err: v.error && v.error.code, advanced: v.currentTime > t0, paused: v.paused,
      covers: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight, poster: !!v.poster, vw: innerWidth };
  });
  const expect = bg.vw >= 900 ? 'bg-holo-720.mp4' : 'bg-holo-480.mp4';
  ok(`${tag} background picks ${expect}`, bg.src === expect, bg.src);
  ok(`${tag} background covers viewport`, bg.covers);
  ok(`${tag} background plays`, bg.advanced && !bg.err, JSON.stringify({ rs: bg.rs, err: bg.err, paused: bg.paused }));
  const poster = await page.evaluate(async (u) => (await fetch(u)).ok, await page.locator('.bg-video').getAttribute('poster'));
  ok(`${tag} poster fallback reachable`, poster);

  // Content sits above the background, and floats as you scroll.
  const layer = await page.evaluate(() => {
    const h = document.querySelector('.hero h1, .page-head h1');
    const r = h.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + 10, r.top + r.height / 2);
    return { onTop: !!top && !top.closest('.bg-stage') };
  });
  ok(`${tag} headline is above background`, layer.onTop);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.4));
  await sleep(700);
  const fl = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.float')];
    const moved = els.filter((e) => e.style.translate && e.style.translate !== '0 0.0px' && e.style.translate !== '0px 0px').length;
    return { count: els.length, moved, p: getComputedStyle(document.querySelector('.bg-depth')).getPropertyValue('--p') };
  });
  ok(`${tag} blocks float on scroll, background recedes`, fl.count > 5 && fl.moved > 0 && Number(fl.p) > 0, JSON.stringify(fl));
  if (SHOTS) {
    await page.screenshot({ path: `${SHOTS}/${engine}-${name.replace(/\W+/g, '_')}-scrolled.png` });
    await page.evaluate(() => scrollTo(0, 0)); await sleep(500);
    await page.screenshot({ path: `${SHOTS}/${engine}-${name.replace(/\W+/g, '_')}-top.png` });
  }

  // Header: pinned, below the notch area, menu works on small screens.
  const vwNow = await page.evaluate(() => innerWidth);
  if (vwNow <= 820) {
    const toggle = page.locator('.nav-toggle');
    isTouch ? await toggle.tap() : await toggle.click();
    await sleep(500);
    const link = page.locator('.site-nav a', { hasText: 'Contact' });
    const box = await link.boundingBox();
    ok(`${tag} menu opens, Contact link ≥ 44px`, !!box && box.height >= 44 && (await link.isVisible()), box ? `${Math.round(box.width)}×${Math.round(box.height)}` : 'no box');
    isTouch ? await link.tap() : await link.click();
    await page.waitForURL(/\/contact\/$/, { timeout: 5000 }).catch(() => {});
    ok(`${tag} menu link navigates`, page.url().endsWith('/contact/'));
  } else {
    ok(`${tag} desktop nav visible`, await page.locator('.site-nav a', { hasText: 'Contact' }).isVisible());
    await page.goto(BASE + '/contact/', { waitUntil: 'load' });
  }

  // Contact: both send buttons reachable, inputs won't trigger iOS zoom (font ≥ 16px).
  const form = await page.evaluate(() => {
    const fs = [...document.querySelectorAll('.field input, .field select, .field textarea')].map((e) => parseFloat(getComputedStyle(e).fontSize));
    const b = [...document.querySelectorAll('.form-actions button')].map((e) => { const r = e.getBoundingClientRect(); return { h: r.height, fits: r.left >= 0 && r.right <= innerWidth }; });
    return { minFont: Math.min(...fs), buttons: b };
  });
  ok(`${tag} form inputs ≥ 16px (no iOS zoom)`, form.minFont >= 16, `${form.minFont}px`);
  ok(`${tag} send buttons fit and ≥ 44px`, form.buttons.length === 2 && form.buttons.every((b) => b.fits && b.h >= 44), JSON.stringify(form.buttons));

  // Lightbox by tap/click, pauses background, closes.
  await page.goto(BASE + '/gallery/', { waitUntil: 'load' });
  const card = page.locator('.card[data-index]').first();
  await card.scrollIntoViewIfNeeded();
  isTouch ? await card.tap() : await card.click();
  await sleep(500);
  const lb = await page.evaluate(() => {
    const d = document.querySelector('dialog.lightbox');
    const els = ['.lb-stage > *', '.lb-close', '.lb-next'].map((s) => d.querySelector(s)?.getBoundingClientRect());
    return { open: d.open, onScreen: els.every((r) => r && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight), bgPaused: document.querySelector('.bg-video').paused };
  });
  ok(`${tag} lightbox opens with controls on screen`, lb.open && lb.onScreen, JSON.stringify(lb));
  ok(`${tag} background pauses under lightbox`, lb.bgPaused);
  const close = page.locator('.lb-close');
  isTouch ? await close.tap() : await close.click();
  await sleep(300);
  ok(`${tag} lightbox closes`, !(await page.evaluate(() => document.querySelector('dialog.lightbox').open)));

  ok(`${tag} no script errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// Accessibility and data-saving fallbacks.
for (const engine of ['webkit', 'chromium']) {
  const ctx = await browsers[engine].newContext({ ...devices[engine === 'webkit' ? 'iPhone 15 Pro Max' : 'Pixel 7'], reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.evaluate(() => scrollTo(0, 1500)); await sleep(500);
  const r = await page.evaluate(() => ({ src: document.querySelector('.bg-video').getAttribute('src'), floats: document.querySelectorAll('.float').length, reveal: getComputedStyle(document.querySelector('.reveal')).opacity }));
  ok(`[${engine}] reduced motion: poster only, nothing floats, content visible`, !r.src && r.floats === 0 && r.reveal === '1', JSON.stringify(r));
  await ctx.close();
}

await browsers.webkit.close();
await browsers.chromium.close();
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
