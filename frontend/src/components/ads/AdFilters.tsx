import React from 'react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';

interface AdFiltersProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

export const AdFilters: React.FC<AdFiltersProps> = ({ filters, onChange, onReset }) => (
  <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Input
        placeholder="Buscar por anunciante..."
        value={filters.search || ''}
        onChange={e => onChange('search', e.target.value)}
      />
      <Select
        value={filters.score_min || ''}
        onChange={e => onChange('score_min', e.target.value)}
        options={[
          { value: '', label: 'Score mínimo' },
          { value: '10', label: 'Score ≥ 10' },
          { value: '18', label: 'Score ≥ 18 (Escalado)' },
          { value: '25', label: 'Score ≥ 25 (Alto)' },
        ]}
      />
      <Select
        value={filters.media_type || ''}
        onChange={e => onChange('media_type', e.target.value)}
        options={[
          { value: '', label: 'Tipo de mídia' },
          { value: 'image', label: 'Imagem' },
          { value: 'video', label: 'Vídeo' },
          { value: 'carousel', label: 'Carrossel' },
        ]}
      />
      <Button variant="secondary" onClick={onReset}>Limpar filtros</Button>
    </div>
  </div>
);
