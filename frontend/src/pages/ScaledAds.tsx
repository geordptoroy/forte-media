import React, { useState } from 'react';
import { AdCard } from '../components/ads/AdCard';
import { AdFilters } from '../components/ads/AdFilters';
import { Button } from '../components/ui/button';
import { useScaledAds } from '../hooks/useAds';

export const ScaledAds: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, isLoading } = useScaledAds({ page, limit: 12, ...filters });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <AdFilters filters={filters} onChange={handleFilterChange} onReset={handleReset} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.data?.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>

          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </Button>
              <span className="text-[#AAAAAA] text-sm">
                Página {page} de {data.total_pages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
              >
                Próxima →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
