#!/bin/bash

# ============================================================================
# Health Check Script para Forte Media
# Verifica saúde de todos os serviços
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-forte_user}"
DB_PASSWORD="${DB_PASSWORD:-forte_password}"

# Contadores
HEALTHY=0
UNHEALTHY=0

# Função para testar endpoint HTTP
check_http() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}

  echo -n "Verificando $name... "

  if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null); then
    if [ "$response" = "$expected_code" ]; then
      echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
      ((HEALTHY++))
      return 0
    else
      echo -e "${RED}✗ FALHOU${NC} (HTTP $response, esperado $expected_code)"
      ((UNHEALTHY++))
      return 1
    fi
  else
    echo -e "${RED}✗ FALHOU${NC} (Sem resposta)"
    ((UNHEALTHY++))
    return 1
  fi
}

# Função para testar conexão MySQL
check_mysql() {
  echo -n "Verificando MySQL... "

  if command -v mysqladmin &> /dev/null; then
    if mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; then
      echo -e "${GREEN}✓ OK${NC}"
      ((HEALTHY++))
      return 0
    else
      echo -e "${RED}✗ FALHOU${NC}"
      ((UNHEALTHY++))
      return 1
    fi
  else
    echo -e "${YELLOW}⊘ PULADO${NC} (mysqladmin não instalado)"
    return 0
  fi
}

# Função para testar DNS
check_dns() {
  local host=$1
  echo -n "Verificando DNS ($host)... "

  if nslookup "$host" &> /dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
    ((HEALTHY++))
    return 0
  else
    echo -e "${RED}✗ FALHOU${NC}"
    ((UNHEALTHY++))
    return 1
  fi
}

# Header
echo "=========================================="
echo "Forte Media - Health Check"
echo "=========================================="
echo ""

# Executar checks
check_http "Backend" "$BACKEND_URL/health"
check_http "Frontend" "$FRONTEND_URL" 200
check_mysql

echo ""
echo "=========================================="
echo "Resumo:"
echo -e "  ${GREEN}Saudáveis: $HEALTHY${NC}"
echo -e "  ${RED}Não saudáveis: $UNHEALTHY${NC}"
echo "=========================================="

# Exit code
if [ $UNHEALTHY -eq 0 ]; then
  exit 0
else
  exit 1
fi
