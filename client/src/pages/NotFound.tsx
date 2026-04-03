import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center text-center p-8 max-w-md">
        {/* Logo */}
        <div className="w-10 h-10 bg-white rounded flex items-center justify-center mb-12">
          <span className="text-black font-bold text-xs">FM</span>
        </div>

        {/* Error Icon */}
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
          <AlertCircle className="h-10 w-10 text-gray-600" />
        </div>

        {/* Error Code */}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-2">
          Erro 404
        </p>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Pagina nao encontrada
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-10">
          A pagina que voce esta procurando nao existe ou foi movida.
          Verifique o endereco e tente novamente.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex-1 border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="flex-1 bg-white text-black hover:bg-gray-100 text-xs font-bold uppercase tracking-widest"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
