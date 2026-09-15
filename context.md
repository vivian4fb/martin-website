# Martin — context

*Updated 2026-09-15. State: ACTIVE — built locally, not deployed*

## What this is

Astro 4 rebuild of **martin-richardson.com** (currently WordPress) for Martin Richardson, holographer
and Emeritus Professor. A dark, exhibition-style personal gallery. Same pattern as `../ontarget`:
all content in `src/config.ts`, pages only read from it.

Pages: `/` `/gallery/` `/film/` `/publications/` `/about/` `/contact/` `/disclaimer/` `404`.

## Constraints

- **Every fact comes from the live site as fetched 2026-09-15.** Nothing from memory. New facts
  come from Martin or they do not go in.
- **Client relationship is ASSUMED.** No brief or sign-off is on file. Confirm before deploying or
  pointing the domain.
- **Three titles are derived from file names** (`confirm: true` in config): *Cast on Pastels*,
  *Objects on a Colour Chart*, *Studio Reel*. The Peter Blake quote typo "silver sits" is shown as
  "suits". Both need Martin's sign-off.
- `npm run build` runs `scripts/check-placeholders.mjs` first and fails on `YOUR_`, `TODO`, `info@` etc.
- The contact form works without a key (mailto to `researchatmartin@gmail.com`). Web3Forms is
  optional via `PUBLIC_WEB3FORMS_KEY` in `.env`.
- `media_source/` (1080p Bowie original, 132.9 MB; unused live-site assets) is git-ignored and never
  deployed.

## State

*Measured 2026-09-15.*

- Build: **8 pages, placeholder check passes.** VERIFIED 2026-09-15.
- Links: **120 internal refs in `dist`, 0 missing.** VERIFIED 2026-09-15.
- `dist` 48 MB. Largest file `studio-film.mp4` 23.3 MB, under the 25 MiB Cloudflare Pages limit.
  Bowie film re-encoded 132.9 → 16.0 MB (−88 %, 720p CRF 27). VERIFIED 2026-09-15.
- Rendered in headless Edge at 1440 px: home, gallery, about, contact, film. VERIFIED 2026-09-15.
- At 400 px, 6 pages have content width = viewport with no element overflowing. VERIFIED 2026-09-15.
- Click-test `scripts/click-test.mjs` (Playwright + Edge, desktop 1440 px and emulated Pixel 7):
  **46/46 pass** (41 + 5 WhatsApp) — hover-play/rewind, lightbox open/next/prev/wrap/keys/Escape/Close, all 10 works
  load and fit, filters scope the lightbox, all 8 pages no overflow at 412 px, `/film/` loads, plays
  and seeks, tap lightbox on phone, form validation and exact mailto subject/body. VERIFIED 2026-09-15.
  Emulation only — a real phone is still UNTESTED.
- **Fixed 2026-09-15:** backdrop click never closed the lightbox (the full-screen `.lb-inner`
  covers the `<dialog>`, so `e.target === dlg` was unreachable). Now closes on empty stage/padding;
  clicking the work itself does not.
- **WhatsApp added 2026-09-15** (number `+44 7710 020669` supplied by Vivian, not on the live site —
  Martin to confirm it may be published): link in the contact column and a *Send on WhatsApp*
  form button that opens `wa.me/447710020669` with the enquiry pre-filled (name + message required,
  email/phone optional). VERIFIED by click-test 2026-09-15.
- **Git lives in the copy, not here.** On 2026-09-15 this folder was copied to
  `C:\Users\vivia\Code\Business\Martin` (at Vivian's explicit request, despite the frozen-archive
  rule) and pushed from there to private `github.com/vivian4fb/martin-website`, `main` @ `bb61b69`,
  50 files. VERIFIED 2026-09-15. This Code2 folder has no `.git`; edits here must be copied across
  or the two diverge.
- Pages preview build (`ASTRO_BASE=/martin-website`): 115 refs, 0 missing, noindex on, canonical
  → martin-richardson.com. VERIFIED 2026-09-15. Pages not enabled; workflow is manual-only.
- **Holographic background + depth, 2026-09-15.** The live site's banner
  (`holographic_diffraction_background-1080p-1.mp4`, 1080p 52 s 23 MB, from its Elementor
  `background_video_link`) now sits fixed behind every page: `bg-holo-480.mp4` 1.7 MB on phones,
  `bg-holo-720.mp4` 3.6 MB ≥ 900 px, silent H.264 Main + faststart, poster from t = 45 s. Perspective
  stage recedes/tilts on scroll, idles in a slow 3D hover, tilts with the mouse on desktop. Content
  blocks and gallery cards float at 3 rates (±48 px, halved < 820 px); bordered lists float whole.
  Reduced motion or Data Saver → poster only, nothing floats. Pauses under the lightbox and in
  background tabs. iOS autoplay blocked (Low Power Mode) → poster, plays on first touch.
- **Phone compatibility, 2026-09-15:** `viewport-fit=cover` + safe-area insets (notch, landscape,
  home bar), `lvh`/`dvh` with `vh` fallbacks, hover-play only on fine pointers, no tap highlight.
  `scripts/device-test.mjs`: **169/169** across WebKit (iPhone SE, 15 Pro Max, 13 landscape, iPad
  Mini) and Chromium (Galaxy S9+, Pixel 7, Galaxy Tab S4, desktop) — no sideways scroll on 7 pages,
  right video size plays, float works, menu, form ≥ 16 px inputs, lightbox, reduced motion.
  Emulated engines, not physical handsets. VERIFIED 2026-09-15.
- **Review preview LIVE 2026-09-15:** `https://vivian4fb.github.io/martin-website/` (repo made
  public by Vivian). Served from the `gh-pages` branch (`b68c285`, preview build of `e1b4a75` with
  `.nojekyll`), not the Actions workflow — the gh PAT lacks Pages/Actions write (403). To update:
  build with `ASTRO_SITE`/`ASTRO_BASE`/`PUBLIC_NOINDEX`, push `dist` + `.nojekyll` to `gh-pages`.
  **Build from PowerShell, not Git Bash:** Bash rewrote `/martin-website` to
  `C:/Program Files/Git/martin-website` and `b68c285` shipped with every link broken (caught by
  the live test). `astro.config.mjs` now throws on a malformed base. Grep `dist` for
  `Program Files` before pushing.
  Live check: all pages + media 200/206, noindex on, canonical → martin-richardson.com, click-test
  46/46 against the live URL. VERIFIED 2026-09-15.
- Production not deployed. The live WordPress site is untouched.

## Fixed against the live site

Broken Science Museum link (`web.https://…`, now HTTP 200); nine dead "Read More" buttons; the
WordPress `sample-page` and `hello-world` stubs.

## Next

1. Martin confirms the three titles, the quote correction, and supplies dates, media and
   higher-resolution originals (stills are 390 × 219 px).
2. Click-test the lightbox and form on a real phone.
3. Enable Pages (Settings → Pages → GitHub Actions; private repo needs GitHub Pro), run
   *Deploy review preview*, share `https://vivian4fb.github.io/martin-website/` with Martin.
   The URL is public to anyone who has it.
4. Production: Cloudflare Pages at the domain root, then point the domain.
