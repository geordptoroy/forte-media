import { useEffect, useRef, useState, useCallback } from "react";

interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Número de items fora da viewport para renderizar
}

interface VirtualizedListState {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
}

/**
 * Hook para virtualization de listas grandes
 * Renderiza apenas os items visíveis na viewport
 */
export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
): VirtualizedListState & { scrollProps: { onScroll: (e: any) => void; style: any } } {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [offsetY, setOffsetY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(offsetY / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleItems + overscan * 2);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setOffsetY(target.scrollTop);
  }, []);

  return {
    startIndex,
    endIndex,
    visibleItems,
    offsetY,
    scrollProps: {
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      },
    },
  };
}

/**
 * Hook para lazy loading de items
 */
export function useLazyLoad<T>(
  loadMore: () => Promise<T[]>,
  initialItems: T[] = []
) {
  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await loadMore();
      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load items"));
    } finally {
      setIsLoading(false);
    }
  }, [loadMore, isLoading, hasMore]);

  return { items, isLoading, hasMore, error, load };
}
