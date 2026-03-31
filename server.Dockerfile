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
RUN pnpm exec esbuild server/_core/index.ts --platform=node --bundle --format=esm --outdir=dist --external:lightningcss

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
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["node", "dist/index.js"]
