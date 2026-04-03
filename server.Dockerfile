# Etapa 1: Build (Ambiente Completo)
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm e dependências de sistema
RUN corepack enable && \
    apk add --no-cache python3 make g++ gcc musl-dev libc6-compat

# Copiar ficheiros de dependências da raiz
COPY package.json pnpm-lock.yaml ./
# Copiar patches para aplicação correta no install
COPY patches ./patches

# Instalar dependências (incluindo devDependencies para o build)
RUN pnpm install --frozen-lockfile

# Copiar todo o código fonte para garantir que shared/ e outros estão disponíveis
COPY . .

# Build do backend usando o script do package.json
RUN pnpm build:server

# Etapa 2: Produção (Imagem Leve)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Instalar utilitários de rede para o entrypoint (nc)
RUN apk add --no-cache netcat-openbsd

# Copiar apenas o necessário da etapa anterior
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.js ./drizzle.config.js
COPY --from=builder /app/scripts/entrypoint.sh ./scripts/entrypoint.sh

# Corrigir permissões e formato do entrypoint
RUN chmod +x ./scripts/entrypoint.sh && \
    sed -i 's/\r$//' ./scripts/entrypoint.sh

EXPOSE 4000

# Usar caminho absoluto para evitar qualquer ambiguidade
ENTRYPOINT ["/bin/sh", "/app/scripts/entrypoint.sh"]
