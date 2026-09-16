import { chromium, devices } from 'playwright-core';

// Click-test the built site. Needs: npm i --no-save playwright-core, Microsoft Edge installed,
// and `npm run preview` running. Usage: BASE=http://localhost:4321 node scripts/click-test.mjs
const BASE = process.env.BASE || 'http://localhost:4321';
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The home page plays an opening animation that covers the screen; wait for it to clear.
const settle = async (page) => {
  // The intro markup is server-rendered, so once the DOM is parsed it is either present
  // (playing) or already removed. Waiting on `state: 'detached'` alone is a trap: it resolves
  // at once when the element has not been parsed yet, and measuring then catches the curtain.
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForFunction(() => !document.querySelector('.intro'), null, { timeout: 9000 }).catch(() => {});
  // The reveal animation scales <main> briefly; measuring during it reports phantom overflow.
  await page.waitForFunction(() => !document.documentElement.classList.contains('intro-revealing'), null, { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
};

for (let t = 0; t < 30; t++) { try { if ((await fetch(BASE + '/')).ok) break; } catch {} await sleep(500); }

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const errors = [];
const watch = (page, label) => {
  page.on('pageerror', (e) => errors.push(`${label}: pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: console ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${label}: HTTP ${r.status()} ${r.url()}`); });
};

// ---------- Desktop gallery: hover-play, lightbox, filters ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); watch(page, 'desktop-gallery');
  await page.goto(BASE + '/gallery/', { waitUntil: 'networkidle' });
  await settle(page);
  const cards = page.locator('.card[data-index]');
  const n = await cards.count();
  ok('gallery has cards', n > 0, `${n} cards`);

  const vcard = page.locator('.card[data-index]:has(video)').first();
  if (await vcard.count()) {
    await vcard.scrollIntoViewIfNeeded();
    await vcard.hover();
    await sleep(2000);
    const playing = await vcard.locator('video').evaluate((v) => ({ paused: v.paused, t: v.currentTime, rs: v.readyState }));
    ok('hover-play starts video', !playing.paused && playing.t > 0, JSON.stringify(playing));
    await page.mouse.move(2, 2);
    await sleep(300);
    const stopped = await vcard.locator('video').evaluate((v) => ({ paused: v.paused, t: v.currentTime }));
    ok('pointer leave pauses and rewinds', stopped.paused && stopped.t === 0, JSON.stringify(stopped));
  } else ok('hover-play starts video', false, 'no card with video');

  // open first card
  await cards.first().scrollIntoViewIfNeeded();
  const firstTitle = (await cards.first().locator('.card-title').textContent()).trim();
  await cards.first().click();
  const dlg = page.locator('dialog.lightbox');
  ok('click opens lightbox', await dlg.evaluate((d) => d.open));
  ok('lightbox title matches card', (await dlg.locator('.lb-title').textContent()) === firstTitle, firstTitle);
  ok('counter shows 1 / N', (await dlg.locator('.lb-count').textContent()) === `1 / ${n}`, await dlg.locator('.lb-count').textContent());

  // step through every work, checking media loads
  const bad = [];
  for (let k = 0; k < n; k++) {
    const media = dlg.locator('.lb-stage > *');
    await page.waitForTimeout(150);
    const info = await media.evaluate(async (el) => {
      const deadline = Date.now() + 8000;
      if (el.tagName === 'IMG') { while (!el.complete && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50)); return { tag: 'IMG', okay: el.naturalWidth > 0, src: el.getAttribute('src') }; }
      while (el.readyState < 1 && !el.error && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      return { tag: 'VIDEO', okay: el.readyState >= 1 && !el.error, src: el.getAttribute('src'), rs: el.readyState };
    });
    const box = await media.boundingBox();
    const fits = box && box.x >= -1 && box.x + box.width <= 1441 && box.y >= -1 && box.y + box.height <= 901;
    if (!info.okay || !fits) bad.push({ k, ...info, box });
    await dlg.locator('.lb-next').click();
  }
  ok('every work loads and fits viewport in lightbox', bad.length === 0, bad.length ? JSON.stringify(bad) : `${n} works`);
  ok('next wraps round to 1', (await dlg.locator('.lb-count').textContent()) === `1 / ${n}`);
  await dlg.locator('.lb-prev').click();
  ok('prev from 1 wraps to N', (await dlg.locator('.lb-count').textContent()) === `${n} / ${n}`);
  await page.keyboard.press('ArrowRight');
  ok('ArrowRight key advances', (await dlg.locator('.lb-count').textContent()) === `1 / ${n}`);
  await page.keyboard.press('ArrowLeft');
  ok('ArrowLeft key goes back', (await dlg.locator('.lb-count').textContent()) === `${n} / ${n}`);
  await dlg.locator('.lb-close').click();
  await page.waitForFunction(() => document.querySelector('.lb-stage').childElementCount === 0, null, { timeout: 2000 }).catch(() => {});
  ok('Close button closes and empties stage', !(await dlg.evaluate((d) => d.open)) && (await dlg.locator('.lb-stage > *').count()) === 0);

  await cards.first().click();
  await page.keyboard.press('Escape');
  ok('Escape closes lightbox', !(await dlg.evaluate((d) => d.open)));

  await cards.first().click();
  await dlg.locator('.lb-stage > *').click();
  ok('clicking the work itself keeps lightbox open', await dlg.evaluate((d) => d.open));
  const hit = await page.evaluate(() => { const e = document.elementFromPoint(5, 5); return e.tagName + '.' + e.className; });
  const lbBox = await dlg.evaluate((d) => { const r = d.getBoundingClientRect(), i = d.querySelector('.lb-inner').getBoundingClientRect(); return { dlg: [r.left, r.top, r.width, r.height].map(Math.round), inner: [i.left, i.top, i.width, i.height].map(Math.round) }; });
  await page.mouse.click(5, 5);
  ok('backdrop click closes lightbox', !(await dlg.evaluate((d) => d.open)), `element at (5,5): ${hit}; ${JSON.stringify(lbBox)}`);
  if (await dlg.evaluate((d) => d.open)) await dlg.evaluate((d) => d.close());

  // filters
  const filters = page.locator('button[data-filter]');
  const fcount = await filters.count();
  for (let f = 1; f < fcount; f++) {
    const b = filters.nth(f);
    const key = await b.getAttribute('data-filter');
    await b.click();
    const visible = await page.locator('.card[data-index]:not([hidden])').count();
    const wrong = await page.locator(`.card[data-index]:not([hidden]):not([data-kind="${key}"])`).count();
    const pressed = await b.getAttribute('aria-pressed');
    let lbCount = 'n/a';
    if (visible) {
      await page.locator('.card[data-index]:not([hidden])').first().click();
      lbCount = await dlg.locator('.lb-count').textContent();
      await dlg.locator('.lb-close').click();
    }
    ok(`filter "${key}" shows only its kind, lightbox scoped`, wrong === 0 && pressed === 'true' && (visible === 0 || lbCount === `1 / ${visible}`), `${visible} visible, lightbox ${lbCount}`);
  }
  await filters.first().click();
  ok('filter "all" restores every card', (await page.locator('.card[data-index]:not([hidden])').count()) === n);
  await ctx.close();
}

