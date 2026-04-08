# FORTE MEDIA - Especificação de Produção v3

**Versão:** 3.0 (Radical Refactor)  
**Data:** 07 de Abril de 2026  
**Status:** Reestruturação Completa - Foco em Performance e Simplicidade

---

## 1. Visão Geral da Arquitetura

O FORTE MEDIA v3 foi simplificado para ser uma ferramenta de inteligência competitiva de alta performance, focada exclusivamente na mineração e análise de anúncios escalados da Meta Ad Library. A arquitetura foi limpa para remover complexidades desnecessárias e focar em resultados rápidos.

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React + TypeScript | 19.x |
| **Backend** | Node.js + Express | 22.x |
| **Database** | MySQL/TiDB | 8.x |
| **ORM** | Drizzle ORM | Latest |
| **API** | tRPC | Latest |
| **Meta API** | Graph API | v21.0 |
| **Container** | Docker + Docker Compose | Latest |

---

## 2. Reestruturação Radical (v3)

### 2.1 Simplificação de Credenciais
Removida a necessidade de gerir múltiplas credenciais por utilizador na interface. O sistema agora utiliza uma configuração global via variáveis de ambiente no servidor.

**Variável Obrigatória:**
- `META_ACCESS_TOKEN` - User Access Token com permissão `ads_read`.

**Variáveis Removidas:**
- `META_APP_ID`, `META_APP_SECRET`, `META_AD_ACCOUNT_ID`.

### 2.2 Páginas e Funcionalidades
O projeto foi reduzido às suas funcionalidades core para garantir foco e facilidade de uso:

1.  **Escalados (Daily Champions):**
    *   Exibe os 50 anúncios com maior score de escala detectados nas últimas 24h.
    *   Atualização automática diariamente às 00:00.
    *   Filtro por país/região.
    *   Sem filtros avançados ou pesquisa (seleção puramente algorítmica).

2.  **Minerador (Creative Mining):**
    *   Busca livre por nichos e palavras-chave.
    *   Filtro de Score em tempo real (0+, 40+, 70+).
    *   Seleção de região.
    *   Removidos filtros avançados de mídia e período para simplificação.

3.  **Configurações:**
    *   Mantido apenas Perfil e Segurança.
    *   Removida toda a interface de integração Meta (agora via .env).

---

## 3. Algoritmo de Score v4 (Ajustado)

O algoritmo de validação de escala foi calibrado para ser mais realista e brando, refletindo melhor o comportamento do mercado atual.

### Critérios de Scoring

| Sinal | Peso | Descrição |
|-------|------|-----------|
| **Longevidade (60+ dias)** | 40 | Sinal mais forte de oferta validada e lucrativa. |
| **Longevidade (30+ dias)** | 25 | Consistência alta, provável escala em andamento. |
| **Status Ativo** | 15 | Anúncio ainda em veiculação ativa. |
| **Profissionalismo** | 15 | Criativo completo (Copy + Título + Descrição). |
| **Distribuição** | 15 | Veiculação em múltiplas plataformas (FB, IG, etc). |
| **Formato Vídeo** | 10 | Maior engajamento e potencial de escala. |

**Fator de Aleatoriedade:** Adicionada uma variação leve (0-5 pontos) para dar um aspecto mais natural aos scores exibidos.

---

## 4. Segurança e Performance

### 4.1 Segurança
- **Isolamento de Credenciais:** O Access Token nunca é exposto ao frontend ou armazenado no banco de dados por usuário. Ele reside apenas na memória do servidor via `.env`.
- **HTTPS:** Proxy reverso Nginx com SSL autoassinado para desenvolvimento seguro.

### 4.2 Performance
- **Caching:** Resultados da página "Escalados" são cacheados por 24 horas no `localStorage` para carregamento instantâneo.
- **tRPC:** Comunicação tipada e eficiente entre frontend e backend.
- **Framer Motion:** Animações fluidas e feedback visual de alta qualidade.

---

## 5. Instruções de Deploy

### 5.1 Configuração do .env
```bash
# .env
META_ACCESS_TOKEN=seu_token_aqui
JWT_SECRET=chave_secreta
ENCRYPTION_KEY=chave_32_chars
DB_USER=forte_user
DB_PASSWORD=forte_password
DB_NAME=forte_media
```

### 5.2 Execução
```bash
# Iniciar tudo
docker compose up -d --build

# Aceder
https://localhost
```

---

**Documento Preparado por:** Manus AI  
**Última Atualização:** 07 de Abril de 2026  
**Versão:** 3.0 - Radical Refactor Ready
