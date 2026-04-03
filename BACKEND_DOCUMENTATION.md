# 🚀 Documentação Técnica - Backend Forte Media

Este documento detalha a arquitetura, integração e funcionamento do backend do projeto Forte Media após a refatoração completa.

## 🏗️ Arquitetura Geral

O backend foi construído utilizando:
- **Node.js (v22)** com **Express**
- **tRPC** para comunicação Type-safe com o frontend
- **Drizzle ORM** para interação com o banco de dados MySQL 8.0
- **Docker** para orquestração de containers

## 📊 Integração Meta Ads Archive API

A principal funcionalidade do backend é a integração com a [API ads_archive da Meta](https://developers.facebook.com/docs/marketing-api/reference/ads-archive).

### Fluxo de Autenticação
1. O usuário fornece seu próprio **User Access Token** na interface.
2. O backend armazena este token de forma criptografada (AES-256-GCM) no banco de dados.
3. Todas as requisições subsequentes para a Meta utilizam este token.

### Campos Mapeados (Foco no Brasil)
Para anúncios comuns no Brasil, a API retorna campos essenciais que foram mapeados no nosso schema:
- `id`, `page_id`, `page_name`
- `ad_snapshot_url`
- `ad_delivery_start_time`, `ad_delivery_stop_time`
- `publisher_platforms` (facebook, instagram, messenger, etc.)
- `ad_creative_bodies`, `ad_creative_link_titles`, `ad_creative_link_descriptions`
- `currency`

*Nota: Campos como `spend` e `impressions` são retornados como ranges (mín/máx) apenas para anúncios políticos ou veiculados na UE/UK.*

## 🗄️ Banco de Dados (Schema)

O banco de dados foi refatorado para suportar dados complexos via JSON:
- **`users`**: Dados de autenticação local.
- **`user_meta_credentials`**: Tokens e IDs de conta Meta.
- **`favorite_ads`**: Armazena anúncios favoritados com todo o payload da Meta.
- **`monitored_ads`**: Gerencia o status de monitoramento e histórico de métricas.
- **`user_campaigns`**: Campanhas próprias do usuário sincronizadas via Marketing API.

## 📡 Routers tRPC

### `adsRouter`
- `searchByKeywords`: Busca anúncios por palavras-chave em países específicos.
- `searchByPages`: Busca anúncios de até 10 páginas específicas.
- `addFavorite` / `getFavorites`: Gestão de biblioteca pessoal.

### `monitoringRouter`
- `addMonitored`: Inicia o acompanhamento de um anúncio concorrente.
- `getMonitored`: Lista anúncios em monitoramento ativo.
- `updateStatus`: Pausa ou conclui monitoramentos.

### `campaignsRouter`
- `upsertCampaign`: Sincroniza dados de campanhas próprias.
- `getMetricsHistory`: Retorna a evolução de performance de uma campanha.

## 🐳 Docker e Estabilidade

O ambiente Docker foi otimizado para resiliência:
- **`entrypoint.sh`**: Script robusto que aguarda o MySQL estar 100% pronto antes de iniciar o Node.js.
- **Healthchecks**: Verificações automáticas via `curl` e `mysqladmin` para garantir que o Nginx só direcione tráfego quando os serviços estiverem saudáveis.
- **Porta 4000**: O backend roda fixo na porta 4000 para evitar conflitos comuns.

## 🛠️ Como Manter

### Adicionar novos campos da Meta
1. Atualize o `AdRecord` em `server/services/metaAdsService.ts`.
2. Adicione o campo no `drizzle/schema.ts`.
3. Rode `pnpm db:push` para atualizar o MySQL.

### Testar a conexão
O endpoint `/health` está disponível para verificar se o servidor está respondendo.
