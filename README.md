# FORTE MEDIA v2 - Intelligence & Performance Dashboard

Uma plataforma profissional de inteligência competitiva e análise de performance para anúncios do Meta (Facebook/Instagram), desenvolvida com a stack moderna de Manus (tRPC + Drizzle + React 19).

## 🎯 Funcionalidades Principais

### 🔐 Autenticação & Gerenciamento de Conta
- Autenticação via Manus OAuth
- Gerenciamento completo de perfil de usuário
- Logout seguro com limpeza de sessão
- Suporte a múltiplos usuários

### 🔑 Configuração de Credenciais Meta
- Interface segura para inserção de credenciais (App ID, App Secret, Access Token)
- Criptografia AES-256-GCM de tokens antes do armazenamento
- Validação de permissões (ads_read, ads_management, business_management)
- Indicador de status de credenciais (válidas/inválidas)
- Remoção segura de credenciais

### 🔍 Inteligência Competitiva
- **Busca de Anúncios:** Pesquisa anúncios competitivos via Meta Ad Library API
- **Anúncios Escalados:** Identifica anúncios com alto gasto e impressões
- **Filtros Avançados:** País, tipo de anúncio, período, gasto estimado
- **Favoritos:** Salve anúncios para análise posterior
- **Monitoramento:** Acompanhe mudanças em anúncios competitivos

### 📊 Dashboard de Performance
- Métricas de campanhas próprias (estilo UTMify)
- Visualização de gasto, lucro e ROAS
- Histórico de performance
- Integração com Meta Marketing API
- Exportação de relatórios

### 🔔 Notificações em Tempo Real
- Notificações via SSE (Server-Sent Events)
- Alertas de anúncios detectados
- Atualizações de campanhas
- Mudanças de métricas

### 🎨 Interface Minimalista Premium
- Design moderno e profissional com Tailwind CSS 4
- Animações suaves e responsivas
- Apenas ícones Lucide React (sem emojis)
- Logo profissional integrada
- Totalmente responsivo (mobile, tablet, desktop)

## 🛠️ Stack Tecnológico

### Backend
- **Node.js 22** + Express 4
- **TypeScript** para type-safety
- **tRPC 11** para RPC type-safe
- **Drizzle ORM** para gerenciamento de banco de dados
- **MySQL/TiDB** como banco de dados
- **Criptografia:** AES-256-GCM para tokens
- **Autenticação:** Manus OAuth + JWT
- **Notificações:** SSE (Server-Sent Events)

### Frontend
- **React 19** com Vite
- **TypeScript** para type-safety
- **Tailwind CSS 4** para styling
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **TanStack Query** para data fetching
- **Framer Motion** para animações
- **Wouter** para roteamento

### Banco de Dados
- **MySQL 8.0** / TiDB
- **Drizzle ORM** com migrations automáticas
- **6 tabelas:** users, user_meta_credentials, favorite_ads, monitored_ads, user_campaigns, campaign_metrics_history

## 📦 Instalação

### Pré-requisitos
- Node.js 22+
- pnpm (ou npm/yarn)
- MySQL 8.0+ ou TiDB

### Setup Local

```bash
# 1. Clonar repositório
git clone https://github.com/geordptoroy/forte-media.git
cd forte-media

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 4. Executar migrations
pnpm db:push

# 5. Iniciar servidor de desenvolvimento
pnpm dev
```

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Testes incluem:
# - Criptografia AES-256-GCM (6 testes)
# - Validação de routers (12 testes)
# - Procedures tRPC (19 testes)
# - Notificações (16 testes)
# Total: 53 testes passando
```

## 📚 Documentação

- **[META_API_RESEARCH.md](./META_API_RESEARCH.md)** - Pesquisa completa da Meta API
- **[README_SETUP.md](./README_SETUP.md)** - Guia técnico de elite
- **[todo.md](./todo.md)** - Status do projeto

## 🔐 Segurança

### Criptografia de Credenciais
- Tokens Meta são criptografados com **AES-256-GCM**
- IV (Initialization Vector) aleatório para cada token
- Autenticação de tag para validar integridade
- Tokens nunca são armazenados em plain text

### Autenticação
- Manus OAuth para login seguro
- JWT para sessões
- Proteção de rotas com `protectedProcedure`
- CORS configurado

## 🚀 Deploy

### Com Docker

```bash
# Gerar certificados SSL
openssl req -x509 -newkey rsa:4096 \
  -keyout nginx/certs/server.key \
  -out nginx/certs/server.crt \
  -days 365 -nodes

# Iniciar containers
docker-compose up -d
```

### URLs de Acesso
- **Frontend:** https://localhost
- **Backend API:** https://localhost/api
- **MySQL:** localhost:3306

## 📊 Estrutura do Projeto

```
forte-media-v2/
├── client/                 # Frontend React 19
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   └── index.html
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Procedures tRPC
│   ├── db.ts              # Query helpers
│   ├── crypto.ts          # Criptografia
│   ├── notifications.ts   # Gerenciador de notificações
│   └── _core/             # Framework core
├── drizzle/               # Schema e migrations
├── shared/                # Código compartilhado
├── storage/               # S3 helpers
├── nginx/                 # Configuração Nginx
├── docker-compose.yml     # Orquestração Docker
└── package.json
```

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👥 Autores

- **Rafael Tourinno** - Desenvolvimento inicial

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do email.

---

**Status:** ✅ Pronto para Produção | **Testes:** 53/53 passando | **Versão:** 2.0.0
