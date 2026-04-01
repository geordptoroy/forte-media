# FORTE MEDIA - Docker Startup Script (Windows)
# -------------------------------------------

$ErrorActionPreference = "Stop"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$ErrorColor = "Red"

Write-Host "FORTE MEDIA - One-Command Startup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Verificar Docker
try {
    docker version > $null
    Write-Host "OK: Docker encontrado." -ForegroundColor $SuccessColor
} catch {
    Write-Host "ERRO: Docker nao encontrado ou nao esta rodando." -ForegroundColor $ErrorColor
    exit 1
}

# 2. Preparar Certificados
if (-not (Test-Path "nginx/certs")) {
    New-Item -ItemType Directory -Path "nginx/certs" -Force > $null
}

# 3. Preparar .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "OK: .env criado a partir do exemplo." -ForegroundColor $SuccessColor
    } else {
        "NODE_ENV=production`nPORT=3000" | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "AVISO: .env.example nao encontrado. Criado .env basico." -ForegroundColor $WarningColor
    }
}

# 4. Iniciar Docker Compose
Write-Host ">>> Iniciando containers (Build e Up)..." -ForegroundColor $WarningColor
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCESSO: A plataforma esta iniciando!" -ForegroundColor $SuccessColor
    Write-Host "Aguarde cerca de 1 minuto para que a base de dados e as migrations terminem." -ForegroundColor $WarningColor
    Write-Host "Acesse em: https://localhost" -ForegroundColor Cyan
} else {
    Write-Host "`nERRO: Falha ao iniciar o Docker Compose." -ForegroundColor $ErrorColor
    exit 1
}
