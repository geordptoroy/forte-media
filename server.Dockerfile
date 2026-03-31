FROM node:22-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar package files
COPY package.json pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY patches ./patches
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Build
RUN pnpm run build

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["node", "dist/index.js"]
