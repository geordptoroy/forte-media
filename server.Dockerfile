# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source files
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json vite.config.ts ./

# Build the backend
RUN pnpm build:server

# Stage 3: Production
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies (netcat for healthcheck, curl for debugging)
RUN apk add --no-cache netcat-openbsd curl

# Install pnpm
RUN npm install -g pnpm

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Copy scripts
COPY scripts ./scripts

# Ensure scripts are executable
RUN chmod +x /app/scripts/*.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=45s \
  CMD curl -f http://localhost:4000/health || exit 1

# Start application
ENTRYPOINT ["/bin/sh", "/app/scripts/entrypoint.sh"]
