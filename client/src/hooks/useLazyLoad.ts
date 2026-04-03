import { useEffect, useRef, useState } from "react";

/**
 * Hook para lazy loading de componentes e elementos
 * Carrega conteúdo apenas quando entra na viewport
 */
export function useLazyLoad<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}
