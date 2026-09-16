# Martin Richardson — holography gallery site

An Astro rebuild of `martin-richardson.com` (currently WordPress). It is a dark, exhibition-style
personal gallery with motion works that play on hover, a full-screen viewer, the Bowie film,
publications, a biography and an enquiry form. Built on the same pattern as `../ontarget`.

## Run locally
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # placeholder check, then static output in ./dist
npm run preview
```

## Edit content in one file
`src/config.ts` holds every fact, quote, work, publication and the contact address. Pages only read
from it. **Sourcing rule:** everything in it was taken from the live site on 2026-09-15. Add
nothing that is not on the live site or supplied by Martin.

## Pages
| Route | Content |
|---|---|
| `/` | Hero motion work, headline figures, practice, quotes, selected works, film teaser, publications, enquiry CTA |
| `/gallery/` | All 10 works, filterable (Motion · Stills · Film), full-screen viewer with ← → keys |
| `/film/` | David Bowie film, 3:54, 720p |
| `/publications/` | 9 books and 1 article |
| `/about/` | Biography, milestones, sitters, collection |
| `/contact/` | Enquiry form |
| `/disclaimer/` | Plain-English summary; the original PDF is at `/docs/disclaimer.pdf` and prevails |

## For Martin to confirm before launch
1. **Three work titles come from file names, not from him.** On the live site their files are
   `gyujygh-1.jpg`, `hyjuh-1.jpg` and `WhatsApp-Video-2024-10-11….mp4`. They appear here as
   *Cast on Pastels*, *Objects on a Colour Chart* and *Studio Reel* (`confirm: true` in config).
2. **Peter Blake quote typo.** The live site reads "people in silver sits"; it is shown here as
   "silver suits".
3. **Dates and media for each work.** The live site gives none. Real titles, years and media would
   lift the gallery more than any design change.
4. **The Millennium Fellowship and the De Montfort post** have no year on the live site, so they
   show "—" in the timeline.
5. **Higher-resolution media.** Stills are 390 × 219 px and four motion works are 640 × 480; they are
   soft at full screen. Originals from Martin would fix it.

## Contact form
It works without any key: submitting opens the visitor's mail client, addressed to
`researchatmartin@gmail.com`. For direct delivery, register that address at web3forms.com and put
the key in `.env` as `PUBLIC_WEB3FORMS_KEY`, then rebuild. See `.env.example`.

## Media
- `public/media/` holds everything the site serves. Bowie film re-encoded from 132.9 MB (1080p)
  to 16.0 MB (720p, H.264 CRF 27, faststart) so every file stays under the 25 MiB Cloudflare Pages
  limit.
- `media_source/` holds the 1080p original and unused live-site assets. It is git-ignored and never
  deployed.

## Review preview for Martin (GitHub Pages)
Workflow: `.github/workflows/pages.yml`, **manual trigger only**. Nothing is published until you run it.

1. Repo → Settings → Pages → Source: **GitHub Actions**. Pages on a private repo needs GitHub Pro.
2. Actions → *Deploy review preview* → **Run workflow**.
3. Share `https://vivian4fb.github.io/martin-website/`.

The preview build serves under `/martin-website`, carries `noindex`, and points its canonical at
martin-richardson.com so it cannot compete with the live site in search. **A Pages site is public to
anyone who has the URL, even from a private repo.**

To build the preview locally in Git Bash, disable path conversion or the base is mangled:
`MSYS_NO_PATHCONV=1 ASTRO_BASE=/martin-website npx astro build`.

## Deploy

### Docker (own server, own domain)
The site is static, so the image is nginx plus `./dist` — no Node at runtime. Caddy sits in front and
obtains the HTTPS certificate itself.

| File | Purpose |
|---|---|
| `Dockerfile` | Stage 1 builds with Node 22; stage 2 serves from `nginxinc/nginx-unprivileged` (uid 101, port 8080) |
| `docker/nginx.conf` | Caching, gzip, security headers, `/healthz`, `404.html` |
| `docker/security-headers.conf` | The security headers, included by every block that sets its own `add_header` — nginx drops inherited ones there |
| `docker/Caddyfile` | HTTPS for the domain, `www` → apex, HSTS, proxy to `site:8080` |
| `docker-compose.yml` | Production: `site` + `caddy` on ports 80/443 |
| `docker-compose.local.yml` | Publishes the site on `localhost:8080` for checking, without Caddy |

Check the production image locally:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build site
BASE=http://localhost:8080 node scripts/click-test.mjs     # 46 checks
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

Deploy to the domain, on a host with ports 80 and 443 free:
```bash
SITE_DOMAIN=martin-richardson.com ACME_EMAIL=you@example.org docker compose up -d --build
```
**Point the domain's DNS at the host first.** Caddy asks Let's Encrypt for a certificate on startup;
if DNS still points at WordPress the request fails, and repeated failures hit a rate limit. Keep the
WordPress host running until the new site answers on the domain.

A placeholder in `src/` or `public/` fails the image build, as `npm run build` runs the placeholder
check first. To deliver enquiries straight to the inbox rather than by mail client, pass the key at
build time: `--build-arg PUBLIC_WEB3FORMS_KEY=…` (it is compiled into the page, so it is not a secret).

### Hosted platforms
Cloudflare Pages or Netlify: build command `npm run build`, output directory `dist`, no base path.
Point the domain only after the new site is checked on its preview URL; the WordPress host stays live
until then.

## Fixed from the live site
- The Science Museum link was broken (`https://web.https://collection…`); it now resolves (HTTP 200,
  2026-09-15).
- The "Read More" buttons led nowhere except the last one. Only the real link is kept.
- The sitemap still carried WordPress `sample-page` and `hello-world` stubs. The new site has neither.
