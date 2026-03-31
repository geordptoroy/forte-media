# FORTE MEDIA - Docker Startup Script for Windows PowerShell
# Usage: .\docker-start.ps1

Write-Host "🚀 FORTE MEDIA - Docker Startup Script (Windows)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Cores para output
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"

# Verificar se Docker está instalado
Write-Host "Verificando Docker..." -ForegroundColor $WarningColor
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor $SuccessColor
} catch {
    Write-Host "❌ Docker não está instalado ou não está no PATH" -ForegroundColor $ErrorColor
    exit 1
}

# Criar diretório de certificados
Write-Host "Criando diretório de certificados..." -ForegroundColor $WarningColor
if (-not (Test-Path "nginx/certs")) {
    New-Item -ItemType Directory -Path "nginx/certs" -Force | Out-Null
    Write-Host "✅ Diretório criado" -ForegroundColor $SuccessColor
}

# Gerar certificados SSL
Write-Host "Verificando certificados SSL..." -ForegroundColor $WarningColor
if (-not (Test-Path "nginx/certs/server.crt") -or -not (Test-Path "nginx/certs/server.key")) {
    Write-Host "Gerando certificados SSL autoassinados..." -ForegroundColor $WarningColor
    
    # Usar OpenSSL em uma única linha (compatível com PowerShell)
    $opensslCmd = 'openssl req -x509 -newkey rsa:4096 -keyout nginx/certs/server.key -out nginx/certs/server.crt -days 365 -nodes -subj "/C=BR/ST=SP/L=São Paulo/O=FORTE MEDIA/CN=localhost"'
    
    Invoke-Expression $opensslCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Certificados gerados com sucesso" -ForegroundColor $SuccessColor
    } else {
        Write-Host "⚠️  Erro ao gerar certificados. Continuando mesmo assim..." -ForegroundColor $WarningColor
    }
} else {
    Write-Host "✅ Certificados já existem" -ForegroundColor $SuccessColor
}

# Criar arquivo .env
Write-Host "Verificando arquivo .env..." -ForegroundColor $WarningColor
if (-not (Test-Path ".env")) {
    Write-Host "Criando arquivo .env..." -ForegroundColor $WarningColor
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Por favor, edite o arquivo .env com suas credenciais" -ForegroundColor $WarningColor
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor $SuccessColor
}

# Parar containers existentes
Write-Host "Parando containers existentes..." -ForegroundColor $WarningColor
docker-compose down 2>$null

# Build e start
Write-Host "Iniciando Docker Compose..." -ForegroundColor $WarningColor
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar Docker Compose" -ForegroundColor $ErrorColor
    exit 1
}

Write-Host ""
Write-Host "✅ FORTE MEDIA iniciado com sucesso!" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "📍 URLs de Acesso:" -ForegroundColor $WarningColor
Write-Host "   🌐 Frontend:  https://localhost" -ForegroundColor $SuccessColor
Write-Host "   🔌 Backend:   https://localhost/api" -ForegroundColor $SuccessColor
Write-Host "   🗄️  MySQL:     localhost:3306" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "📝 Credenciais MySQL:" -ForegroundColor $WarningColor
$dbUser = Get-Content .env | Select-String "DB_USER" | ForEach-Object { $_ -replace "DB_USER=" }
$dbName = Get-Content .env | Select-String "DB_NAME" | ForEach-Object { $_ -replace "DB_NAME=" }
Write-Host "   Usuário: $dbUser" -ForegroundColor $SuccessColor
Write-Host "   Banco:   $dbName" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "🛑 Para parar os containers:" -ForegroundColor $WarningColor
Write-Host "   docker-compose down" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "📋 Para ver logs:" -ForegroundColor $WarningColor
Write-Host "   docker-compose logs -f" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "🔄 Para reiniciar:" -ForegroundColor $WarningColor
Write-Host "   docker-compose restart" -ForegroundColor $SuccessColor
Write-Host ""
