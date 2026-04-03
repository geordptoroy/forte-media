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

WORKDIR /app/client

# Build do frontend
RUN pnpm build

# Stage de Produção
FROM nginx:stable-alpine

# Copiar o build do frontend para o Nginx
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copiar a configuracao do Nginx para o frontend
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
