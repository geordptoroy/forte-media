# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm e esbuild
RUN npm install -g pnpm esbuild

# Copiar arquivos de dependências e patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte e configurações
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json vite.config.ts ./

# Build do backend usando o script do package.json
RUN pnpm build:server

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm para rodar migrations se necessário
RUN npm install -g pnpm

# Copiar apenas o necessário do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
COPY scripts/healthcheck.js ./scripts/healthcheck.js
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD node scripts/healthcheck.js

# Iniciar servidor
CMD ["node", "dist/index.js"]
