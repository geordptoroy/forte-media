# FORTE MEDIA - Docker Setup para Windows

Guia completo para rodar FORTE MEDIA no Docker no Windows.

## 📋 Pré-requisitos

1. **Docker Desktop** - [Download aqui](https://www.docker.com/products/docker-desktop)
   - Instale e inicie o Docker Desktop
   - Verifique se está rodando clicando no ícone na bandeja

2. **Git** - [Download aqui](https://git-scm.com/download/win)
   - Instale com as opções padrão
   - Inclui Git Bash que será útil

3. **OpenSSL** (opcional, mas recomendado)
   - Geralmente já vem com Git
   - Se não tiver, instale via [Chocolatey](https://chocolatey.org/): `choco install openssl`

## 🚀 Instalação Rápida

### Opção 1: PowerShell (Recomendado)

```powershell
# 1. Clonar repositório
git clone https://github.com/geordptoroy/forte-media.git
cd forte-media

# 2. Executar script PowerShell
.\docker-start.ps1
```

### Opção 2: Git Bash

```bash
# 1. Abra Git Bash (clique direito na pasta e selecione "Git Bash Here")

# 2. Clonar repositório
git clone https://github.com/geordptoroy/forte-media.git
cd forte-media

# 3. Executar script bash
bash docker-start.sh
```

### Opção 3: Manual (Docker Compose)

```powershell
# 1. Clonar repositório
git clone https://github.com/geordptoroy/forte-media.git
cd forte-media

# 2. Criar diretório de certificados
mkdir nginx/certs

# 3. Gerar certificados SSL (em uma única linha)
openssl req -x509 -newkey rsa:4096 -keyout nginx/certs/server.key -out nginx/certs/server.crt -days 365 -nodes -subj "/C=BR/ST=SP/L=São Paulo/O=FORTE MEDIA/CN=localhost"

# 4. Copiar variáveis de ambiente
copy .env.example .env

# 5. Editar .env com suas credenciais (abra com Notepad)
notepad .env

# 6. Iniciar Docker
docker-compose up -d --build
```

## ⚙️ Configuração

### 1. Editar Variáveis de Ambiente

Abra o arquivo `.env` com seu editor favorito:

```powershell
notepad .env
```

Configure as seguintes variáveis:

```env
# Banco de Dados
DB_ROOT_PASSWORD=root-password
DB_NAME=forte_media
DB_USER=forte_user
DB_PASSWORD=forte_password

# Manus OAuth
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# JWT
JWT_SECRET=sua-chave-secreta-aqui

# Criptografia
ENCRYPTION_KEY=sua-chave-de-32-caracteres
```

### 2. Verificar Status

```powershell
# Ver containers rodando
docker ps

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 🌐 Acessar a Aplicação

Após iniciar, acesse:

- **Frontend:** https://localhost
  - ⚠️ Você verá um aviso de certificado SSL (é normal, clique em "Avançado" e "Prosseguir")
  
- **Backend API:** https://localhost/api

- **MySQL:** localhost:3306
  - Usuário: `forte_user`
  - Senha: `forte_password` (ou a que você configurou em `.env`)

## 🛑 Parar e Reiniciar

```powershell
# Parar containers
docker-compose down

# Parar e remover volumes (cuidado: apaga dados!)
docker-compose down -v

# Reiniciar
docker-compose restart

# Reiniciar um serviço específico
docker-compose restart backend
```

## 🐛 Troubleshooting

### Erro: "Docker daemon is not running"
- Inicie o Docker Desktop
- Aguarde até que o ícone na bandeja fique azul

### Erro: "Port 80 is already in use"
- Outro aplicativo está usando a porta 80
- Opções:
  - Feche o aplicativo concorrente
  - Ou mude a porta em `docker-compose.yml`

### Erro: "Cannot connect to MySQL"
- Aguarde o MySQL iniciar (pode levar 30 segundos)
- Verifique os logs: `docker-compose logs mysql`

### Certificado SSL inválido
- É normal em desenvolvimento
- Clique em "Avançado" e "Prosseguir para localhost"
- Para produção, use certificados válidos

### Containers não iniciam
- Verifique os logs: `docker-compose logs`
- Certifique-se de que o arquivo `.env` existe
- Verifique se os certificados foram gerados

## 📊 Monitorar Recursos

```powershell
# Ver uso de CPU, memória, etc
docker stats

# Ver detalhes de um container
docker inspect forte-media-backend
```

## 🔐 Segurança

- Os certificados SSL são autoassinados (apenas para desenvolvimento)
- Para produção, use certificados válidos de uma CA confiável
- Mude o `JWT_SECRET` e `ENCRYPTION_KEY` em produção
- Não commite o arquivo `.env` com credenciais reais

## 📚 Próximos Passos

1. Acesse https://localhost
2. Faça login com suas credenciais Manus
3. Vá para Configurações
4. Insira suas credenciais Meta API (App ID, App Secret, Access Token)
5. Comece a usar FORTE MEDIA!

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Leia a documentação completa em `README.md`
3. Abra uma issue no GitHub

---

**Versão:** 2.0.0 | **Data:** Mar 31, 2026
