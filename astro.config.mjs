import { defineConfig } from 'astro/config';

// Production: https://martin-richardson.com at the domain root.
// GitHub Pages preview: the workflow sets ASTRO_SITE and ASTRO_BASE (/martin-website).
// https://astro.build/config
const base = process.env.ASTRO_BASE || '/';
// Git Bash rewrites "/martin-website" into "C:/Program Files/Git/martin-website", which builds a
// site whose every link is broken. Fail the build instead of deploying it.
if (!/^\/[\w\-/]*$/.test(base)) {
  throw new Error(`ASTRO_BASE must be a URL path such as /martin-website, got "${base}". From Git Bash, set MSYS_NO_PATHCONV=1 or build from PowerShell.`);
}

export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://martin-richardson.com',
  base,
});
