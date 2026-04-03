import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

/**
 * Componente de Skeleton Loading para melhor UX durante carregamento
 */
export function SkeletonLoader({
  count = 3,
  height = "h-12",
  width = "w-full",
  className = "",
}: SkeletonLoaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${width} ${height}`} />
      ))}
    </div>
  );
}

/**
 * Skeleton para cards em grid
 */
export function CardSkeletonLoader({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="w-full h-40" />
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para tabelas
 */
export function TableSkeletonLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-12 h-12" />
          <Skeleton className="flex-1 h-12" />
          <Skeleton className="w-24 h-12" />
        </div>
      ))}
    </div>
  );
}
