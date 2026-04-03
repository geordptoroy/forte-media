# Stage de Build
FROM node:20-alpine AS builder

WORKDIR /app

# O projeto usa um único package.json e pnpm-lock.yaml na raiz
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias usando o lock da raiz
RUN corepack enable && pnpm install --frozen-lockfile

# Copiar o restante do codigo
COPY . .

# Build do TypeScript (o comando 'pnpm build:server' usa o esbuild)
RUN pnpm build:server

# Stage de Produção
FROM node:20-alpine

WORKDIR /app

# Copiar apenas os arquivos necessarios do estagio de build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/bin/sh", "./scripts/entrypoint.sh"]
