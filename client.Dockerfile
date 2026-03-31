FROM node:22-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package files e patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./

# Build
RUN cd client && pnpm run build

# Usar nginx para servir arquivos estáticos
FROM nginx:alpine

COPY --from=0 /app/client/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
