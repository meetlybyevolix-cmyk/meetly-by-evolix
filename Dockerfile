# Multi-stage Dockerfile for Meetly
# Build stage
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

# Install dependencies first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN CI=1 pnpm install --frozen-lockfile

# Copy application sources
COPY . .

# Build client and server bundles
RUN pnpm build

# Prune development dependencies for minimal production image
RUN CI=1 pnpm prune --prod

# Production runtime stage
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built distribution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Use non-root node user for security
USER node

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
