# FORTE MEDIA v2 - Guia Técnico de Elite

**Plataforma de Inteligência Competitiva e Análise de Performance para Anúncios Meta**

---

## Visão Geral da Arquitetura

FORTE MEDIA v2 é uma aplicação profissional construída com:

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + Framer Motion + Lucide React
- **Backend:** Node.js + Express + tRPC + TypeScript
- **Banco de Dados:** MySQL/TiDB com Drizzle ORM
- **Autenticação:** Manus OAuth + JWT
- **Segurança:** AES-256-GCM para criptografia de tokens Meta

---

## Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/forte_media

# Autenticação
JWT_SECRET=seu-jwt-secret-muito-seguro-32-caracteres-minimo
ENCRYPTION_KEY=sua-chave-de-criptografia-32-caracteres

# Manus OAuth (fornecido pelo sistema)
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login

# Meta API (será preenchido pelo usuário na interface)
# Não armazene credenciais Meta aqui - use a interface de configurações
```

### 2. Instalação de Dependências

```bash
# Instalar dependências do projeto
pnpm install

# Gerar migrations do banco de dados
pnpm drizzle-kit generate

# Aplicar migrations (via UI do Manus)
# Ou manualmente via webdev_execute_sql
```

### 3. Iniciar Desenvolvimento

```bash
# Terminal 1: Backend
pnpm dev

# Terminal 2: Frontend (em outro diretório)
cd client && pnpm dev
```

---

## Guia Completo: Configuração da Meta API

### Passo 1: Criar um App no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Meus Apps"** → **"Criar App"**
3. Selecione **"Tipo de App"** → **"Negócio"**
4. Preencha os detalhes:
   - **Nome do App:** `FORTE MEDIA`
   - **Email de Contato:** seu-email@empresa.com
   - **Categoria:** Analytics ou Ferramentas de Marketing

### Passo 2: Adicionar Produtos ao App

1. No dashboard do app, clique em **"+ Adicionar Produto"**
2. Procure por **"Ad Library API"** e clique em **"Configurar"**
3. Procure por **"Marketing API"** e clique em **"Configurar"**

### Passo 3: Obter App ID e App Secret

1. Vá para **Configurações** → **Básico**
2. Copie:
   - **App ID** (exemplo: `123456789012345`)
   - **App Secret** (mantenha seguro!)

### Passo 4: Gerar Access Token de Longa Duração

#### Método 1: Via Graph API Explorer (Recomendado para Teste)

1. Acesse [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Selecione seu app no dropdown
3. Selecione **"Get User Access Token"**
4. Marque as permissões:
   - `ads_read` - Para acessar Ad Library
   - `ads_management` - Para acessar métricas de campanhas
   - `business_management` - Para acessar contas de negócio
5. Clique em **"Gerar Token de Acesso"**
6. Copie o token (será short-lived, ~2 horas)

#### Método 2: Converter para Long-Lived Token (Recomendado para Produção)

```bash
curl -X GET "https://graph.facebook.com/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=SEU_APP_ID" \
  -d "client_secret=SEU_APP_SECRET" \
  -d "fb_exchange_token=SHORT_LIVED_TOKEN"
```

Isso retornará um token válido por ~60 dias.

#### Método 3: System User Token (Melhor para Produção)

1. Acesse **Business Manager** → **Usuários do Sistema**
2. Clique em **"Adicionar"**
3. Preencha os detalhes do usuário
4. Clique em **"Gerar Token de Acesso"**
5. Selecione o app e as permissões necessárias
6. Copie o token (sem expiração)

### Passo 5: Configurar Credenciais no FORTE MEDIA

1. Faça login no FORTE MEDIA
2. Vá para **Configurações** → **Meta API**
3. Clique em **"Conectar Meta API"**
4. Cole seu **Access Token**
5. O sistema validará automaticamente as permissões
6. Se válido, as credenciais serão criptografadas e armazenadas

---

## Fluxo de Segurança de Credenciais

### Armazenamento Seguro

```
User Input (Access Token)
         ↓
    Validação (Meta API)
         ↓
    Criptografia (AES-256-GCM)
         ↓
    Banco de Dados (Encrypted)
         ↓
    Descriptografia (Em Memória)
         ↓
    Uso em Procedures tRPC
```

### Detalhes Técnicos

- **Algoritmo:** AES-256-GCM (Galois/Counter Mode)
- **IV:** 16 bytes aleatórios por token
- **Auth Tag:** Validação de integridade
- **Hash:** SHA-256 para validação rápida
- **Chave:** Armazenada em variável de ambiente

### Código de Referência

```typescript
// Criptografar
const encryptedToken = encryptToken(accessToken);
// Resultado: iv(32) + authTag(32) + encrypted(variável)

// Descriptografar
const decryptedToken = decryptToken(encryptedToken);
// Resultado: token original
```

---

## Procedures tRPC Disponíveis

### Autenticação

```typescript
// Obter usuário atual
trpc.auth.me.useQuery()

// Fazer logout
trpc.auth.logout.useMutation()
```

### Meta API - Credenciais

```typescript
// Armazenar credenciais Meta
trpc.meta.setCredentials.useMutation({
  accessToken: "seu-access-token"
})

// Obter status de credenciais
trpc.meta.getCredentialsStatus.useQuery()

// Invalidar credenciais
trpc.meta.invalidateCredentials.useMutation()

