# FORTE MEDIA

Ferramenta de inteligência competitiva para buscar, analisar e monitorar anúncios na Biblioteca de Anúncios da Meta. O foco é identificar anúncios escalados (alto gasto e impressões) para que profissionais de marketing possam aprender com concorrentes.

## 🚀 Tecnologias

- **Frontend:** React 18+ (TypeScript), Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Recharts
- **Backend:** Node.js 20+, Express, TypeScript, PostgreSQL, JWT
- **Infraestrutura:** Docker, Docker Compose, Nginx

## 📦 Como rodar localmente (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- PostgreSQL (ou usar o Docker para o banco)

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/forte-media.git
   cd forte-media
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Inicie o banco de dados (opcional, se usar Docker):
   ```bash
   docker-compose up -d postgres
   ```

4. Instale as dependências e inicie o Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. Instale as dependências e inicie o Frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🐳 Como rodar com Docker (Produção/Teste)

1. Certifique-se de ter o Docker e Docker Compose instalados.
2. Configure o `.env` na raiz do projeto.
3. Execute:
   ```bash
   docker-compose up --build
   ```
4. Acesse a aplicação em `http://localhost:8080`.

## 🧪 Modo Mock

A aplicação foi desenvolvida com um **Modo Mock** completo, permitindo testar todas as funcionalidades sem precisar de credenciais reais da Meta API ou de um banco de dados populado.

Para ativar o modo mock:
- No arquivo `.env` (ou `backend/.env` e `frontend/.env`), defina:
  - `USE_MOCK=true` (Backend)
  - `VITE_USE_MOCK=true` (Frontend)

No modo mock:
- Qualquer e-mail e senha funcionam no login.
- Os dados do dashboard, anúncios e relatórios são gerados aleatoriamente.
- Ações como favoritar e monitorar são simuladas com sucesso.

## 📄 Licença

Este projeto é privado e confidencial.
