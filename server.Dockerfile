# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm e dependências de sistema necessárias para node-gyp
RUN corepack enable && \
    apk add --no-cache python3 make g++ gcc musl-dev libc6-compat

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build do backend
RUN pnpm build:server

# Etapa 2: Produção
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Instalar utilitários essenciais
RUN apk add --no-cache netcat-openbsd wget

# Copiar apenas o necessário da etapa de build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js
COPY --from=builder /app/scripts/entrypoint.sh ./scripts/entrypoint.sh
COPY --from=builder /app/init.sql ./init.sql

# Garantir permissões e formato do entrypoint
RUN chmod +x ./scripts/entrypoint.sh && \
    sed -i 's/\r$//' ./scripts/entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/bin/sh", "/app/scripts/entrypoint.sh"]
