# FORTE MEDIA - Docker Startup Script for Windows PowerShell
# Usage: .\docker-start.ps1

Write-Host "🚀 FORTE MEDIA - Docker Startup Script (Windows)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"

# Check if Docker is installed
Write-Host "Verificando Docker..." -ForegroundColor $WarningColor
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor $SuccessColor
} catch {
    Write-Host "❌ Docker não está instalado ou não está no PATH" -ForegroundColor $ErrorColor
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose encontrado: $composeVersion" -ForegroundColor $SuccessColor
} catch {
    Write-Host "❌ Docker Compose não está instalado ou não está no PATH" -ForegroundColor $ErrorColor
    exit 1
}

# Create certs directory
Write-Host "Verificando diretório de certificados..." -ForegroundColor $WarningColor
if (-not (Test-Path "nginx/certs")) {
    New-Item -ItemType Directory -Path "nginx/certs" -Force | Out-Null
    Write-Host "✅ Diretório criado" -ForegroundColor $SuccessColor
}

# Generate SSL certificates
Write-Host "Verificando certificados SSL..." -ForegroundColor $WarningColor
if (-not (Test-Path "nginx/certs/server.crt") -or -not (Test-Path "nginx/certs/server.key")) {
    Write-Host "🔐 Gerando certificados SSL autoassinados..." -ForegroundColor $WarningColor
    
    # Use OpenSSL in a single line to avoid line break issues in PowerShell
    $opensslCmd = 'openssl req -x509 -newkey rsa:4096 -keyout nginx/certs/server.key -out nginx/certs/server.crt -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=FORTE MEDIA/CN=localhost"'
    
    Invoke-Expression $opensslCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Certificados gerados com sucesso" -ForegroundColor $SuccessColor
    } else {
        Write-Host "⚠️  Erro ao gerar certificados. Verifique se o OpenSSL está instalado." -ForegroundColor $WarningColor
    }
} else {
    Write-Host "✅ Certificados já existem" -ForegroundColor $SuccessColor
}

# Create .env file
Write-Host "Verificando arquivo .env..." -ForegroundColor $WarningColor
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env a partir do exemplo..." -ForegroundColor $WarningColor
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Por favor, edite o arquivo .env com suas credenciais" -ForegroundColor $WarningColor
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor $SuccessColor
}

# Stop existing containers
Write-Host "🛑 Parando containers existentes..." -ForegroundColor $WarningColor
docker-compose down 2>$null

# Build and start
Write-Host "🏗️  Iniciando Docker Compose (Build e Up)..." -ForegroundColor $WarningColor
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar Docker Compose" -ForegroundColor $ErrorColor
    exit 1
}

# Wait for MySQL to be ready
Write-Host "⏳ Aguardando MySQL ficar pronto..." -ForegroundColor $WarningColor
for ($i=1; $i -le 30; $i++) {
    $ping = docker-compose exec -T db mysqladmin ping -h localhost 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ MySQL está pronto" -ForegroundColor $SuccessColor
        break
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 1
}

# Run database migrations
Write-Host "🗄️  Executando migrations do banco de dados..." -ForegroundColor $WarningColor
docker-compose exec -T backend pnpm db:push

Write-Host ""
Write-Host "✅ FORTE MEDIA iniciado com sucesso!" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "🌐 URLs de Acesso:" -ForegroundColor $WarningColor
Write-Host "   📍 Frontend:  https://localhost" -ForegroundColor $SuccessColor
Write-Host "   📍 Backend:   https://localhost/api" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "🛠️  Comandos úteis:" -ForegroundColor $WarningColor
Write-Host "   - Parar:      docker-compose down" -ForegroundColor $SuccessColor
Write-Host "   - Logs:       docker-compose logs -f" -ForegroundColor $SuccessColor
Write-Host "   - Reiniciar:  docker-compose restart" -ForegroundColor $SuccessColor
Write-Host ""
