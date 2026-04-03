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
  EyeOff,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface MetaCredentialForm {
  accessToken: string;
  adAccountId: string;
  accountName: string;
  metaAppId: string;
  metaAppSecret: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<MetaCredentialForm>({
    accessToken: "",
    adAccountId: "",
    accountName: "",
    metaAppId: "",
    metaAppSecret: "",
  });

  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const credentialsQuery = trpc.meta.getCredentialsStatus.useQuery();
  const setCredentialsMutation = trpc.meta.setCredentials.useMutation();
  const deleteCredentialsMutation = trpc.meta.deleteCredentials.useMutation();

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.accessToken.trim()) {
      toast.error("Access Token é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCredentialsMutation.mutateAsync({
        accessToken: credentials.accessToken.trim(),
        adAccountId: credentials.adAccountId.trim() || undefined,
        accountName: credentials.accountName.trim() || undefined,
        metaAppId: credentials.metaAppId.trim() || undefined,
        metaAppSecret: credentials.metaAppSecret.trim() || undefined,
      });

      if (result.success) {
        toast.success("Credenciais configuradas com sucesso");
        setCredentials({
          accessToken: "",
          adAccountId: "",
          accountName: "",
          metaAppId: "",
          metaAppSecret: "",
        });
        credentialsQuery.refetch();
      } else {
        toast.error(result.error || "Erro ao configurar credenciais");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao configurar credenciais");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!confirm("Tem certeza que deseja remover suas credenciais da Meta?")) {
      return;
    }

    try {
      await deleteCredentialsMutation.mutateAsync();
      toast.success("Credenciais removidas com sucesso");
      credentialsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao remover credenciais");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Configurações</h1>
          <p className="text-gray-500 font-medium">Gerencie suas credenciais da Meta Ads API e integrações.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Configurar Credenciais Meta</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure seu User Access Token e conta de anúncios.</p>
                </div>
              </div>

              <form onSubmit={handleSetCredentials} className="space-y-6">
                {/* Access Token */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    User Access Token <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="EAA..."
                      value={credentials.accessToken}
                      onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                      className="input-premium font-mono text-sm pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    Obtenha em{" "}
                    <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Graph API Explorer
                    </a>
                    . Requer permissão: ads_read
                  </p>
                </div>

                {/* Ad Account ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Ad Account ID <span className="text-gray-600">(opcional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="act_XXXXXXXXXX"
                    value={credentials.adAccountId}
                    onChange={(e) => setCredentials({ ...credentials, adAccountId: e.target.value })}
                    className="input-premium font-mono text-sm"
                  />
                  <p className="text-[10px] text-gray-600">Formato: act_XXXXXXXXXX. Deixe em branco para usar a conta padrão.</p>
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Nome da Conta <span className="text-gray-600">(opcional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Minha Conta de Anúncios"
                    value={credentials.accountName}
                    onChange={(e) => setCredentials({ ...credentials, accountName: e.target.value })}
                    className="input-premium text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Configurações Avançadas (Opcional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Meta App ID</label>
                      <Input
                        type="text"
                        placeholder="App ID"
                        value={credentials.metaAppId}
                        onChange={(e) => setCredentials({ ...credentials, metaAppId: e.target.value })}
                        className="input-premium font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Meta App Secret</label>
                      <div className="relative">
                        <Input
                          type={showSecret ? "text" : "password"}
                          placeholder="App Secret"
                          value={credentials.metaAppSecret}
                          onChange={(e) => setCredentials({ ...credentials, metaAppSecret: e.target.value })}
                          className="input-premium font-mono text-sm pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="btn-premium w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Status Section */}
          <div className="space-y-6">
            <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Status da Conexão</h3>
              
              {credentialsQuery.isLoading ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Verificando...</span>
                </div>
              ) : credentialsQuery.data?.hasCredentials ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Conectado</span>
                  </div>
                  <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Conta Ativa</p>
                    <p className="text-sm font-bold text-white truncate">
                      {credentialsQuery.data.accountName || "Conta Padrão"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleDeleteCredentials}
                    className="w-full h-10 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Remover Conexão
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Desconectado</span>
                </div>
              )}
            </Card>

            <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Segurança
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Seus tokens são criptografados com <strong>AES-256-GCM</strong> antes de serem salvos. Nunca compartilhamos suas credenciais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
