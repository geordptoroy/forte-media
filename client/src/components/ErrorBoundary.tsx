import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-black">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">
              Erro Inesperado
            </h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Ocorreu um erro inesperado na aplicação. Recarregue a página para tentar novamente.
            </p>
            <div className="p-4 w-full rounded-xl bg-white/5 border border-white/10 overflow-auto mb-6">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap break-all">
                {this.state.error?.message}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest",
                "bg-white text-black hover:bg-gray-100 transition-colors"
              )}
            >
              <RotateCcw size={16} />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
