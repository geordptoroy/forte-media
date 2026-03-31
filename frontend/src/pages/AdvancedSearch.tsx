import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { AdCard } from '../components/ads/AdCard';
import { searchApi } from '../services/api';
import { useToast } from '../components/ui/toast';

export const AdvancedSearch: React.FC = () => {
  const [filters, setFilters] = useState({ keywords: '', media_type: '', score_min: '' });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await searchApi.search({ ...filters, page, limit: 12 });
      setResults(res);
    } catch (err) {
      toast('Erro ao buscar anúncios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    try {
      await searchApi.saveSearch(`Pesquisa ${new Date().toLocaleDateString()}`, filters);
      toast('Pesquisa salva com sucesso!');
    } catch (err) {
      toast('Erro ao salvar pesquisa', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-4">Critérios de Busca</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Input
              placeholder="Palavras-chave..."
              value={filters.keywords}
              onChange={e => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
            />
            <Select
              value={filters.media_type}
              onChange={e => setFilters(prev => ({ ...prev, media_type: e.target.value }))}
              options={[
                { value: '', label: 'Tipo de mídia' },
                { value: 'image', label: 'Imagem' },
                { value: 'video', label: 'Vídeo' },
                { value: 'carousel', label: 'Carrossel' },
              ]}
            />
            <Select
              value={filters.score_min}
              onChange={e => setFilters(prev => ({ ...prev, score_min: e.target.value }))}
              options={[
                { value: '', label: 'Score mínimo' },
                { value: '10', label: '≥ 10' },
                { value: '18', label: '≥ 18' },
                { value: '25', label: '≥ 25' },
              ]}
            />
            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="primary" className="flex-1" loading={loading}>Buscar</Button>
              <Button onClick={handleSaveSearch} variant="secondary">Salvar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.data?.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
          {results.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</Button>
              <span className="text-[#AAAAAA] text-sm">Página {page} de {results.total_pages}</span>
              <Button variant="secondary" onClick={() => setPage(p => Math.min(results.total_pages, p + 1))} disabled={page === results.total_pages}>Próxima →</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
