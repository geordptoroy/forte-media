# Stage de Build
FROM node:20-alpine AS builder

WORKDIR /app

# O projeto usa um único package.json e pnpm-lock.yaml na raiz
COPY package.json pnpm-lock.yaml ./

# Copiar a pasta de patches necessária para a instalação de dependências
COPY patches ./patches

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
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
# Garantir que o diretório scripts existe e copiar o entrypoint
RUN mkdir -p ./scripts
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh && \
    sed -i 's/\r$//' ./scripts/entrypoint.sh

EXPOSE 4000

# Usar caminho absoluto para evitar problemas de WORKDIR
ENTRYPOINT ["/bin/sh", "/app/scripts/entrypoint.sh"]
