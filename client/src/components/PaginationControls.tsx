import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Componente de controles de paginação reutilizável.
 * Elimina a duplicação da lógica de paginação entre ScaledAds e AdvancedSearch.
 */
export function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-white/5">
      <Button
        variant="ghost"
        onClick={onPrev}
        disabled={!hasPrev}
        className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Anterior
      </Button>
      <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
        <span className="text-xs font-bold text-white">
          {page} / {totalPages}
        </span>
      </div>
      <Button
        variant="ghost"
        onClick={onNext}
        disabled={!hasNext}
        className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
      >
        Proxima
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
