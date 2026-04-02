#!/bin/sh
echo ">>> Iniciando Backend Entrypoint..."
echo ">>> Aguardando MySQL em db:3306..."
while ! nc -z db 3306; do
  echo ">>> MySQL ainda nao responde. Aguardando 2s..."
  sleep 2
done
echo ">>> OK: MySQL esta pronto."
echo ">>> Sincronizando schema do banco de dados..."
pnpm db:push || echo "!!! AVISO: Migrations falharam, continuando arranque..."
echo ">>> Iniciando servidor Node.js..."
exec node dist/index.js