// ---------- Home page hover cards (if any) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); watch(page, 'desktop-home');
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  const c = page.locator('.card[data-index]');
  const cnt = await c.count();
  if (cnt) {
    await c.first().scrollIntoViewIfNeeded();
    await c.first().click();
    ok('home: card opens lightbox', await page.locator('dialog.lightbox').evaluate((d) => d.open), `${cnt} cards`);
  } else ok('home: cards present', true, 'no cards on home — nothing to test');
  await ctx.close();
}

// ---------- Phone emulation: all pages overflow, film, tap lightbox ----------
{
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage(); watch(page, 'phone');
  for (const p of ['/', '/gallery/', '/film/', '/publications/', '/about/', '/contact/', '/disclaimer/', '/nope-404/']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await settle(page);
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !e.closest('dialog') && !e.closest('.bg-stage') && !e.matches('.skip'); }).map((e) => e.tagName + '.' + e.className).slice(0, 5);
      return { vw, sw: document.documentElement.scrollWidth, over };
    });
    ok(`phone ${p} no horizontal overflow`, m.sw <= m.vw && m.over.length === 0, `vw ${m.vw}, scrollWidth ${m.sw}${m.over.length ? ', over: ' + m.over.join(' ') : ''}`);
  }

  await page.goto(BASE + '/film/', { waitUntil: 'networkidle' });
  await settle(page);
  const film = await page.locator('.film-player video').evaluate(async (v) => {
    const deadline = Date.now() + 10000;
    while (v.readyState < 1 && !v.error && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    const r = v.getBoundingClientRect();
    return { rs: v.readyState, dur: v.duration, err: v.error && v.error.code, w: r.width, h: r.height, vw: innerWidth };
  });
  ok('phone /film/ video metadata loads', film.rs >= 1 && film.dur > 0, JSON.stringify(film));
  ok('phone /film/ player fits width', film.w <= film.vw && film.w > film.vw * 0.8, `${film.w.toFixed(0)} of ${film.vw}px`);
  const seek = await page.locator('.film-player video').evaluate(async (v) => {
    v.muted = true; await v.play().catch((e) => e.message); await new Promise((r) => setTimeout(r, 1500));
    const t1 = v.currentTime; v.currentTime = Math.min(v.duration - 1, v.duration / 2);
    await new Promise((r) => v.addEventListener('seeked', r, { once: true }));
    return { playedTo: t1, seekedTo: v.currentTime, paused: v.paused };
  });
  ok('phone /film/ plays and seeks (range requests)', seek.playedTo > 0 && seek.seekedTo > 1, JSON.stringify(seek));

  await page.goto(BASE + '/gallery/', { waitUntil: 'networkidle' });
  await settle(page);
  const card = page.locator('.card[data-index]').nth(1);
  await card.scrollIntoViewIfNeeded();
  await card.tap();
  const dlg = page.locator('dialog.lightbox');
  ok('phone tap opens lightbox', await dlg.evaluate((d) => d.open));
  const layout = await dlg.evaluate((d) => {
    const vw = innerWidth, vh = innerHeight;
    const boxes = ['.lb-stage > *', '.lb-prev', '.lb-next', '.lb-close', '.lb-title'].map((s) => { const r = d.querySelector(s).getBoundingClientRect(); return { s, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) }; });
    return { vw, vh, boxes, off: boxes.filter((b) => b.l < 0 || b.r > vw || b.t < 0 || b.b > vh) };
  });
  ok('phone lightbox media + controls on screen', layout.off.length === 0, layout.off.length ? JSON.stringify(layout) : `vw ${layout.vw} vh ${layout.vh}`);
  const btn = await dlg.locator('.lb-close').boundingBox();
  ok('phone Close target â‰¥ 44px tall', btn.height >= 44, `${btn.width.toFixed(0)}Ã—${btn.height.toFixed(0)}`);
  await dlg.locator('.lb-next').tap();
  ok('phone tap next advances', (await dlg.locator('.lb-count').textContent()).startsWith('3 /'), await dlg.locator('.lb-count').textContent());
  await dlg.locator('.lb-close').tap();
  ok('phone tap Close closes', !(await dlg.evaluate((d) => d.open)));

  // nav menu on phone
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await settle(page);
  const navInfo = await page.evaluate(() => [...document.querySelectorAll('header a, header button')].map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { t: (e.textContent || e.getAttribute('aria-label') || '').trim(), vis: r.width > 0 && cs.visibility !== 'hidden' && cs.display !== 'none', h: Math.round(r.height) }; }));
  console.log('      phone header controls:', JSON.stringify(navInfo));
  await ctx.close();
}

