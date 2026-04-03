import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

/**
 * Componente de estado vazio reutilizavel.
 * Elimina a duplicacao do padrao de "nenhum resultado" em todas as paginas.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
}: EmptyStateProps) {
  return (
    <Card className="card-premium bg-white/[0.01] border-white/5 p-20 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
        <Icon className="w-8 h-8 text-gray-700" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto mb-8">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          disabled={actionDisabled}
          className="btn-premium px-8"
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
