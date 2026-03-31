#!/bin/bash

set -e

echo "🚀 FORTE MEDIA - Docker Startup Script"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker e Docker Compose encontrados${NC}"

# Criar diretório de certificados se não existir
if [ ! -d "nginx/certs" ]; then
    echo -e "${YELLOW}📁 Criando diretório de certificados...${NC}"
    mkdir -p nginx/certs
fi

# Gerar certificados SSL se não existirem
if [ ! -f "nginx/certs/server.crt" ] || [ ! -f "nginx/certs/server.key" ]; then
    echo -e "${YELLOW}🔐 Gerando certificados SSL autoassinados...${NC}"
    openssl req -x509 -newkey rsa:4096 \
        -keyout nginx/certs/server.key \
        -out nginx/certs/server.crt \
        -days 365 -nodes \
        -subj "/C=BR/ST=SP/L=São Paulo/O=FORTE MEDIA/CN=localhost"
    echo -e "${GREEN}✅ Certificados gerados${NC}"
else
    echo -e "${GREEN}✅ Certificados já existem${NC}"
fi

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Por favor, edite o arquivo .env com suas credenciais${NC}"
fi

# Verificar se .env tem valores vazios
if grep -q "^VITE_APP_ID=$" .env || grep -q "^VITE_APP_ID=$" .env; then
    echo -e "${YELLOW}⚠️  AVISO: Você precisa configurar as variáveis de ambiente em .env${NC}"
    echo -e "${YELLOW}   - VITE_APP_ID${NC}"
    echo -e "${YELLOW}   - OAUTH_SERVER_URL${NC}"
    echo -e "${YELLOW}   - Outras credenciais Manus${NC}"
fi

# Parar containers existentes
echo -e "${YELLOW}🛑 Parando containers existentes...${NC}"
docker-compose down 2>/dev/null || true

# Build e start
echo -e "${YELLOW}🔨 Building e iniciando containers...${NC}"
docker-compose up -d --build

# Aguardar MySQL estar pronto
echo -e "${YELLOW}⏳ Aguardando MySQL ficar pronto...${NC}"
for i in {1..30}; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost &> /dev/null; then
        echo -e "${GREEN}✅ MySQL está pronto${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Executar migrations
echo -e "${YELLOW}🗄️  Executando migrations do banco de dados...${NC}"
docker-compose exec -T backend pnpm db:push || true

# Aguardar backend estar pronto
echo -e "${YELLOW}⏳ Aguardando backend ficar pronto...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health &> /dev/null; then
        echo -e "${GREEN}✅ Backend está pronto${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Aguardar frontend estar pronto
echo -e "${YELLOW}⏳ Aguardando frontend ficar pronto...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 &> /dev/null; then
        echo -e "${GREEN}✅ Frontend está pronto${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}✅ FORTE MEDIA iniciado com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📍 URLs de Acesso:${NC}"
echo -e "   🌐 Frontend:  ${GREEN}https://localhost${NC}"
echo -e "   🔌 Backend:   ${GREEN}https://localhost/api${NC}"
echo -e "   🗄️  MySQL:     ${GREEN}localhost:3306${NC}"
echo ""
echo -e "${YELLOW}📝 Credenciais MySQL:${NC}"
echo -e "   Usuário: ${GREEN}$(grep DB_USER .env | cut -d= -f2)${NC}"
echo -e "   Banco:   ${GREEN}$(grep DB_NAME .env | cut -d= -f2)${NC}"
echo ""
echo -e "${YELLOW}🛑 Para parar os containers:${NC}"
echo -e "   ${GREEN}docker-compose down${NC}"
echo ""
echo -e "${YELLOW}📋 Para ver logs:${NC}"
echo -e "   ${GREEN}docker-compose logs -f${NC}"
echo ""
echo -e "${YELLOW}🔄 Para reiniciar:${NC}"
echo -e "   ${GREEN}docker-compose restart${NC}"
echo ""
