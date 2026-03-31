# FORTE MEDIA v2 - Plataforma de Inteligência Competitiva para Anúncios Meta

Uma plataforma profissional de inteligência competitiva e análise de performance para anúncios do Meta (Facebook/Instagram), desenvolvida para profissionais de marketing digital e agências.

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

### Frontend
- **React 19** com TypeScript
- **Vite 7** como bundler
- **Tailwind CSS 4** para styling
- **Framer Motion** para animações
- **Lucide React** para ícones
- **Sonner** para notificações
- **Wouter** para roteamento

### Infraestrutura
- **Docker & Docker Compose** para containerização
- **Nginx** como reverse proxy com HTTPS
- **Certificados SSL autoassinados** para desenvolvimento

## 📋 Estrutura do Projeto

```
forte-media-v2/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── pages/              # Páginas principais (8 telas)
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── hooks/              # Custom hooks (useAuth, etc)
│   │   ├── lib/                # Utilitários (tRPC client)
│   │   ├── types/              # Tipos TypeScript
│   │   └── index.css           # Estilos globais
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Backend Node.js
│   ├── src/
│   │   ├── pages/              # Páginas do frontend
│   │   ├── crypto.ts           # Criptografia AES-256-GCM
│   │   ├── metaCredentials.ts  # Gerenciamento de credenciais
│   │   ├── metaAdLibrary.ts    # Integração Ad Library API
│   │   ├── metaMarketing.ts    # Integração Marketing API
│   │   ├── routers.ts          # Procedures tRPC
│   │   └── _core/              # Framework core (OAuth, context, etc)
│   ├── crypto.test.ts          # Testes de criptografia
│   ├── meta.routers.test.ts    # Testes de procedures tRPC
│   └── package.json
│
├── drizzle/                     # Schema do banco de dados
│   ├── schema.ts               # Definição de tabelas
│   └── migrations/             # Arquivos de migração SQL
│
├── docker-compose.yml          # Orquestração de contêineres
├── README.md                   # Este arquivo
├── README_SETUP.md             # Guia de configuração da Meta API
├── META_API_RESEARCH.md        # Pesquisa técnica da Meta API
└── todo.md                     # Rastreamento de tarefas
```

## 🚀 Guia de Instalação

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- Docker & Docker Compose (opcional, para containerização)
- MySQL/TiDB (ou use o container Docker)

### Instalação Local

