import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook para filtragem leve de anúncios no cliente
 * O backend já fez o agrupamento e classificação pesada
 * Este hook apenas refina a exibição baseado em preferências do usuário
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
  creative_group_id?: string; // Vem do backend
  [key: string]: any;
}

/**
 * Hook principal de filtragem - apenas refinamento de UI
 * O backend já fez o agrupamento e filtragem pesada
 */
export function useAdFiltering(ads: Ad[], filters: FilterState) {
  const { t } = useTranslation();

  // Filtrar por tipo de produto (refinamento de UI)
  const filteredByType = useMemo(() => {
    if (filters.selectedType === 'all') return ads;
    return ads.filter((ad) => {
      const types = ad.detectedTypes || [];
      return types.some((type) => type === t(filters.selectedType));
    });
  }, [ads, filters.selectedType, t]);

  // Filtrar por funil (refinamento de UI)
  const filteredByFunnel = useMemo(() => {
    if (filters.selectedFunnel === 'all') return filteredByType;
    return filteredByType.filter((ad) => {
      const funnels = ad.detectedFunnels || [];
      return funnels.includes(filters.selectedFunnel);
    });
  }, [filteredByType, filters.selectedFunnel]);

  // Filtrar por escala (refinamento de UI)
  const filteredByScale = useMemo(() => {
    return filteredByFunnel.filter((ad) => {
      const count = ad.collationCount || ad.frequency || 1;
      return count <= filters.scaleMax;
    });
  }, [filteredByFunnel, filters.scaleMax]);

  // Filtrar por duração (refinamento de UI)
  const filteredByDuration = useMemo(() => {
    return filteredByScale.filter((ad) => {
      const days = ad.daysActive || 0;
      return days <= filters.durationMax;
    });
  }, [filteredByScale, filters.durationMax]);

  // Filtrar anúncios políticos (refinamento de UI)
  const finalFiltered = useMemo(() => {
    if (!filters.hidePolitical) return filteredByDuration;
    return filteredByDuration.filter((ad) => !ad.bylines);
  }, [filteredByDuration, filters.hidePolitical]);

  return finalFiltered;
}

/**
 * Hook para agrupar criativos por creative_group_id (vem do backend)
 * Apenas agrupa para exibição visual, o backend já fez o trabalho pesado
 */
export function useAdGrouping(ads: Ad[]) {
  return useMemo(() => {
    // Backend já fornece creative_group_id, apenas usamos para agrupar visualmente
    const groups = new Map<string, Ad[]>();

    for (const ad of ads) {
      const groupId = ad.creative_group_id || ad.id; // Fallback para ID se não tiver grupo
      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      groups.get(groupId)!.push(ad);
    }

    // Sincronizar collationCount com o tamanho do grupo (para UI)
    const adsWithCount = ads.map((ad) => {
      const groupId = ad.creative_group_id || ad.id;
      const group = groups.get(groupId) || [ad];
      return {
        ...ad,
        collationCount: group.length, // Sincronizar com tamanho do grupo
      };
    });

    return adsWithCount;
  }, [ads]);
}

/**
 * Hook combinado: agrupa e depois filtra
 * Operações leves, o backend já fez o trabalho pesado
 */
export function useFilteredAndGroupedAds(ads: Ad[], filters: FilterState) {
  const grouped = useAdGrouping(ads);
  const filtered = useAdFiltering(grouped, filters);
  return filtered;
}

/**
 * Hook para estatísticas de filtros
 * Apenas calcula estatísticas para exibição
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
