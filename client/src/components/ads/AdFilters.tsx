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
import { Search, TrendingUp, Layers, RotateCcw } from 'lucide-react';

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
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Advertiser Search */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
          <Search className="w-3 h-3" /> Anunciante
        </label>
        <Input
          placeholder="Ex: Nike, Apple..."
          value={filters.search || ''}
          onChange={(e) => onChange('search', e.target.value)}
          className="input-premium"
        />
      </div>

      {/* Score Range */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" /> Score Mínimo
        </label>
        <Select
          value={filters.score_min || ''}
          onValueChange={(value) => onChange('score_min', value)}
        >
          <SelectTrigger className="input-premium">
            <SelectValue placeholder="Todos os níveis" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10">
            <SelectItem value="">Todos os níveis</SelectItem>
            <SelectItem value="10">Score ≥ 10</SelectItem>
            <SelectItem value="18">Score ≥ 18 (Escala)</SelectItem>
            <SelectItem value="25">Score ≥ 25 (Elite)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Type */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-1.5">
          <Layers className="w-3 h-3" /> Tipo de Mídia
        </label>
        <Select
          value={filters.media_type || ''}
          onValueChange={(value) => onChange('media_type', value)}
        >
          <SelectTrigger className="input-premium">
            <SelectValue placeholder="Todos os formatos" />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10">
            <SelectItem value="">Todos os formatos</SelectItem>
            <SelectItem value="image">Imagem Estática</SelectItem>
            <SelectItem value="video">Vídeo / Motion</SelectItem>
            <SelectItem value="carousel">Carrossel / Multi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      <div className="flex items-end">
        <Button 
          variant="ghost" 
          onClick={onReset}
          className="w-full h-11 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  </div>
);
