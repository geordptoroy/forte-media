# Meta API Research - FORTE MEDIA v2

## Tipos de Access Tokens

### 1. User Access Token (Recomendado para Ad Library)
- **Duração:** Short-lived (~2 horas) ou Long-lived (~60 dias)
- **Uso:** Ações em tempo real baseadas em input do usuário
- **Permissões:** Requer consentimento do usuário via Facebook Login
- **Para Ad Library:** Necessário token de usuário com permissão `ads_read`
- **Conversão:** Tokens short-lived podem ser convertidos para long-lived via API call server-side

### 2. App Access Token
- **Duração:** Sem expiração (para Standard Access na Marketing API)
- **Uso:** Ações programáticas, não requer input do usuário
- **Geração:** Via App ID + App Secret (server-side only)
- **Segurança:** NUNCA deve ser hardcoded ou exposto no cliente

### 3. System User Access Token
- **Duração:** Sem expiração (para Standard Access)
- **Uso:** Ações programáticas automatizadas em objetos de Ad do cliente
- **Criação:** Via Business Manager > System Users
- **Vantagem:** Não requer re-autenticação do usuário

### 4. Page Access Token
- **Uso:** Gerenciar dados específicos de uma Página Facebook
- **Geração:** Obtido via User Access Token + Graph API call

---

## Meta Ad Library API

### Endpoint
```
GET https://graph.facebook.com/v19.0/ads_archive
```

### Permissões Necessárias
- `ads_read` - Para acessar Ads Archive (leitura de anúncios competitivos)
- `business_management` - Para acessar dados de negócio (opcional, para contexto)

### Parâmetros Principais
- `access_token` - User Access Token (long-lived recomendado)
- `search_terms` - Palavras-chave para buscar anúncios
- `ad_reached_countries` - Array de países (ex: ["BR", "US"])
- `ad_type` - Tipo de anúncio (POLITICAL, ISSUE_ADS, ALL)
- `limit` - Número de resultados (máx 100)
- `after` - Cursor para paginação

### Fields Disponíveis
- `id` - ID do anúncio
- `page_id` - ID da página que criou o anúncio
- `page_name` - Nome da página
- `ad_creative_bodies` - Texto do anúncio
- `ad_creative_link_captions` - Captions de links
- `ad_delivery_start_time` - Data de início
- `ad_delivery_stop_time` - Data de término
- `ad_snapshot_url` - URL da imagem/vídeo do anúncio
- `spend` - Gasto estimado
- `impressions` - Número de impressões
- `currency` - Moeda

---

## Meta Marketing API (Ads Insights)

### Endpoint
```
GET https://graph.facebook.com/v19.0/{ad_account_id}/insights
```

### Permissões Necessárias
- `ads_management` - Para gerenciar e ler dados de campanhas próprias
- `ads_read` - Para apenas ler dados de insights

### Métricas Disponíveis
- `spend` - Gasto total
- `impressions` - Número de impressões
- `clicks` - Número de cliques
- `ctr` - Click-through rate
- `cpc` - Custo por clique
- `cpm` - Custo por mil impressões
- `cpp` - Custo por resultado
- `actions` - Ações (conversões)
- `action_values` - Valor das ações
- `roas` - Return on Ad Spend

### Filtros de Tempo
- `time_range` - Período customizado
- `date_preset` - Presets (today, yesterday, this_week, etc)

---

## Business Verification

### Requisitos
1. **Verificação de Identidade:** Documento de identidade válido
2. **Verificação de Negócio:** Informações da empresa (CNPJ, endereço)
3. **Confirmação de Autoridade:** Comprovação de que você representa a empresa

### Status de Verificação
- **Não Verificado:** Acesso limitado às APIs
- **Verificado:** Acesso completo às APIs de anúncios
- **Rejeitado:** Necessário corrigir informações e tentar novamente

---

## Fluxo de Autenticação Recomendado para FORTE MEDIA

### 1. Login do Usuário (Manus OAuth)
- Usuário faz login via Manus OAuth
- Cria sessão segura no backend

### 2. Configuração de Credenciais Meta
- Usuário acessa tela de configurações
- Insere manualmente seu User Access Token (long-lived)
- Token é criptografado e armazenado no banco de dados

### 3. Validação de Token
- Backend valida token via Graph API call
- Verifica permissões (ads_read, ads_management)
- Armazena status de validação

### 4. Uso das APIs
- Ad Library: Busca anúncios competitivos (ads_read)
- Marketing API: Busca métricas de campanhas próprias (ads_management)

---

## Segurança - Armazenamento de Credenciais

### Criptografia
- Usar `crypto` do Node.js com AES-256-GCM
- Chave de criptografia armazenada em variável de ambiente
- IV (Initialization Vector) único por token

### Armazenamento
- Tabela `user_meta_credentials` com campos:
  - `user_id` - FK para users
  - `encrypted_access_token` - Token criptografado
  - `token_hash` - Hash SHA-256 do token (para validação)
  - `permissions` - JSON com permissões validadas
  - `is_valid` - Boolean indicando se token é válido
  - `last_validated_at` - Timestamp da última validação
  - `created_at` - Timestamp de criação
  - `updated_at` - Timestamp de atualização

### Operações
- Encriptar token antes de salvar
- Decriptar token apenas quando necessário (em memória)
- Nunca logar ou expor tokens
- Validar token regularmente (a cada 7 dias)

---

## Versão da API Recomendada

- **Ad Library API:** v19.0 ou superior
- **Marketing API:** v19.0 ou superior
- **Motivo:** Versões mais recentes com melhor suporte e segurança

---

## Próximos Passos

1. Implementar tabela de credenciais criptografadas no schema
2. Criar procedures para validar e armazenar tokens
3. Integrar endpoints da Meta Ad Library
4. Integrar endpoints da Meta Marketing API
5. Criar UI segura para inserção de tokens
