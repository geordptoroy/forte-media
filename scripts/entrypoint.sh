#!/bin/sh
set -e

# FORTE MEDIA - Unified Entrypoint
# -------------------------------

echo ">>> Iniciando Backend Entrypoint..."

# 1. Aguardar MySQL (TCP Check)
echo ">>> Aguardando MySQL em db:3306..."
MAX_RETRIES=30
COUNT=0
while ! nc -z db 3306; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "!!! ERRO: MySQL nao ficou pronto a tempo."
    exit 1
  fi
  echo ">>> MySQL ainda nao responde ($COUNT/$MAX_RETRIES). Aguardando 2s..."
  sleep 2
done
echo ">>> OK: MySQL esta pronto."

# 2. Executar Migrations (Drizzle Push)
echo ">>> Sincronizando schema do banco de dados (DATABASE_URL: $DATABASE_URL)..."
if ! pnpm db:push; then
  echo "!!! AVISO: Falha na sincronizacao inicial. Tentando novamente em 5s..."
  sleep 5
  pnpm db:push || echo "!!! AVISO: Falha persistente nas migrations. Continuando arranque..."
fi

# 3. Iniciar Servidor
echo ">>> Iniciando servidor Node.js..."
exec node dist/index.js
