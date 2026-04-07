import { ReactNode } from "react";

interface PageHeaderProps {
  /** Título principal da página */
  title: ReactNode;
  /** Subtítulo ou descrição opcional */
  subtitle?: string;
  /** Elemento(s) de ação no lado direito (ex: botões) */
  actions?: ReactNode;
}

/**
 * Componente de cabeçalho de página reutilizável.
 * Elimina a duplicação do padrão título + subtítulo + ações em todas as páginas do dashboard.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-500 font-medium mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">{actions}</div>
      )}
    </div>
  );
}
