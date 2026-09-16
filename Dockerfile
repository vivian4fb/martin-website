# Martin Richardson — holography gallery site.
# Two stages: build the static site with Node, then serve it with nginx.
# The runtime image holds no Node, no source and no npm cache — only ./dist and nginx.

# ── Build ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Production build for the domain root. Override at build time for a preview host:
#   docker build --build-arg ASTRO_SITE=https://staging.example.com --build-arg PUBLIC_NOINDEX=1 .
# ASTRO_BASE stays "/" here; a sub-path base belongs to the GitHub Pages preview, not to this image.
ARG ASTRO_SITE=https://martin-richardson.com
ARG PUBLIC_NOINDEX=""
ARG PUBLIC_WEB3FORMS_KEY=""

# Dependencies first, so edits to src/ do not re-run npm ci.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# `npm run build` runs scripts/check-placeholders.mjs first: a placeholder fails the image build.
RUN ASTRO_SITE="$ASTRO_SITE" PUBLIC_NOINDEX="$PUBLIC_NOINDEX" PUBLIC_WEB3FORMS_KEY="$PUBLIC_WEB3FORMS_KEY" npm run build \
    && test -f dist/index.html \
    && test -f dist/404.html \
    && ! grep -rq 'Program Files' dist

# ── Serve ──────────────────────────────────────────────────────────────────
# Unprivileged nginx: runs as uid 101, listens on 8080, so no root and no capabilities needed.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS serve

LABEL org.opencontainers.image.title="martin-richardson-holography" \
      org.opencontainers.image.description="Static holography gallery site for martin-richardson.com" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/conf.d/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
