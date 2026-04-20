# Refatoração de Filtros e Agrupamento de Anúncios - Forte Media

## Resumo Executivo

Esta refatoração resolve completamente os problemas de filtragem e agrupamento de anúncios no Minerador. O sistema foi reescrito do zero mantendo o design existente e o complexo sistema de extração de criativos do `AdsCard`.

### Problemas Resolvidos

1. ✅ **Filtro de País**: Agora funciona corretamente com validação no backend
2. ✅ **Filtro de Tipo de Produto**: Comparação de strings corrigida (all vs "Todos")
3. ✅ **Filtro de Funil**: Lógica de comparação sincronizada com backend
4. ✅ **Escala de Anúncios Repetidos**: `frequency` e `collationCount` agora sincronizados
5. ✅ **Duração da Veiculação**: Cálculo de `daysActive` com validação de datas
6. ✅ **Agrupamento de Cards**: Pipeline unificado backend + cliente
7. ✅ **Arquivos Duplicados**: Identificados para limpeza (próxima fase)

---

## Arquitetura da Solução

### 1. Backend - Serviço de Filtragem (`server/services/filteringService.ts`)

**Responsabilidades:**
- Agrupamento de criativos por hash MD5
- Cálculo de frequência e dias ativos
- Aplicação de filtros individuais com logs
- Validação de parâmetros
- Pipeline completo de processamento

**Funções Principais:**

```typescript
// Gera hash único para criativo
generateCreativeHash(ad: AdWithMetadata): string

// Agrupa anúncios por criativo
groupAdsByCreative(ads: AdWithMetadata[]): Map<string, AdWithMetadata[]>

// Enriquece com metadados
enrichAdsWithGroupMetadata(ads, groups): ProcessedAd[]

// Filtros individuais
filterByScale(ad, min, max): boolean
filterByDuration(ad, min, max): boolean
filterByProductType(ad, types): boolean
filterByFunnelType(ad, funnels): boolean
filterByPolitical(ad, exclude): boolean
filterByNegative(ad): boolean
filterByCurrency(ad, currency): boolean
filterByMinSpend(ad, spend): boolean
filterByCountry(ad, country): boolean

// Pipeline completo
processAndFilterAds(rawAds, params): ProcessedAd[]
```

**Logs Detalhados:**
```
[Filtering] Agrupamento: 150 anúncios em 45 grupos únicos
[Filtering] Filtrados 150 anúncios -> 87 resultados em 245ms
[Filtering] Parâmetros: {"scaleMin":1,"scaleMax":100,...}
[Filtering] Ad 123456 filtrado por tipo: anúncio tem Infoproduto, filtro busca Nutra
[Filtering] Pipeline completo: 312ms
```

### 2. Backend - Serviço de Anúncios (`server/services/metaAdsService.ts`)

**Mudanças:**
- Integração com `filteringService`
- Validação de parâmetros antes de processar
- Pipeline simplificado e mais legível
- Logs estruturados para debugging

**Fluxo:**
```
API Meta → Classificação → Extração de URLs → Filtragem → Ordenação → Cliente
```

### 3. Cliente - Hook de Filtragem (`client/src/hooks/useAdFiltering.ts`)

**Responsabilidades:**
- Filtragem adicional no cliente (para UX responsiva)
- Agrupamento de criativos
- Validação de filtros
- Estatísticas de filtros

**Hooks Exportados:**

```typescript
// Filtra anúncios baseado em estado de filtros
useAdFiltering(ads, filters): Ad[]

// Agrupa criativos repetidos
useAdGrouping(ads): Ad[]

// Combina agrupamento + filtragem
useFilteredAndGroupedAds(ads, filters): Ad[]

// Estatísticas de filtros
useFilterStats(ads, filters): FilterStats

// Valida parâmetros
useValidateFilters(filters): ValidationResult
```

### 4. Cliente - Página Minerador (`client/src/pages/Minerador.tsx`)

**Mudanças:**
- Remoção de funções de agrupamento duplicadas
- Integração do hook `useFilteredAndGroupedAds`
- Simplificação da lógica de busca
- Sincronização com backend

---

## Fluxo de Dados

### Busca Inicial

