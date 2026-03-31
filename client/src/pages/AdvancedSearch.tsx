import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdvancedSearch() {
  const [filters, setFilters] = useState({
    keywords: '',
    media_type: '',
    score_min: '',
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Simular busca
      console.log('Buscando com filtros:', { ...filters, page, limit: 12 });
      setResults({ data: [], total: 0 });
    } catch (err) {
      console.error('Erro ao buscar anúncios:', err);
      alert('Erro ao buscar anúncios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    try {
      console.log('Salvando pesquisa:', filters);
      alert('Pesquisa salva com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar pesquisa:', err);
      alert('Erro ao salvar pesquisa');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Busca Avançada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Palavras-chave</label>
              <Input
                placeholder="Palavras-chave..."
                value={filters.keywords}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keywords: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de mídia</label>
              <Select
                value={filters.media_type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, media_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de mídia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Score mínimo</label>
              <Select
                value={filters.score_min}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, score_min: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Score mínimo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="10">≥ 10</SelectItem>
                  <SelectItem value="18">≥ 18</SelectItem>
                  <SelectItem value="25">≥ 25</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button onClick={handleSaveSearch} variant="secondary">
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && results.data && results.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.data.map((ad: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{ad.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.data && results.data.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum resultado encontrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}
