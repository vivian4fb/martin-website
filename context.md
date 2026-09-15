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
  `/film/` at 400 px UNTESTED. Lightbox and hover-play not clicked through, UNTESTED.
- Not a git repository. Not deployed. The live WordPress site is untouched.

## Fixed against the live site

Broken Science Museum link (`web.https://…`, now HTTP 200); nine dead "Read More" buttons; the
WordPress `sample-page` and `hello-world` stubs.

## Next

1. Martin confirms the three titles, the quote correction, and supplies dates, media and
   higher-resolution originals (stills are 390 × 219 px).
2. Click-test the lightbox and form on a real phone.
3. Deploy to Cloudflare Pages preview, then point the domain.
