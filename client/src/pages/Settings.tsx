import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key,
  Shield,
  AlertCircle,
  CheckCircle,
  Trash2,
  Lock,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();
  const setCredentialsMutation = trpc.meta.setCredentials.useMutation();
  const deleteCredentialsMutation = trpc.meta.deleteCredentials.useMutation();

  const handleSetCredentials = async () => {
    if (!accessToken.trim()) {
      toast.error("Por favor, insira um Access Token válido");
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCredentialsMutation.mutateAsync({
        accessToken: accessToken.trim(),
      });

      if (result.success) {
        toast.success("Credenciais Meta configuradas com sucesso!");
        setAccessToken("");
        credentialsStatus.refetch();
      } else {
        toast.error(result.error || "Erro ao configurar credenciais");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao configurar credenciais"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (
      !confirm(
        "Tem certeza que deseja remover suas credenciais Meta? Você não poderá mais acessar dados de anúncios."
      )
    ) {
      return;
    }

    try {
      await deleteCredentialsMutation.mutateAsync();
      toast.success("Credenciais removidas com sucesso");
      credentialsStatus.refetch();
    } catch (error) {
      toast.error("Erro ao remover credenciais");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Configurações</h1>
          <p className="text-gray-500 font-medium">Gerencie sua conta e integrações com a Meta API.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Meta API Section */}
          <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Credenciais Meta API</h2>
                <p className="text-sm text-gray-500 mt-1">Conecte sua conta para acessar a Ad Library e Marketing APIs.</p>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`mb-8 p-4 rounded-2xl border ${credentialsStatus.data?.isValid ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="flex items-center gap-3">
                {credentialsStatus.data?.isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-bold text-green-500 uppercase tracking-wider">Conexão Ativa</p>
                      <p className="text-xs text-gray-400 mt-0.5">Suas credenciais estão configuradas e prontas para uso.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Ação Necessária</p>
                      <p className="text-xs text-gray-400 mt-0.5">Insira seu Access Token para habilitar as funcionalidades da plataforma.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Meta Access Token</label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="EAA..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="input-premium pr-12 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 flex items-center gap-1.5 mt-2">
                  <Lock className="w-3 h-3" />
                  Seu token é criptografado com AES-256-GCM e nunca é exposto.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  onClick={handleSetCredentials}
                  disabled={isLoading || !accessToken.trim()}
                  className="btn-premium px-8"
                >
                  {isLoading ? "Salvando..." : "Atualizar Token"}
                </Button>
                
                {credentialsStatus.data?.hasCredentials && (
                  <Button
                    onClick={handleDeleteCredentials}
                    variant="ghost"
                    className="text-red-500 hover:bg-red-500/10 text-xs font-bold uppercase tracking-widest"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover Acesso
                  </Button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-10 p-6 bg-white/[0.03] rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                Como obter o token?
              </h3>
              <ul className="text-xs space-y-3 text-gray-500 list-decimal list-inside leading-relaxed">
                <li>Acesse o <a href="https://developers.facebook.com" target="_blank" className="text-white hover:underline">Meta for Developers</a>.</li>
                <li>Vá em <strong>Ferramentas</strong> &gt; <strong>Explorador da Graph API</strong>.</li>
                <li>Selecione seu App e adicione as permissões: <code className="bg-white/5 px-1 rounded">ads_read</code>, <code className="bg-white/5 px-1 rounded">ads_management</code>.</li>
                <li>Gere o token e converta para <strong>Long-Lived Token</strong> (60 dias) nas configurações do App.</li>
              </ul>
            </div>
          </Card>

          {/* Security Banner */}
          <Card className="card-premium bg-white/[0.02] border-white/5 p-8 border-l-4 border-l-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Privacidade e Segurança</h3>
                <p className="text-sm text-gray-500 mt-1">
                  A FORTE MEDIA utiliza padrões bancários de segurança. Seus dados de conta e tokens nunca saem da nossa infraestrutura protegida.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