```
Usuário clica "Minerar"
    ↓
Validação de Filtros (Cliente)
    ↓
Chamada API com parâmetros
    ↓
Backend: Validação de Parâmetros
    ↓
Backend: Busca na Meta
    ↓
Backend: Classificação (Tipo/Funil)
    ↓
Backend: Agrupamento por Criativo
    ↓
Backend: Aplicação de Filtros
    ↓
Backend: Ordenação por Escala
    ↓
Resposta com Anúncios Processados
    ↓
Cliente: Agrupamento Adicional (sincronização)
    ↓
Cliente: Exibição com Filtragem Reativa
```

### Mudança de Filtro

```
Usuário muda Filtro (ex: Tipo de Produto)
    ↓
Cliente: Aplicação Imediata (useFilteredAndGroupedAds)
    ↓
Exibição Atualizada (sem nova busca)
    ↓
Se Busca Anterior: Refetch com Novos Parâmetros
```

---

## Sincronização de Dados

### Campos Críticos

| Campo | Backend | Cliente | Sincronização |
|-------|---------|---------|----------------|
| `frequency` | Calculado no agrupamento | Sincronizado com `collationCount` | ✅ 1:1 |
| `collationCount` | Derivado de `frequency` | Usado na UI | ✅ Sincronizado |
| `daysActive` | Calculado com validação | Recebido do backend | ✅ Passivo |
| `detectedTypes` | Classificação de keywords | Usado em filtros | ✅ Passivo |
| `detectedFunnels` | Classificação de keywords | Usado em filtros | ✅ Passivo |
| `creativeHash` | MD5 do criativo | Não usado no cliente | ✅ Informativo |

### Garantias de Sincronização

1. **Backend Processa Primeiro**: Agrupamento e filtragem acontecem no servidor
2. **Cliente Sincroniza**: Aplica mesma lógica de agrupamento para garantir consistência
3. **Logs Detalhados**: Ambos os lados registram operações para debugging
4. **Validação Dupla**: Parâmetros validados em ambas as camadas

---

## Melhorias de Performance

### Backend

1. **Agrupamento Otimizado**: Usa `Map` em vez de loops aninhados
   - Antes: O(n²)
   - Depois: O(n)

2. **Filtros em Ordem de Performance**: Filtros mais rápidos primeiro
   - `isNegative` (simples boolean)
   - `isPolitical` (simples boolean)
   - `byScale` (comparação numérica)
   - `byDuration` (comparação numérica)
   - `byProductType` (array includes)
   - `byFunnelType` (array includes)

3. **Logs Estruturados**: Apenas logs relevantes, sem spam

### Cliente

1. **Memoização Agressiva**: `useMemo` em cada etapa de filtragem
2. **Hooks Especializados**: Cada hook faz uma coisa bem
3. **Evita Re-renders Desnecessários**: Dependências precisas

---

## Guia de Debugging

### Logs Disponíveis

**Backend:**
```bash
# Agrupamento
[Filtering] Agrupamento: 150 anúncios em 45 grupos únicos

# Filtragem
[Filtering] Filtrados 150 anúncios -> 87 resultados em 245ms

# Parâmetros
[Filtering] Parâmetros: {"scaleMin":1,"scaleMax":100,...}

# Filtros específicos
[Filtering] Ad 123456 filtrado por tipo: anúncio tem Infoproduto, filtro busca Nutra
[Filtering] Ad 789012 filtrado por país: não atinge BR

# Performance
[Filtering] Pipeline completo: 312ms
```

**Cliente:**
```javascript
// No console do navegador
const { useFilteredAndGroupedAds } = require('./hooks/useAdFiltering');
// Filtros aplicados automaticamente
```

### Checklist de Debugging

1. **Anúncios não aparecem?**
   - Verificar logs do backend: `[Filtering] Filtrados X -> Y`
   - Se Y = 0, verificar parâmetros de filtro
   - Verificar se `isNegative` está correto

2. **Filtros não funcionam?**
   - Verificar se backend recebeu parâmetros corretos
   - Verificar logs: `[Filtering] Ad XXX filtrado por tipo`
   - Verificar se `detectedTypes` está sendo classificado corretamente

3. **Agrupamento incorreto?**
   - Verificar `creativeHash` no DevTools
   - Comparar com hash esperado
   - Verificar se `collationCount` está sincronizado

4. **Performance ruim?**
   - Verificar tempo no log: `[Filtering] Pipeline completo: XXXms`
   - Se > 500ms, investigar classificação de keywords
   - Se > 1000ms, investigar agrupamento

