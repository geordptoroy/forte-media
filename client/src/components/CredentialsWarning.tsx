import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface CredentialsWarningProps {
  message?: string;
}

/**
 * Componente de aviso reutilizável para quando o utilizador nao tem credenciais Meta configuradas.
 * Elimina a duplicacao deste padrao em CompetitiveIntelligence, ScaledAds, Performance e Dashboard.
 */
export function CredentialsWarning({
  message = "Configure suas credenciais Meta para acessar todos os recursos desta pagina.",
}: CredentialsWarningProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="card-premium bg-yellow-500/5 border-yellow-500/20 p-6 flex items-start gap-4">
      <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-1">
          Credenciais Meta Necessarias
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">{message}</p>
        <Button
          variant="link"
          onClick={() => setLocation("/settings")}
          className="text-white hover:text-gray-300 text-xs font-bold uppercase tracking-widest p-0 h-auto mt-3"
        >
          Configurar agora
          <Settings className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
