import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import DashboardLayout from "@/components/DashboardLayout";
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface MetaCredentialForm {
  accessToken: string;
  adAccountId: string;
  accountName: string;
  metaAppId: string;
  metaAppSecret: string;
}

export default function Settings() {
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
      toast.error("Access Token e obrigatorio");
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
        toast.error("Erro ao configurar credenciais");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao configurar credenciais");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!confirm("Tem certeza que deseja remover suas credenciais da Meta?")) return;
    try {
      await deleteCredentialsMutation.mutateAsync();
      toast.success("Credenciais removidas com sucesso");
      credentialsQuery.refetch();
    } catch {
      toast.error("Erro ao remover credenciais");
    }
  };

  const status = credentialsQuery.data;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <PageHeader
          title="Configuracoes"
          subtitle="Gerencie suas credenciais da Meta Ads API e integracoes."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Configurar Credenciais Meta</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure seu User Access Token e conta de anuncios.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSetCredentials} className="space-y-6">
                {/* Access Token */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    User Access Token *
                  </label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="EAAxxxxxxx..."
                      value={credentials.accessToken}
                      onChange={(e) =>
                        setCredentials((p) => ({ ...p, accessToken: e.target.value }))
                      }
                      className="input-premium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Obtenha em{" "}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:underline inline-flex items-center gap-1"
                    >
                      Meta Graph API Explorer
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>

                {/* Ad Account ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Ad Account ID
                  </label>
                  <Input
                    placeholder="act_123456789"
                    value={credentials.adAccountId}
                    onChange={(e) =>
                      setCredentials((p) => ({ ...p, adAccountId: e.target.value }))
                    }
                    className="input-premium"
                  />
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Nome da Conta
                  </label>
                  <Input
                    placeholder="Minha Empresa"
                    value={credentials.accountName}
                    onChange={(e) =>
                      setCredentials((p) => ({ ...p, accountName: e.target.value }))
                    }
                    className="input-premium"
                  />
                </div>

                {/* App ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Meta App ID
                  </label>
                  <Input
                    placeholder="123456789"
                    value={credentials.metaAppId}
                    onChange={(e) =>
                      setCredentials((p) => ({ ...p, metaAppId: e.target.value }))
                    }
                    className="input-premium"
                  />
                </div>

                {/* App Secret */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Meta App Secret
                  </label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder="App Secret"
                      value={credentials.metaAppSecret}
                      onChange={(e) =>
                        setCredentials((p) => ({ ...p, metaAppSecret: e.target.value }))
                      }
                      className="input-premium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="btn-premium flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Salvar Credenciais"
                    )}
                  </Button>
                  {status?.hasCredentials && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeleteCredentials}
                      disabled={deleteCredentialsMutation.isPending}
                      className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Status Atual */}
            <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                Status Atual
              </h3>
              {credentialsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verificando...</span>
                </div>
              ) : status?.hasCredentials ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-400 font-medium">Credenciais Ativas</span>
                  </div>
                  {status.accountName && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                        Conta
                      </p>
                      <p className="text-sm font-bold text-white">{status.accountName}</p>
                    </div>
                  )}
                  {status.permissions && status.permissions.length > 0 && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                        Permissoes
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {status.permissions.slice(0, 4).map((perm: string) => (
                          <span
                            key={perm}
                            className="text-[9px] font-bold px-2 py-0.5 bg-white/10 rounded-full text-gray-300"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-400">Nao configurado</span>
                </div>
              )}
            </Card>

            {/* Seguranca */}
            <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                  Seguranca
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  "Credenciais criptografadas com AES-256-GCM",
                  "Chave derivada por usuario com PBKDF2",
                  "Nunca armazenadas em texto simples",
                  "Conformidade com LGPD",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Lock className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-400">{item}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Conta */}
            <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                Conta
              </h3>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Nome</p>
                <p className="text-sm font-bold text-white">{user?.name || "—"}</p>
                <p className="text-xs text-gray-500 mt-3">E-mail</p>
                <p className="text-sm font-bold text-white">{user?.email || "—"}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
