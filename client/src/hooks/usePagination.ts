import { useState, useMemo } from "react";

/**
 * Hook centralizado de paginação para listas de itens.
 * Elimina duplicação de lógica entre ScaledAds e AdvancedSearch.
 */
export function usePagination<T>(items: T[], pageSize = 12) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  const paginatedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  // Resetar para página 1 quando os itens mudarem
  const reset = () => setPage(1);

  const goToNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goToPrev = () => setPage((p) => Math.max(1, p - 1));

  return {
    page,
    totalPages,
    paginatedItems,
    setPage,
    goToNext,
    goToPrev,
    reset,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
