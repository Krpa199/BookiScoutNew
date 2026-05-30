# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Next.js 15 standalone build.
# Builds once, ships a minimal runtime image (~250 MB) suitable for $6 DO Droplet.

# ─────────────────────────────────────────────────────────────
# Stage 1: deps — install only production-relevant dependencies
# Using Debian slim (glibc) instead of Alpine (musl) because Next.js 15's
# next.config.ts loader depends on @parcel/watcher which has no musl prebuild.
# ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ─────────────────────────────────────────────────────────────
# Stage 2: builder — full source + build
# ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry and pass through public env vars needed at build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Public env vars — Next.js inlines NEXT_PUBLIC_* into the client bundle at build time.
# Pass them via `docker compose build --build-arg` or args in docker-compose.yml.
ARG NEXT_PUBLIC_SITE_URL=https://bookiscout.com
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 3: runner — minimal runtime image
# ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# wget is needed for HEALTHCHECK — install minimal version
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Standalone output bundles only the files needed at runtime
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Healthcheck — Caddy will route based on this
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
