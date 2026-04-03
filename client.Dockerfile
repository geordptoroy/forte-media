# Stage de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar apenas os arquivos de lock e package.json da raiz para cache de dependencias
# O projeto usa um unico pnpm-lock.yaml na raiz para o workspace
COPY package.json pnpm-lock.yaml ./
COPY client/package.json client/
COPY server/package.json server/
COPY shared/package.json shared/

# Instalar dependencias usando o lock da raiz
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
