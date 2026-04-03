#!/bin/sh
# Garantir que o script para se houver erro
set -e

# Remover caracteres de retorno de carro (CRLF) se existirem
# Isso é uma redundância de segurança para o Docker em Windows
sed -i 's/\r$//' "$0"

echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Starting Backend Entrypoint..."
echo ">>> NODE_ENV: ${NODE_ENV:-production}"
echo ">>> PORT: ${PORT:-4000}"

# Aguardar pela Base de Dados
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Waiting for MySQL at db:3306..."
RETRY_COUNT=0
MAX_RETRIES=30
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if nc -z db 3306 2>/dev/null; then
    echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] MySQL is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] MySQL not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES). Waiting 2s..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "!!! [$(date '+%Y-%m-%d %H:%M:%S')] MySQL failed to start after $MAX_RETRIES attempts"
  exit 1
fi

# Sincronizar esquema da base de dados (Drizzle)
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Syncing database schema..."
# Usamos o ficheiro .js para evitar dependência de ts-node em produção
if [ -f "drizzle.config.js" ]; then
  ./node_modules/.bin/drizzle-kit push --config=drizzle.config.js
  echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Database schema synced successfully"
else
  echo "!!! [$(date '+%Y-%m-%d %H:%M:%S')] Warning: drizzle.config.js not found, skipping migration"
fi

# Iniciar o Servidor Node.js
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Starting Node.js server..."
# Usar exec para que o Node receba sinais do Docker (SIGTERM)
exec node dist/index.js
