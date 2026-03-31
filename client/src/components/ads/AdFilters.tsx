import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface AdFiltersProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

export const AdFilters: React.FC<AdFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => (
  <div className="border rounded-lg p-4 mb-6 space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Input
        placeholder="Buscar por anunciante..."
        value={filters.search || ''}
        onChange={(e) => onChange('search', e.target.value)}
      />
      <Select
        value={filters.score_min || ''}
        onValueChange={(value) => onChange('score_min', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Score mínimo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          <SelectItem value="10">Score ≥ 10</SelectItem>
          <SelectItem value="18">Score ≥ 18 (Escalado)</SelectItem>
          <SelectItem value="25">Score ≥ 25 (Alto)</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.media_type || ''}
        onValueChange={(value) => onChange('media_type', value)}
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
      <Button variant="secondary" onClick={onReset}>
        Limpar filtros
      </Button>
    </div>
  </div>
);
