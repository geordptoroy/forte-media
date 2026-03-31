# FORTE MEDIA

Ferramenta de inteligência competitiva para buscar, analisar e monitorar anúncios na Biblioteca de Anúncios da Meta. O foco é identificar anúncios escalados (alto gasto e impressões) para que profissionais de marketing possam aprender com concorrentes.

## 🚀 Tecnologias

- **Frontend:** React 18+ (TypeScript), Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Recharts
- **Backend:** Node.js 20+, Express, TypeScript, PostgreSQL, JWT
- **Infraestrutura:** Docker, Docker Compose, Nginx (com HTTPS para desenvolvimento local)

## 📦 Configuração e Execução Local com Docker (Recomendado)

Esta configuração permite rodar a aplicação completa (frontend, backend, banco de dados e Nginx com HTTPS) em contêineres Docker, simulando um ambiente de produção.

### Pré-requisitos

- [Docker](https://www.docker.com/get-started) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.
- [OpenSSL](https://www.openssl.org/) (geralmente já vem com sistemas Linux/macOS, para Windows pode ser instalado via Git Bash ou WSL).

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/geordptoroy/forte-media.git
    cd forte-media
    ```

2.  **Gere os certificados SSL autoassinados:**
    Para que o Nginx possa servir a aplicação via HTTPS localmente, você precisará de certificados SSL. Execute o comando abaixo na raiz do projeto para gerá-los:
    ```bash
    mkdir -p nginx/certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/certs/server.key -out nginx/certs/server.crt -subj "/C=BR/ST=SP/L=SaoPaulo/O=ForteMedia/OU=Dev/CN=localhost"
    ```
    *Nota: Seu navegador exibirá um aviso de segurança sobre o certificado autoassinado. Você pode ignorá-lo e prosseguir para `https://localhost`.*

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto, copiando o `.env.example` e ajustando conforme necessário. Para o desenvolvimento local, as configurações padrão são suficientes.
    ```bash
    cp .env.example .env
    ```
    *Certifique-se de que `USE_MOCK=true` e `VITE_USE_MOCK=true` estejam definidos para usar os dados simulados.*

4.  **Inicie a aplicação com Docker Compose:**
    Na raiz do projeto, execute:
    ```bash
    docker-compose up --build
    ```
    Este comando irá construir as imagens Docker, criar os contêineres para `postgres`, `backend`, `frontend` e `nginx`, e iniciá-los.

5.  **Acesse a aplicação:**
    Abra seu navegador e acesse: `https://localhost`
    O Nginx irá rotear as requisições para o frontend e o backend, incluindo o `/api/`.

## 🧪 Modo Mock vs. Produção

A aplicação foi projetada para alternar facilmente entre o modo de desenvolvimento (com dados mock) e o modo de produção (com a API real da Meta e banco de dados real).

-   **Modo Mock (Desenvolvimento):**
    Defina `USE_MOCK=true` no `.env` do backend e `VITE_USE_MOCK=true` no `.env` do frontend. Neste modo, qualquer e-mail/senha funciona no login e os dados são simulados.

-   **Modo Produção (API Real):**
    Defina `USE_MOCK=false` no `.env` do backend e `VITE_USE_MOCK=false` no `.env` do frontend. Siga o guia abaixo para configurar suas credenciais reais.

### 🔑 Configurando a Meta API (Real)

Para usar dados reais da Biblioteca de Anúncios da Meta, siga estes passos:

1.  **Crie um App no Meta for Developers:**
    - Acesse [Meta for Developers](https://developers.facebook.com/).
    - Crie um novo App do tipo "Business" ou "Outro".
    - Em "Adicionar produtos ao seu app", selecione **Ad Library API**.

2.  **Obtenha as Credenciais:**
    - **App ID** e **App Secret**: Encontrados em *Configurações > Básico*.
    - **Access Token**: Use o [Graph API Explorer](https://developers.facebook.com/tools/explorer/) para gerar um token com a permissão `ads_read`. Recomenda-se converter para um **Token de Longa Duração** (60 dias).

3.  **Preencha o arquivo `.env`:**
    ```env
    USE_MOCK=false
    VITE_USE_MOCK=false
    META_API_KEY=seu_access_token_aqui
    META_APP_ID=seu_app_id_aqui
    META_APP_SECRET=seu_app_secret_aqui
    ```

4.  **Reinicie o Docker:**
    ```bash
    docker-compose down
    docker-compose up --build
    ```

## 🚀 Deploy em Produção

Para colocar o **FORTE MEDIA** em produção, você pode usar serviços de hospedagem modernos que suportam Docker e CI/CD. Abaixo estão sugestões para um deploy rápido:

### Frontend (Vercel, Netlify, Cloudflare Pages)

1.  **Conecte seu repositório GitHub** ao serviço de hospedagem (ex: Vercel).
2.  **Configurações de Build:**
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
3.  **Variáveis de Ambiente:** Defina `VITE_API_URL` para apontar para a URL do seu backend em produção (ex: `https://api.seusite.com/api`). Defina `VITE_USE_MOCK=false`.

### Backend e Banco de Dados (Render, Railway, Heroku, AWS ECS)

1.  **Conecte seu repositório GitHub** ao serviço de hospedagem (ex: Render).
2.  **Configurações de Build:**
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`
3.  **Variáveis de Ambiente:**
    *   `NODE_ENV=production`
    *   `PORT=3000` (ou a porta que o serviço de hospedagem expõe)
    *   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (conecte a um serviço de PostgreSQL gerenciado, como o próprio Render PostgreSQL, ElephantSQL, ou AWS RDS).
    *   `JWT_SECRET` (gere uma chave forte e segura).
    *   `USE_MOCK=false`
    *   `META_API_KEY`, `META_APP_ID`, `META_APP_SECRET` (suas credenciais da Meta API).
    *   `FRONTEND_URL` (a URL do seu frontend em produção, ex: `https://www.seusite.com`).

### Segurança e Conformidade (LGPD, Alta Performance)

Para um ambiente de produção com 
segurança e conformidade (LGPD, alta performance, etc.), considere:

-   **Firewall e WAF:** Utilize serviços de firewall e Web Application Firewall (WAF) fornecidos pela sua plataforma de cloud (AWS WAF, Cloudflare, etc.).
-   **Monitoramento e Logs:** Implemente um sistema robusto de monitoramento de logs e performance (Prometheus, Grafana, ELK Stack).
-   **Backup e Recuperação de Desastres:** Configure rotinas de backup automático para o banco de dados e planos de recuperação de desastres.
-   **Auditorias de Segurança:** Realize auditorias de segurança regulares e testes de penetração.
-   **Criptografia de Dados:** Garanta que todos os dados sensíveis sejam criptografados em trânsito (HTTPS) e em repouso (criptografia de disco/banco de dados).
-   **Gerenciamento de Segredos:** Utilize um serviço de gerenciamento de segredos (AWS Secrets Manager, HashiCorp Vault) para suas chaves de API e credenciais.
-   **Compliance LGPD:** Revise e implemente políticas de privacidade, termos de uso, e mecanismos para consentimento de dados, direito ao esquecimento, etc., conforme a LGPD e outras regulamentações aplicáveis.

## 📄 Licença

Este projeto é privado e confidencial.
