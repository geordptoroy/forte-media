# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependências e patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte e configurações
COPY client ./client
COPY shared ./shared
COPY tsconfig.json vite.config.ts ./

# Build do frontend (saída em dist/public conforme vite.config.ts)
# Usamos apenas o build:client para evitar erros de resolução do servidor neste contexto
RUN pnpm build:client

# Stage 2: Production
FROM nginx:alpine

# Copiar build do estágio anterior (dist/public)
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Copiar configuração do nginx (opcional se já montado via volume, mas bom ter como fallback)
# COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