// ---------- Contact form ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage(); watch(page, 'contact');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Page.enable');
  const cdpNav = [];
  cdp.on('Page.frameRequestedNavigation', (ev) => cdpNav.push(ev.url));
  await page.addInitScript(() => {
    // Record mailto navigation without leaving the page.
    const desc = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
    window.__nav = [];
    try { Object.defineProperty(Location.prototype, 'href', { set(v) { window.__nav.push(v); if (!String(v).startsWith('mailto:')) desc.set.call(this, v); }, get() { return desc.get.call(this); }, configurable: true }); } catch (e) { window.__navErr = e.message; }
  });
  await page.goto(BASE + '/contact/', { waitUntil: 'networkidle' });
  await settle(page);
  ok('contact form in mailto mode (no key)', (await page.locator('#enquiry').getAttribute('data-direct')) === 'false');
  await page.locator('#enquiry button[value=email]').click();
  ok('empty submit blocked by validation', (await page.evaluate(() => window.__nav.length)) === 0 && (await page.locator('.form-status').textContent()) === '');
  await page.fill('#name', 'Test Person');
  await page.fill('#email', 'not-an-email');
  await page.fill('#message', 'Hello');
  await page.locator('#enquiry button[value=email]').click();
  ok('invalid email blocked', (await page.evaluate(() => window.__nav.length)) === 0);
  await page.fill('#email', 'test@example.com');
  await page.fill('#phone', '+44 1234 567890');
  await page.selectOption('#topic', 'Press');
  await page.fill('#message', 'Line one & two?\nSecond line — with dash.');
  await page.locator('#enquiry button[value=email]').click();
  await sleep(300);
  const nav = await page.evaluate(() => ({ nav: window.__nav, err: window.__navErr }));
  const href = nav.nav[0] || cdpNav.find((u) => u.startsWith('mailto:')) || '';
  let parsed = {};
  if (href) { const u = new URL(href); parsed = { to: u.pathname, subject: u.searchParams.get('subject'), body: u.searchParams.get('body') }; }
  ok('valid submit builds mailto', parsed.to === 'researchatmartin@gmail.com' && parsed.subject === 'Press enquiry from Test Person' && parsed.body === 'Line one & two?\nSecond line — with dash.\n\n— Test Person\ntest@example.com\n+44 1234 567890', JSON.stringify(parsed) + (nav.err ? ' hookErr ' + nav.err : ''));
  ok('status message shown', (await page.locator('.form-status').textContent()).includes('email application'));

  // WhatsApp: link in the side column, and the form's second button.
  ok('WhatsApp link points at wa.me number', (await page.locator('a[href^="https://wa.me/"]').getAttribute('href')) === 'https://wa.me/447710020669');
  await page.evaluate(() => { window.__opened = []; window.open = (u, t, f) => { window.__opened.push([u, t, f]); return null; }; });
  await page.fill('#name', ''); await page.fill('#message', ''); await page.fill('#email', ''); await page.fill('#phone', '');
  await page.locator('#enquiry button[value=whatsapp]').click();
  ok('WhatsApp blocked without name/message', (await page.evaluate(() => window.__opened.length)) === 0);
  await page.fill('#name', 'Test Person');
  await page.selectOption('#topic', 'Commission');
  await page.fill('#message', 'Hello Martin & team?\nSecond line.');
  await page.locator('#enquiry button[value=whatsapp]').click();
  const opened = await page.evaluate(() => window.__opened);
  let wa = {};
  if (opened.length) { const u = new URL(opened[0][0]); wa = { host: u.host, path: u.pathname, text: u.searchParams.get('text'), target: opened[0][1] }; }
  ok('WhatsApp opens wa.me with exact message (email optional)', wa.host === 'wa.me' && wa.path === '/447710020669' && wa.target === '_blank' && wa.text === 'Commission enquiry from Test Person\n\nHello Martin & team?\nSecond line.\n\n— Test Person', JSON.stringify(wa));
  ok('WhatsApp status message shown', (await page.locator('.form-status').textContent()).includes('WhatsApp'));
  await page.fill('#email', 'test@example.com'); await page.fill('#phone', '+44 1234 567890');
  await page.evaluate(() => { window.__opened = []; });
  await page.locator('#enquiry button[value=whatsapp]').click();
  const wa2 = new URL((await page.evaluate(() => window.__opened))[0][0]).searchParams.get('text');
  ok('WhatsApp message includes email and phone when given', wa2.endsWith('— Test Person\ntest@example.com\n+44 1234 567890'), JSON.stringify(wa2));
  await ctx.close();
}

await browser.close();
console.log('\nErrors collected:', errors.length ? '\n  ' + [...new Set(errors)].join('\n  ') : 'none');
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
