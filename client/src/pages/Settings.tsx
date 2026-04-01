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
  metaAppId: string;
  metaAppSecret: string;
  accessToken: string;
  adAccountId: string;
  accountName: string;
  isSystemUser: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<MetaCredentialForm>({
    metaAppId: "",
    metaAppSecret: "",
    accessToken: "",
    adAccountId: "",
    accountName: "",
    isSystemUser: false,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedForm, setExpandedForm] = useState(false);

  const credentialsQuery = trpc.meta.getCredentialsStatus.useQuery();
  const setCredentialsMutation = trpc.meta.setCredentials.useMutation();
  const deleteCredentialsMutation = trpc.meta.deleteCredentials.useMutation();

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.metaAppId.trim() || !credentials.accessToken.trim()) {
      toast.error("App ID e Access Token são obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCredentialsMutation.mutateAsync({
        metaAppId: credentials.metaAppId.trim(),
        metaAppSecret: credentials.metaAppSecret.trim() || undefined,
        accessToken: credentials.accessToken.trim(),
        adAccountId: credentials.adAccountId.trim() || undefined,
        accountName: credentials.accountName.trim() || undefined,
        isSystemUser: credentials.isSystemUser,
      });

      if (result.success) {
        toast.success(`Credenciais configuradas para ${result.accountName || credentials.adAccountId || "padrão"}`);
        setCredentials({
          metaAppId: "",
          metaAppSecret: "",
          accessToken: "",
          adAccountId: "",
          accountName: "",
          isSystemUser: false,
        });
        setExpandedForm(false);
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

  const handleDeleteCredentials = async (credentialId: number) => {
    if (!confirm("Tem certeza que deseja remover esta credencial?")) {
      return;
    }

    try {
      await deleteCredentialsMutation.mutateAsync({ credentialId });
      toast.success("Credencial removida com sucesso");
      credentialsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao remover credencial");
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
                  <h2 className="text-xl font-bold text-white">Adicionar Credencial Meta</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure uma nova aplicação Meta Developers e conta de anúncios.</p>
                </div>
              </div>

              <form onSubmit={handleSetCredentials} className="space-y-6">
                {/* App ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Meta App ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Seu App ID da Meta"
                    value={credentials.metaAppId}
                    onChange={(e) => setCredentials({ ...credentials, metaAppId: e.target.value })}
                    className="input-premium font-mono text-sm"
                    required
                  />
                  <p className="text-[10px] text-gray-600">
                    Encontre em{" "}
                    <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Meta Developers
                    </a>
                  </p>
                </div>

                {/* App Secret */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Meta App Secret <span className="text-gray-600">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="Seu App Secret"
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
                  <p className="text-[10px] text-gray-600">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Será criptografado com AES-256-GCM
                  </p>
                </div>

                {/* Access Token */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Access Token <span className="text-red-500">*</span>
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
                    . Requer: ads_read, ads_management
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

                {/* System User */}
                <div className="flex items-center space-x-3 p-4 bg-white/[0.03] rounded-xl border border-white/5">
                  <input
                    type="checkbox"
                    id="isSystemUser"
                    checked={credentials.isSystemUser}
                    onChange={(e) => setCredentials({ ...credentials, isSystemUser: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="isSystemUser" className="text-sm text-gray-300">
                    Usar System User (recomendado para produção)
                  </label>
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
                      Adicionar Credencial
                    </>
                  )}
                </Button>
              </form>

              {/* Instructions */}
              <div className="mt-10 p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-3 h-3" />
                  Guia de Configuração
                </h3>
                <ul className="text-xs space-y-3 text-gray-500 list-decimal list-inside leading-relaxed">
                  <li>Acesse <a href="https://developers.facebook.com" target="_blank" className="text-white hover:underline">Meta for Developers</a></li>
                  <li>Crie uma aplicação do tipo "Negócio"</li>
                  <li>Copie o App ID e App Secret das configurações</li>
                  <li>Gere um Access Token com permissões ads_read e ads_management</li>
                  <li>Converta para Long-Lived Token (60 dias) para produção</li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Credentials List */}
          <div>
            <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Credenciais Ativas</h3>
                  <p className="text-xs text-gray-500">{credentialsQuery.data?.credentials.length || 0} configurada(s)</p>
                </div>
              </div>

              <div className="space-y-3">
                {credentialsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                ) : credentialsQuery.data?.credentials.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma credencial configurada</p>
                  </div>
                ) : (
                  credentialsQuery.data?.credentials.map((cred) => (
                    <div key={cred.id} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-gray-300 truncate">{cred.metaAppId}</p>
                          {cred.accountName && <p className="text-sm text-gray-400 mt-1">{cred.accountName}</p>}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${cred.isValid ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                          {cred.isValid ? "✓ Válida" : "✗ Inválida"}
                        </div>
                      </div>

                      {cred.adAccountId && (
                        <p className="text-xs text-gray-600 font-mono mb-2">{cred.adAccountId}</p>
                      )}

                      <div className="flex flex-wrap gap-1 mb-3">
                        {cred.permissions.slice(0, 2).map((perm) => (
                          <span key={perm} className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-gray-400">
                            {perm}
                          </span>
                        ))}
                        {cred.permissions.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-gray-400">
                            +{cred.permissions.length - 2}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteCredentials(cred.id)}
                        className="w-full px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Security Banner */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8 border-l-4 border-l-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Privacidade e Segurança</h3>
              <p className="text-sm text-gray-500 mt-1">
                Todos os tokens e secrets são criptografados com AES-256-GCM. Seus dados nunca saem da nossa infraestrutura protegida.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
