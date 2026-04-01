# FORTE MEDIA - Docker Startup Script for Windows PowerShell
# Usage: .\docker-start.ps1

Write-Host "FORTE MEDIA - Docker Startup Script (Windows)" -ForegroundColor Cyan
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
    Write-Host "OK: Docker encontrado: $dockerVersion" -ForegroundColor $SuccessColor
} catch {
    Write-Host "ERRO: Docker nao esta instalado ou nao esta no PATH" -ForegroundColor $ErrorColor
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "OK: Docker Compose encontrado: $composeVersion" -ForegroundColor $SuccessColor
} catch {
    Write-Host "ERRO: Docker Compose nao esta instalado ou nao esta no PATH" -ForegroundColor $ErrorColor
    exit 1
}

# Create certs directory
Write-Host "Verificando diretorio de certificados..." -ForegroundColor $WarningColor
if (-not (Test-Path "nginx/certs")) {
    New-Item -ItemType Directory -Path "nginx/certs" -Force | Out-Null
    Write-Host "OK: Diretorio criado" -ForegroundColor $SuccessColor
}

# Generate SSL certificates
Write-Host "Verificando certificados SSL..." -ForegroundColor $WarningColor
if (-not (Test-Path "nginx/certs/server.crt") -or -not (Test-Path "nginx/certs/server.key")) {
    Write-Host "Gerando certificados SSL autoassinados..." -ForegroundColor $WarningColor
    
    # Use OpenSSL in a single line to avoid line break issues in PowerShell
    $opensslCmd = 'openssl req -x509 -newkey rsa:4096 -keyout nginx/certs/server.key -out nginx/certs/server.crt -days 365 -nodes -subj "/C=BR/ST=SP/L=Sao Paulo/O=FORTE MEDIA/CN=localhost"'
    
    Invoke-Expression $opensslCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Certificados gerados com sucesso" -ForegroundColor $SuccessColor
    } else {
        Write-Host "AVISO: Erro ao gerar certificados. Verifique se o OpenSSL esta instalado." -ForegroundColor $WarningColor
    }
} else {
    Write-Host "OK: Certificados ja existem" -ForegroundColor $SuccessColor
}

# Create .env file
Write-Host "Verificando arquivo .env..." -ForegroundColor $WarningColor
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Criando arquivo .env a partir do exemplo..." -ForegroundColor $WarningColor
        Copy-Item ".env.example" ".env"
        Write-Host "AVISO: Por favor, edite o arquivo .env com suas credenciais" -ForegroundColor $WarningColor
    } else {
        Write-Host "AVISO: .env.example nao encontrado. Criando .env basico..." -ForegroundColor $WarningColor
        "NODE_ENV=production`nPORT=3000`nDATABASE_URL=mysql://forte_user:forte_password@db:3306/forte_media" | Out-File -FilePath ".env" -Encoding utf8
    }
} else {
    Write-Host "OK: Arquivo .env ja existe" -ForegroundColor $SuccessColor
}

# Stop existing containers
Write-Host "Parando containers existentes..." -ForegroundColor $WarningColor
docker-compose down 2>$null

# Build and start
Write-Host "Iniciando Docker Compose (Build e Up)..." -ForegroundColor $WarningColor
Write-Host "Dica: Se houver erro de imagem, verifique sua conexao com a internet." -ForegroundColor $WarningColor
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Erro ao iniciar Docker Compose. Tentando sem --build..." -ForegroundColor $WarningColor
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha critica ao iniciar Docker Compose." -ForegroundColor $ErrorColor
        exit 1
    }
}

# Wait for MySQL to be ready (step 1: ping via localhost inside db container)
Write-Host "Aguardando MySQL ficar pronto..." -ForegroundColor $WarningColor
$mysqlReady = $false
for ($i=1; $i -le 30; $i++) {
    $ping = docker-compose exec -T db mysqladmin ping -h localhost 2>$null
    if ($LASTEXITCODE -eq 0) {
        $mysqlReady = $true
        break
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 1
}

if (-not $mysqlReady) {
    Write-Host "`nERRO: MySQL nao ficou pronto a tempo" -ForegroundColor $ErrorColor
    exit 1
}

Write-Host "`nOK: MySQL esta aceitando pings" -ForegroundColor $SuccessColor

# Wait for MySQL to accept TCP connections from the backend container (step 2)
Write-Host "Aguardando MySQL aceitar conexoes TCP do backend..." -ForegroundColor $WarningColor
$tcpReady = $false
for ($i=1; $i -le 30; $i++) {
    $tcpCheck = docker-compose exec -T backend sh -c "nc -z db 3306" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $tcpReady = $true
        break
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 2
}

if (-not $tcpReady) {
    Write-Host "`nAVISO: Nao foi possivel confirmar conexao TCP. Aguardando mais 5 segundos..." -ForegroundColor $WarningColor
    Start-Sleep -Seconds 5
} else {
    Write-Host "`nOK: MySQL esta pronto para conexoes TCP" -ForegroundColor $SuccessColor
}

# Run database migrations
Write-Host "Executando migrations do banco de dados..." -ForegroundColor $WarningColor
docker-compose exec -T backend pnpm db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Migrations falharam. Tentando novamente em 5 segundos..." -ForegroundColor $WarningColor
    Start-Sleep -Seconds 5
    docker-compose exec -T backend pnpm db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "AVISO: Migrations ainda falharam. Verifique os logs com: docker-compose logs backend" -ForegroundColor $WarningColor
    } else {
        Write-Host "OK: Migrations executadas com sucesso (segunda tentativa)" -ForegroundColor $SuccessColor
    }
} else {
    Write-Host "OK: Migrations executadas com sucesso" -ForegroundColor $SuccessColor
}

Write-Host ""
Write-Host "FORTE MEDIA iniciado com sucesso!" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "URLs de Acesso:" -ForegroundColor $WarningColor
Write-Host "   Frontend:  https://localhost" -ForegroundColor $SuccessColor
Write-Host "   Backend:   https://localhost/api" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor $WarningColor
Write-Host "   - Parar:      docker-compose down" -ForegroundColor $SuccessColor
Write-Host "   - Logs:       docker-compose logs -f" -ForegroundColor $SuccessColor
Write-Host "   - Reiniciar:  docker-compose restart" -ForegroundColor $SuccessColor
Write-Host ""
