import { defineConfig } from 'astro/config';

// Production: https://martin-richardson.com at the domain root.
// GitHub Pages preview: the workflow sets ASTRO_SITE and ASTRO_BASE (/martin-website).
// https://astro.build/config
export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://martin-richardson.com',
  base: process.env.ASTRO_BASE || '/',
});
