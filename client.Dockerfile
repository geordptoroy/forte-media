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

# Build do frontend usando o script do package.json
RUN pnpm build:client

# Etapa 2: Produção (Nginx Leve)
FROM nginx:stable-alpine AS runner

WORKDIR /usr/share/nginx/html

# Copiar o build estático para o Nginx
COPY --from=builder /app/dist/public .
# Copiar configuração personalizada do Nginx para o frontend
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Instalar utilitários para o healthcheck (wget)
RUN apk add --no-cache wget

EXPOSE 80

# Healthcheck interno do Docker
HEALTHCHECK --interval=15s --timeout=10s --retries=5 --start-period=20s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