1. **Clone o repositório:**
   ```bash
   git clone <repository-url>
   cd forte-media-v2
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   Edite `.env` com suas configurações (DATABASE_URL, JWT_SECRET, etc)

4. **Execute as migrations do banco de dados:**
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

6. **Acesse a aplicação:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000/api/trpc

### Instalação com Docker

1. **Certifique-se de ter Docker e Docker Compose instalados**

2. **Execute o Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Acesse a aplicação:**
   - Frontend: https://localhost
   - Backend: https://localhost/api/trpc

   **Nota:** O navegador pode mostrar aviso de certificado (SSL autoassinado). Clique em "Avançado" e "Prosseguir".

## 🔑 Configuração da Meta API

### Passo 1: Criar um App no Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com)
2. Clique em "Meus Apps" > "Criar App"
3. Selecione "Tipo de App" > "Negócio"
4. Preencha os detalhes do app
5. Adicione os produtos: **Ad Library API** e **Marketing API**

### Passo 2: Obter Credenciais

#### App ID e App Secret
1. Vá para "Configurações" > "Básico"
2. Copie o **App ID** e **App Secret**
3. Guarde em local seguro

#### Access Token (Desenvolvimento)
1. Vá para "Ferramentas" > "Graph API Explorer"
2. Selecione seu app no dropdown
3. Clique em "Gerar Token de Acesso"
4. Marque as permissões:
   - `ads_read` (para Ad Library API)
   - `ads_management` (para Marketing API)
   - `business_management` (para contas de negócio)
5. Copie o token gerado

#### Access Token (Produção - System User Token)
Para produção, recomendamos usar System User Tokens:
1. Vá para "Configurações" > "Usuários do Sistema"
2. Clique em "Adicionar"
3. Preencha os detalhes
4. Gere um token com as mesmas permissões acima
5. Este token tem validade de 60 dias

### Passo 3: Configurar no FORTE MEDIA

1. Faça login na plataforma
2. Vá para "Configurações" > "Credenciais Meta API"
3. Preencha:
   - **App ID:** Cole o App ID
   - **App Secret:** Cole o App Secret
   - **Access Token:** Cole o Access Token
4. Clique em "Salvar Credenciais"
5. Aguarde a validação (deve aparecer "Credenciais Ativas")

## 🧪 Testes

### Executar Testes Automatizados
```bash
pnpm test
```

### Testes Incluídos
- **crypto.test.ts:** Testes de criptografia AES-256-GCM
- **meta.routers.test.ts:** Testes de procedures tRPC
- **auth.logout.test.ts:** Testes de autenticação

## 📊 Páginas da Aplicação

### 1. **Login** (`/login`)
- Autenticação via Manus OAuth
- Design premium minimalista
- Logo profissional integrada

### 2. **Home** (`/`)
- Landing page com features
- Call-to-action para começar
- Informações sobre a plataforma

### 3. **Dashboard** (`/dashboard`)
- Visão geral da plataforma
- Quick actions
- Sidebar com navegação
- Status de credenciais

### 4. **Configurações** (`/settings`)
- Gerenciamento de credenciais Meta
- Campos: App ID, App Secret, Access Token
- Indicador de status
- Opção de remover credenciais
- Informações de segurança

### 5. **Inteligência Competitiva** (`/competitive-intelligence`)
- Busca de anúncios competitivos
- Filtros avançados
- Visualização de anúncios
- Opção de favoritar

### 6. **Performance** (`/performance`)
- Dashboard de métricas de campanhas
- Gráficos de performance
- Histórico de métricas
- Exportação de relatórios

### 7. **Favoritos** (`/favorites`)
- Lista de anúncios salvos
- Filtros e busca
- Gerenciamento de favoritos

### 8. **Monitoramento** (`/monitoring`)
- Alertas de anúncios competitivos
- Acompanhamento de mudanças
- Notificações em tempo real

## 🔐 Segurança

### Criptografia de Tokens
- **Algoritmo:** AES-256-GCM
- **IV:** Gerado aleatoriamente para cada token
- **Armazenamento:** Tokens criptografados no banco de dados
- **Acesso:** Apenas descriptografados quando necessário no backend

### Autenticação
- **OAuth:** Manus OAuth para autenticação de usuários
- **JWT:** Sessões seguras com JWT
- **HTTPS:** Obrigatório em produção

### Conformidade
- **LGPD:** Estrutura preparada para conformidade
- **Rate Limiting:** Implementado para proteção contra abuso
- **Validação:** Todas as entradas são validadas

## 📚 Documentação Adicional

- **README_SETUP.md** - Guia técnico detalhado de configuração
- **META_API_RESEARCH.md** - Pesquisa profunda sobre Meta APIs
- **todo.md** - Rastreamento de tarefas do projeto

## 🐛 Troubleshooting

### Erro: "Credenciais Inválidas"
- Verifique se o App ID, App Secret e Access Token estão corretos
- Confirme que as permissões estão marcadas no token
- Verifique se o token não expirou (60 dias)

### Erro: "Conexão Recusada"
- Certifique-se de que o backend está rodando
- Verifique se a porta 3000 (ou a configurada) está disponível
- Verifique os logs do servidor

### Erro: "Certificado SSL"
- Se usar Docker, é normal o aviso de certificado autoassinado
- Clique em "Avançado" e "Prosseguir" no navegador
- Para produção, configure certificados válidos

## 🚢 Deploy em Produção

### Variáveis de Ambiente Críticas
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:3306/forte_media
JWT_SECRET=seu-secret-muito-seguro-aqui
ENCRYPTION_KEY=sua-chave-de-criptografia-32-chars
VITE_APP_ID=seu-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
```

### Recomendações
1. Use certificados SSL válidos (Let's Encrypt)
2. Configure um banco de dados gerenciado (AWS RDS, Google Cloud SQL)
3. Implemente rate limiting
4. Configure backups automáticos
5. Monitore logs e performance
6. Use variáveis de ambiente seguras

## 📝 Licença

MIT

## 👥 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.

---

**Desenvolvido com ❤️ para profissionais de marketing digital**