// Remover credenciais
trpc.meta.deleteCredentials.useMutation()
```

### Meta API - Ad Library

```typescript
// Buscar anúncios competitivos
trpc.meta.searchAds.useQuery({
  searchTerms: ["marketing", "digital"],
  countries: ["BR", "US"],
  adType: "ALL",
  limit: 50
})

// Buscar anúncios escalados (alto gasto)
trpc.meta.searchScaledAds.useQuery({
  countries: ["BR"],
  minSpend: 1000
})
```

### Meta API - Marketing (Performance)

```typescript
// Obter métricas de campanha
trpc.meta.getCampaignMetrics.useQuery({
  campaignId: "123456789",
  dateStart: "2026-01-01",
  dateStop: "2026-03-31"
})

// Obter métricas de conta
trpc.meta.getAdAccountMetrics.useQuery({
  adAccountId: "act_123456789",
  dateStart: "2026-01-01",
  dateStop: "2026-03-31"
})

// Listar campanhas
trpc.meta.listCampaigns.useQuery({
  adAccountId: "act_123456789"
})
```

---

## Estrutura do Banco de Dados

### Tabelas Principais

#### `users`
Usuários da plataforma (gerenciado por Manus OAuth)

#### `user_meta_credentials`
Armazenamento criptografado de tokens Meta por usuário
- `encryptedAccessToken` - Token criptografado
- `tokenHash` - Hash SHA-256 para validação
- `permissions` - Array de permissões validadas
- `isValid` - Status de validade do token

#### `favorite_ads`
Anúncios competitivos favoritados pelos usuários
- Metadados do anúncio (ID, página, texto, imagem)
- Métricas (gasto, impressões)
- Notas do usuário

#### `monitored_ads`
Monitoramento contínuo de anúncios competitivos
- Status de monitoramento (ativo, pausado, completo)
- Histórico de gasto e impressões
- Última verificação

#### `user_campaigns`
Campanhas do usuário para análise de performance
- Métricas agregadas (gasto, impressões, conversões)
- ROAS, CTR, CPC, CPM
- Última sincronização com Meta

#### `campaign_metrics_history`
Histórico de métricas para análise de tendências
- Snapshots diários/horários de performance
- Permite análise de tendências e comparações

---

## Boas Práticas de Produção

### 1. Rotação de Tokens

```typescript
// Validar tokens a cada 7 dias
const VALIDATION_INTERVAL = 7 * 24 * 60 * 60 * 1000;

if (Date.now() - lastValidatedAt > VALIDATION_INTERVAL) {
  const validation = await validateMetaToken(accessToken);
  if (!validation.valid) {
    await invalidateMetaCredentials(userId);
  }
}
```

### 2. Rate Limiting

Meta API tem limites de taxa. Implemente:

```typescript
// Máximo 200 requisições por hora
// Máximo 10 requisições por segundo
const RATE_LIMIT = {
  perSecond: 10,
  perHour: 200
};
```

### 3. Tratamento de Erros

```typescript
try {
  const result = await searchAdLibrary(token, params);
} catch (error) {
  if (error.message.includes("401")) {
    // Token expirou - invalidar
    await invalidateMetaCredentials(userId);
  } else if (error.message.includes("400")) {
    // Erro de validação - informar usuário
    throw new Error("Parâmetros inválidos");
  }
}
```

### 4. Logging e Monitoramento

```typescript
console.log("[Meta] Search ads", {
  userId,
  searchTerms,
  timestamp: new Date().toISOString(),
  resultCount: ads.length
});
```

---

## Troubleshooting

### Token Inválido

**Problema:** "Invalid access token"

**Solução:**
1. Verifique se o token está correto
2. Confirme que tem as permissões `ads_read` ou `ads_management`
3. Gere um novo token se expirou

### Permissões Insuficientes

**Problema:** "User does not have permission"

**Solução:**
1. Vá para **Configurações do App** → **Permissões**
2. Adicione as permissões necessárias
3. Gere um novo token com as permissões

### Limite de Taxa Excedido

**Problema:** "Rate limit exceeded"

**Solução:**
1. Implemente cache de resultados
2. Reduza a frequência de requisições
3. Use batch requests quando possível

---

## Deployment

### Variáveis de Ambiente Necessárias

```env
# Produção
NODE_ENV=production
DATABASE_URL=mysql://prod-user:prod-pass@prod-db:3306/forte_media
JWT_SECRET=seu-jwt-secret-muito-seguro-aleatorio
ENCRYPTION_KEY=sua-chave-de-criptografia-32-caracteres-aleatorio
VITE_APP_ID=seu-app-id-producao
```

### Build

```bash
pnpm build
pnpm start
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## Conformidade e Segurança

### LGPD (Lei Geral de Proteção de Dados)

- Tokens Meta são criptografados em repouso
- Usuários podem deletar suas credenciais a qualquer momento
- Dados de anúncios são armazenados apenas para análise
- Implementar política de retenção de dados

### Conformidade Meta

- Respeite os Termos de Serviço da Meta
- Não armazene dados de usuários finais
- Implemente rate limiting
- Monitore uso de API

---

## Suporte e Documentação

- **Meta for Developers:** https://developers.facebook.com/docs
- **Ad Library API:** https://developers.facebook.com/docs/ads-archive-api
- **Marketing API:** https://developers.facebook.com/docs/marketing-api
- **Manus Documentation:** https://manus.im/docs

---

## Licença

MIT

---

**Versão:** 2.0.0  
**Última Atualização:** Março 2026  
**Status:** Pronto para Produção
