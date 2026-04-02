#!/bin/sh

echo ">>> Iniciando Backend Entrypoint..."

# 1. Aguardar MySQL
echo ">>> Aguardando MySQL em db:3306..."
while ! nc -z db 3306; do
  echo ">>> MySQL ainda nao responde. Aguardando 2s..."
  sleep 2
done
echo ">>> OK: MySQL esta pronto."

# 2. Executar Migrations
echo ">>> Sincronizando schema do banco de dados..."
pnpm db:push || echo "!!! AVISO: Migrations falharam, continuando arranque..."

# 3. Iniciar Servidor
echo ">>> Iniciando servidor Node.js..."
exec node dist/index.js
