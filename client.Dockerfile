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

# Build do frontend (o comando 'pnpm build:client' usa o vite.config.ts na raiz)
RUN pnpm build:client

# Stage de Produção
FROM nginx:stable-alpine

# Copiar o build do frontend para o Nginx (o output vai para dist/public de acordo com vite.config.ts)
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Copiar a configuracao do Nginx para o frontend
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
