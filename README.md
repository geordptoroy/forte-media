# 🚀 FORTE MEDIA v2 - Intelligence & Performance Dashboard

Uma plataforma profissional de inteligência competitiva e análise de performance para anúncios do Meta (Facebook/Instagram), desenvolvida com a stack moderna de Manus (tRPC + Drizzle + React 19).

Este projeto foi otimizado para rodar exclusivamente via **Docker**, garantindo um ambiente isolado, seguro e de fácil implantação.

---

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

*   **Docker** (v20.10+)
*   **Docker Compose** (v2.0+)
*   **OpenSSL** (para geração de certificados HTTPS locais)
*   **Git**

---

## 🚀 Como Iniciar (Quick Start)

A maneira mais fácil de rodar o projeto é usando os scripts de inicialização automatizados que configuram certificados, ambiente e contêineres.

### No Windows (PowerShell)
```powershell
.\docker-start.ps1
```

### No Linux ou macOS (Terminal)
```bash
chmod +x docker-start.sh
./docker-start.sh
```

---

## 📁 Estrutura do Projeto (Docker)

O projeto é dividido em microserviços gerenciados pelo Docker:

| Serviço | Descrição | Porta Interna |
| :--- | :--- | :--- |
| **Nginx** | Proxy reverso com suporte a HTTPS e compressão Gzip. | 80 / 443 |
| **Frontend** | Aplicação React + Vite servida de forma otimizada. | 80 (via Nginx) |
| **Backend** | API Node.js (Express) compilada com esbuild. | 3000 |
| **MySQL** | Banco de dados relacional para persistência. | 3306 |

---

## ⚙️ Configuração de Ambiente (.env)

Após a primeira execução, um arquivo `.env` será criado na raiz. Você **deve** preencher as seguintes variáveis para o funcionamento das integrações:

```env
# Configurações da Meta API
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im

# Segurança
JWT_SECRET=uma_chave_secreta_longa
ENCRYPTION_KEY=chave_de_32_caracteres_exatos

# Banco de Dados (Docker)
DB_USER=forte_user
DB_PASSWORD=forte_password
DB_NAME=forte_media
```

---

## 🛠️ Comandos Úteis do Docker

Se preferir gerenciar os contêineres manualmente:

*   **Iniciar tudo:** `docker-compose up -d`
*   **Reconstruir imagens:** `docker-compose up -d --build`
*   **Parar serviços:** `docker-compose down`
*   **Ver logs em tempo real:** `docker-compose logs -f`
*   **Acessar terminal do backend:** `docker-compose exec backend sh`
*   **Rodar migrations manualmente:** `docker-compose exec backend pnpm db:push`

---

## 🔒 Segurança e HTTPS

O projeto utiliza **HTTPS por padrão** via Nginx. Os certificados autoassinados são gerados automaticamente na pasta `nginx/certs/`. 

> **Nota:** Ao acessar `https://localhost` pela primeira vez, seu navegador exibirá um aviso de "Conexão não segura" devido ao certificado ser autoassinado. Você pode clicar em "Avançado" e "Prosseguir" com segurança para o ambiente de desenvolvimento.

---

## 🧪 Testes

Para rodar a suíte de testes (53 testes passando):
```bash
docker-compose exec backend pnpm test
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Status:** ✅ Pronto para Produção | **Versão:** 2.0.0 | **Stack:** React 19 + tRPC + Drizzle