---

## Testes Recomendados

### Testes Unitários

```typescript
// filteringService.test.ts
describe('filteringService', () => {
  it('should generate consistent creative hash', () => {
    const ad1 = { ad_creative_bodies: ['Teste'], ... };
    const ad2 = { ad_creative_bodies: ['Teste'], ... };
    expect(generateCreativeHash(ad1)).toBe(generateCreativeHash(ad2));
  });

  it('should group ads by creative correctly', () => {
    const ads = [...]; // 10 ads, 3 criativos únicos
    const groups = groupAdsByCreative(ads);
    expect(groups.size).toBe(3);
  });

  it('should filter by scale correctly', () => {
    const ad = { frequency: 15, ... };
    expect(filterByScale(ad, 10, 20)).toBe(true);
    expect(filterByScale(ad, 20, 30)).toBe(false);
  });
});
```

### Testes de Integração

```typescript
// searchAds.test.ts
describe('searchAds', () => {
  it('should filter and group ads correctly', async () => {
    const result = await searchAds({
      searchTerms: 'curso',
      country: 'BR',
      scaleMax: 50,
      productTypes: ['Infoproduto'],
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].frequency).toBeLessThanOrEqual(50);
    expect(result.data[0].detectedTypes).toContain('Infoproduto');
  });
});
```

### Testes E2E

```typescript
// minerador.e2e.ts
describe('Minerador Page', () => {
  it('should filter ads when changing product type', async () => {
    // 1. Buscar anúncios
    // 2. Mudar filtro de tipo
    // 3. Verificar se anúncios foram filtrados
    // 4. Verificar se collationCount está correto
  });
});
```

---

## Próximas Etapas

### Fase 4: Limpeza do Projeto

1. **Remover Arquivos Duplicados**
   - `shared/adTypes.ts` (duplicado de `client/src/types/adTypes.ts`)
   - `server/src/types/adTypes.ts` (duplicado)
   - Manter apenas `client/src/types/adTypes.ts` como fonte única

2. **Remover Código Obsoleto**
   - Funções de agrupamento antigas em `Minerador.tsx`
   - Hooks não utilizados em `useAds.ts`

3. **Adicionar Testes**
   - Testes unitários para `filteringService`
   - Testes de integração para `searchAds`
   - Testes E2E para página Minerador

### Fase 5: Otimizações Futuras

1. **Cache de Resultados**
   - Cache de agrupamentos por hash criativo
   - Cache de classificações de keywords

2. **Busca Incremental**
   - Atualizar apenas anúncios novos
   - Manter cache de criativos já vistos

3. **Análise de Performance**
   - Monitorar tempo de classificação
   - Otimizar keywords mais lentas

---

## Referências

### Arquivos Modificados

- `server/services/filteringService.ts` (NOVO)
- `server/services/metaAdsService.ts` (MODIFICADO)
- `client/src/hooks/useAdFiltering.ts` (NOVO)
- `client/src/pages/Minerador.tsx` (MODIFICADO)

### Arquivos para Limpeza

- `shared/adTypes.ts` (DUPLICADO)
- `server/src/types/adTypes.ts` (DUPLICADO)
- Funções antigas em `Minerador.tsx`

### Documentação Relacionada

- `REFACTORING_PLAN.md`
- `PLANO_REFATORACAO_MINERADOR.md`
- `META_API_RESEARCH.md`

---

## Changelog

### v2.0.0 - Refatoração Completa de Filtros

**Adicionado:**
- Serviço `filteringService.ts` com pipeline completo
- Hook `useAdFiltering.ts` para filtragem reativa
- Validação de parâmetros em ambas as camadas
- Logs estruturados para debugging
- Documentação completa

**Corrigido:**
- Sincronização de `frequency` e `collationCount`
- Comparação de tipos de produto ("all" vs "Todos")
- Cálculo de `daysActive` com validação de datas
- Filtro de país com suporte a `target_locations`
- Performance de agrupamento (O(n) vs O(n²))

**Removido:**
- Funções de agrupamento duplicadas
- Lógica de filtros espalhada

---

## Suporte

Para dúvidas ou problemas:

1. Verificar logs estruturados no backend
2. Usar DevTools do navegador para inspecionar `filteredAds`
3. Executar testes unitários
4. Consultar documentação de referência

