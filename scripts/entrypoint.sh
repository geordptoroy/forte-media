#!/bin/sh
set -e

echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Starting Backend Entrypoint..."
echo ">>> NODE_ENV: ${NODE_ENV}"
echo ">>> PORT: ${PORT}"

# Wait for MySQL to be ready
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

# Run migrations (non-blocking if they fail)
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Syncing database schema..."
if pnpm db:push 2>&1; then
  echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Database migrations completed successfully"
else
  echo "!!! [$(date '+%Y-%m-%d %H:%M:%S')] Database migrations failed, but continuing startup..."
fi

# Start the Node.js server
echo ">>> [$(date '+%Y-%m-%d %H:%M:%S')] Starting Node.js server..."
exec node dist/index.js
