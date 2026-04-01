#!/bin/bash
set -e

# FORTE MEDIA - Docker Startup Script
# Optimized for Linux/macOS and Docker-only execution

echo "🚀 FORTE MEDIA - Docker Startup Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker e Docker Compose encontrados${NC}"

# Create certs directory if it doesn't exist
if [ ! -d "nginx/certs" ]; then
    echo -e "${YELLOW}📂 Criando diretório de certificados...${NC}"
    mkdir -p nginx/certs
fi

# Generate SSL certificates if they don't exist
if [ ! -f "nginx/certs/server.crt" ] || [ ! -f "nginx/certs/server.key" ]; then
    echo -e "${YELLOW}🔐 Gerando certificados SSL autoassinados...${NC}"
    openssl req -x509 -newkey rsa:4096 \
        -keyout nginx/certs/server.key \
        -out nginx/certs/server.crt \
        -days 365 -nodes \
        -subj "/C=BR/ST=SP/L=Sao Paulo/O=FORTE MEDIA/CN=localhost"
    echo -e "${GREEN}✅ Certificados gerados${NC}"
else
    echo -e "${GREEN}✅ Certificados já existem${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Por favor, edite o arquivo .env com suas credenciais${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker-compose down 2>/dev/null || true

# Build and start
echo -e "${YELLOW}🏗️  Building e iniciando containers...${NC}"
docker-compose up -d --build

# Wait for MySQL to be ready (step 1: ping via localhost inside db container)
echo -e "${YELLOW}⏳ Aguardando MySQL ficar pronto...${NC}"
for i in {1..30}; do
    if docker-compose exec -T db mysqladmin ping -h localhost &> /dev/null; then
        echo -e "${GREEN}✅ MySQL está aceitando pings${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for MySQL to accept TCP connections from the backend container (step 2)
echo -e "${YELLOW}⏳ Aguardando MySQL aceitar conexões TCP do backend...${NC}"
TCP_READY=false
for i in {1..30}; do
    if docker-compose exec -T backend sh -c "nc -z db 3306" &> /dev/null; then
        TCP_READY=true
        echo -e "${GREEN}✅ MySQL está pronto para conexões TCP${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

if [ "$TCP_READY" = false ]; then
    echo -e "${YELLOW}⚠️  Não foi possível confirmar conexão TCP. Aguardando mais 5 segundos...${NC}"
    sleep 5
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Executando migrations do banco de dados...${NC}"
if ! docker-compose exec -T backend pnpm db:push; then
    echo -e "${YELLOW}⚠️  Migrations falharam. Tentando novamente em 5 segundos...${NC}"
    sleep 5
    docker-compose exec -T backend pnpm db:push || \
        echo -e "${YELLOW}⚠️  Migrations ainda falharam. Verifique os logs com: docker-compose logs backend${NC}"
fi

echo ""
echo -e "${GREEN}✅ FORTE MEDIA iniciado com sucesso!${NC}"
echo ""
echo -e "${YELLOW}🌐 URLs de Acesso:${NC}"
echo -e "   📍 Frontend:  ${GREEN}https://localhost${NC}"
echo -e "   📍 Backend:   ${GREEN}https://localhost/api${NC}"
echo ""
echo -e "${YELLOW}🛠️  Comandos úteis:${NC}"
echo -e "   - Parar:      ${GREEN}docker-compose down${NC}"
echo -e "   - Logs:       ${GREEN}docker-compose logs -f${NC}"
echo -e "   - Reiniciar:  ${GREEN}docker-compose restart${NC}"
echo ""
