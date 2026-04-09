#!/bin/bash

# ============================================================================
# Database Backup Script
# Faz backup do MySQL com compressão e rotação
# ============================================================================

set -e

# Configurações
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-forte_user}"
DB_PASSWORD="${DB_PASSWORD:-forte_password}"
DB_NAME="${DB_NAME:-forte_media}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup do banco de dados..."

# Fazer dump
if mysqldump \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" | gzip > "$BACKUP_FILE"; then
  
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Backup concluído: $BACKUP_FILE ($FILE_SIZE)"
  
  # Limpar backups antigos
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Limpando backups com mais de $RETENTION_DAYS dias..."
  find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup finalizado com sucesso"
  exit 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ Erro ao fazer backup"
  exit 1
fi
