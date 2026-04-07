# Plano de Refatoração - FORTE ADS

## Resumo das Mudanças

### 1. Sidebar / DashboardLayout.tsx
- Renomear seção "MINERADOR" para "FORTE ADS"
- Adicionar nova rota `/escalados` como primeiro item da seção (acima de Minerador)
- Manter Minerador como segundo item (unificado com Busca Avançada)
- Remover "Busca Avançada" da sidebar (foi unificada com Minerador)

### 2. Nova Página: Escalados (/escalados)
- Atualização automática às 00:00 com 50 anúncios campeões
- Filtros de período: Hoje, Semana, Mês, 3 Meses, 6 Meses, 9 Meses, +1 Ano
- Filtros de busca iguais ao Minerador (keywords, país, formato, plataforma, status)
- Cards de anúncios refatorados
- Dados salvos em localStorage com timestamp para cache diário

### 3. Minerador Unificado (Dashboard.tsx → /dashboard)
- Substituir botões de país por dropdown igual ao RegionSelector da Busca Avançada
- Incorporar painel de filtros avançados (colapsável) da Busca Avançada
- Filtros: País (dropdown), Keywords, Status (Ativo/Inativo/Todos), Formato (Image/Video/Carousel), Plataforma, Dias Ativos mínimo, Limite de resultados
- Score: manter 0+/40+/70+ mas tornar mais permissivo (mostrar todos os anúncios ordenados)
- Algoritmo: ordenar por score decrescente + leve aleatoriedade para diversidade

### 4. Correção do Score
- Problema: filtro 40+ e 70+ não mostra anúncios porque poucos atingem esses scores
- Solução: O filtro de score no frontend deve ser APENAS para ordenação/destaque visual
- Mostrar TODOS os anúncios sempre, mas ordenados por score (decrescente)
- Badges de score: 0+ = todos, 40+ = destaca moderados+escalados, 70+ = destaca apenas escalados
- Remover filtragem por score no frontend (apenas reordenar/destacar)

### 5. Refatoração do AdCard
- Remover: Gasto, Alcance, Moeda, País (dados raramente disponíveis para anúncios comuns)
- Manter: Nome da página, ID, Copy, Plataformas, Tipo de mídia, Datas, Score badge
- Adicionar: Dias ativos, Status (Ativo/Inativo)
- Thumbnail: Usar iframe do ad_snapshot_url com melhor fallback visual
- Criativo: Melhorar visualização com iframe mais robusto

### 6. Thumbnails/Criativos
- A Meta API NÃO fornece imagens para anúncios comuns (apenas políticos)
- Solução: Renderizar o ad_snapshot_url em um iframe no card
- Usar abordagem de "preview card" com iframe em modo sandbox
- Fallback: Mostrar placeholder com inicial da página + tipo de mídia
- No modal: Mostrar iframe em tamanho maior com botão para abrir na biblioteca

### 7. Backend - Novo Endpoint para Escalados
- Adicionar endpoint `meta.getTopScaledAds` que busca 50 anúncios com maior score
- Suportar filtros de período (adDeliveryDateMin)
- Cache no servidor por 24h (ou usar localStorage no cliente)

### 8. App.tsx
- Adicionar rota `/escalados` → `<Escalados />`
- Manter `/dashboard` → `<Dashboard />` (Minerador unificado)
- Remover `/search` (ou redirecionar para /dashboard)
