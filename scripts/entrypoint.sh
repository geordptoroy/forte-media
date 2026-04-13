#!/bin/sh
set -e

# Remover CRLF
sed -i 's/\r$//' "$0"

echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Starting Forte Media Backend..."
echo ">>> NODE_ENV: ${NODE_ENV:-production}"

# Aguardar MySQL
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Waiting for MySQL at db:3306..."
RETRY_COUNT=0
MAX_RETRIES=30
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if nc -z db 3306 2>/dev/null; then
    echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] MySQL is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "!!! [$(date '+%Y-%m-%d %H:%M:%S')] MySQL failed to start"
  exit 1
fi

# Sincronizar Drizzle
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Syncing database schema..."
if [ -f "drizzle.config.js" ]; then
  # O drizzle-kit push usa o schema definido no config file.
  npx drizzle-kit push --config=drizzle.config.js
  echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Database schema synced"
else
  echo "!!! [$(date '+%Y-%m-%d %H:%M:%S')] Warning: drizzle.config.js not found"
fi

# Iniciar Node
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Starting Node.js server..."
exec node dist/index.js
