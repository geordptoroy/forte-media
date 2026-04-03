import { useState, useCallback, useEffect } from "react";

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: Error | null) => void;
  reset: () => void;
}

/**
 * Hook para gerenciar estado de loading com timeout automático
 * Previne estados de loading infinito
 */
export function useLoadingState(timeout: number = 30000): LoadingState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  // Auto-stop loading após timeout
  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
      setError(new Error("Request timeout"));
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError,
    reset,
  };
}
