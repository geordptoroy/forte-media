import React, { useState } from 'react';
import { AdCard } from '@/components/ads/AdCard';
import { AdFilters } from '@/components/ads/AdFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ScaledAds() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  // Simular dados
  const mockAds = Array.from({ length: 12 }).map((_, i) => ({
    id: `ad-${i}`,
    page_name: `Anúncio ${i + 1}`,
    creative_url: `https://picsum.photos/seed/${i}/400/300`,
    score: Math.floor(Math.random() * 30) + 10,
    spend: Math.floor(Math.random() * 5000) + 100,
    impressions: Math.floor(Math.random() * 100000) + 10000,
    days_active: Math.floor(Math.random() * 30) + 1,
    media_type: ['image', 'video', 'carousel'][Math.floor(Math.random() * 3)],
  }));

  return (
    <div className="space-y-6">
      <AdFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-muted h-64 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>

          {mockAds && mockAds.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de 10
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === 10}
              >
                Próxima →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
