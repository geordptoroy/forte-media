import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook para filtragem e agrupamento de anúncios no cliente
 * Sincronizado com a lógica do backend
 */

interface FilterState {
  searchTerms: string;
  country: string;
  selectedType: string;
  selectedFunnel: string;
  scaleMin: number;
  scaleMax: number;
  durationMin: number;
  durationMax: number;
  hidePolitical: boolean;
}

interface Ad {
  id: string;
  collationCount?: number;
  frequency?: number;
  daysActive?: number;
  detectedTypes?: string[];
  detectedFunnels?: string[];
  isNegative?: boolean;
  bylines?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  [key: string]: any;
}

/**
 * Normaliza texto para comparação
 */
function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-]/g, '');
}

/**
 * Gera chave única para criativo
 */
export function getCreativeKey(ad: Ad): string {
  const body = normalizeText(ad.ad_creative_bodies?.[0]);
  const title = normalizeText(ad.ad_creative_link_titles?.[0]);
  const desc = normalizeText(ad.ad_creative_link_descriptions?.[0]);
  return `${body}|${title}|${desc}`;
}

/**
 * Hook principal de filtragem
 */
export function useAdFiltering(ads: Ad[], filters: FilterState) {
  const { t } = useTranslation();

  // Filtrar por tipo de produto
  const filteredByType = useMemo(() => {
    if (filters.selectedType === 'all') return ads;
    return ads.filter((ad) => {
      const types = ad.detectedTypes || [];
      return types.some((type) => type === t(filters.selectedType));
    });
  }, [ads, filters.selectedType, t]);

  // Filtrar por funil
  const filteredByFunnel = useMemo(() => {
    if (filters.selectedFunnel === 'all') return filteredByType;
    return filteredByType.filter((ad) => {
      const funnels = ad.detectedFunnels || [];
      return funnels.includes(filters.selectedFunnel);
    });
  }, [filteredByType, filters.selectedFunnel]);

  // Filtrar por escala
  const filteredByScale = useMemo(() => {
    return filteredByFunnel.filter((ad) => {
      const count = ad.collationCount || ad.frequency || 1;
      return count <= filters.scaleMax;
    });
  }, [filteredByFunnel, filters.scaleMax]);

  // Filtrar por duração
  const filteredByDuration = useMemo(() => {
    return filteredByScale.filter((ad) => {
      const days = ad.daysActive || 0;
      return days <= filters.durationMax;
    });
  }, [filteredByScale, filters.durationMax]);

  // Filtrar por país (se aplicável)
  const filteredByCountry = useMemo(() => {
    if (filters.country === 'ALL') return filteredByDuration;
    // Filtro de país é aplicado no backend
    return filteredByDuration;
  }, [filteredByDuration, filters.country]);

  // Filtrar anúncios políticos
  const finalFiltered = useMemo(() => {
    if (!filters.hidePolitical) return filteredByCountry;
    return filteredByCountry.filter((ad) => !ad.bylines);
  }, [filteredByCountry, filters.hidePolitical]);

  return finalFiltered;
}

/**
 * Hook para agrupamento de criativos repetidos
 */
export function useAdGrouping(ads: Ad[]) {
  return useMemo(() => {
    const groups = new Map<string, Ad[]>();

    for (const ad of ads) {
      const key = getCreativeKey(ad);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(ad);
    }

    // Adicionar collationCount a cada anúncio
    const adsWithCount = ads.map((ad) => {
      const key = getCreativeKey(ad);
      const group = groups.get(key) || [ad];
      return {
        ...ad,
        collationCount: group.length,
      };
    });

    return adsWithCount;
  }, [ads]);
}

/**
 * Hook combinado: agrupa e depois filtra
 */
export function useFilteredAndGroupedAds(ads: Ad[], filters: FilterState) {
  const grouped = useAdGrouping(ads);
  const filtered = useAdFiltering(grouped, filters);
  return filtered;
}

/**
 * Hook para estatísticas de filtros
 */
export function useFilterStats(ads: Ad[], filters: FilterState) {
  return useMemo(() => {
    const filtered = useAdFiltering(ads, filters);

    const stats = {
      total: ads.length,
      filtered: filtered.length,
      byType: {} as Record<string, number>,
      byFunnel: {} as Record<string, number>,
      byScale: {
        low: 0,
        medium: 0,
        high: 0,
        viral: 0,
      },
    };

    // Contar por tipo
    ads.forEach((ad) => {
      const types = ad.detectedTypes || ['Outros'];
      types.forEach((type) => {
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });
    });

    // Contar por funil
    ads.forEach((ad) => {
      const funnels = ad.detectedFunnels || ['Indefinido'];
      funnels.forEach((funnel) => {
        stats.byFunnel[funnel] = (stats.byFunnel[funnel] || 0) + 1;
      });
    });

    // Contar por escala
    ads.forEach((ad) => {
      const count = ad.collationCount || ad.frequency || 1;
      if (count >= 40) stats.byScale.viral++;
      else if (count >= 20) stats.byScale.high++;
      else if (count >= 10) stats.byScale.medium++;
      else stats.byScale.low++;
    });

    return stats;
  }, [ads, filters]);
}

/**
 * Hook para validação de filtros
 */
export function useValidateFilters(filters: FilterState) {
  return useMemo(() => {
    const errors: string[] = [];

    if (filters.scaleMin > filters.scaleMax) {
      errors.push('Scale min cannot be greater than max');
    }

    if (filters.durationMin > filters.durationMax) {
      errors.push('Duration min cannot be greater than max');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [filters]);
}
