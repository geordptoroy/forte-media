#!/bin/sh
set -e

echo "FORTE MEDIA - Backend Entrypoint"
echo "==============================="

# Wait for MySQL to be ready
echo "Aguardando MySQL (db:3306) ficar pronto..."
until nc -z db 3306; do
  echo "MySQL ainda nao esta pronto. Aguardando 2 segundos..."
  sleep 2
done
echo "OK: MySQL esta pronto para conexoes TCP."

# Run database migrations
echo "Executando migrations do banco de dados..."
pnpm db:push || {
  echo "AVISO: Migrations falharam na primeira tentativa. Aguardando 5 segundos..."
  sleep 5
  pnpm db:push
}
echo "OK: Migrations concluidas."

# Start the application
echo "Iniciando o servidor backend..."
exec node dist/index.js
