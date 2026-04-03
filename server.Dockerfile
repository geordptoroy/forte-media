# Stage de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar apenas os arquivos de lock e package.json para cache de dependencias
COPY package.json pnpm-lock.yaml ./
COPY client/package.json client/pnpm-lock.yaml client/
COPY server/package.json server/pnpm-lock.yaml server/
COPY shared/package.json shared/pnpm-lock.yaml shared/

# Instalar dependencias
RUN corepack enable && pnpm install --frozen-lockfile

# Copiar o restante do codigo
COPY . .

# Build do TypeScript
RUN pnpm build:server

# Stage de Produção
FROM node:20-alpine

WORKDIR /app

# Copiar apenas os arquivos necessarios do estagio de build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/bin/sh", "./scripts/entrypoint.sh"]
