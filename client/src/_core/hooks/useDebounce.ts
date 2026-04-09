import { useEffect, useRef, useState } from "react";

/**
 * Hook para debounce de valores
 * Útil para busca em tempo real, validação de formulários, etc
 */
export function useDebounce<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook para throttle de callbacks
 * Útil para eventos que disparam frequentemente (scroll, resize, etc)
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 500
): T {
  const lastRun = useRef<number>(Date.now());

  return ((...args: any[]) => {
    const now = Date.now();

    if (now - lastRun.current >= delayMs) {
      callback(...args);
      lastRun.current = now;
    }
  }) as T;
}

/**
 * Hook para debounce de callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = (...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delayMs);
  };

  return debouncedCallback as T;
}
