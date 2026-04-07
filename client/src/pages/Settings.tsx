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
  User,
  Smartphone,
  Globe,
  Database,
  RefreshCw,
  Mail,
  Save,
  ShieldCheck,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MetaCredentialForm {
  accessToken: string;
  adAccountId: string;
  accountName: string;
  metaAppId: string;
  metaAppSecret: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"meta" | "profile" | "security">("meta");
  
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
      toast.error("Access Token é obrigatório para integração");
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
        toast.success("Integração Meta configurada com sucesso!");
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
    if (!confirm("Tem certeza que deseja remover a integração com a Meta? Isso interromperá o rastreamento em tempo real.")) return;
    try {
      await deleteCredentialsMutation.mutateAsync();
      toast.success("Integração removida com sucesso");
      credentialsQuery.refetch();
    } catch {
      toast.error("Erro ao remover credenciais");
    }
  };

  const status = credentialsQuery.data;

  const tabs = [
    { id: "meta", label: "Integração Meta", icon: Zap },
    { id: "profile", label: "Meu Perfil", icon: User },
    { id: "security", label: "Segurança", icon: Lock },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <PageHeader
          title="Configurações"
          subtitle="Gerencie sua conta, integrações de API e preferências de segurança."
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs Navigation */}
          <aside className="lg:w-64 space-y-2 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id
                    ? "bg-white text-black shadow-xl"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "meta" && (
                <motion.div
                  key="meta"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Zap className="w-32 h-32 text-white" />
                    </div>

                    <div className="flex items-start gap-4 mb-10 relative z-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <Key className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Configurar Meta API</h2>
                        <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">
                          Integração essencial para Escala e Busca Avançada.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSetCredentials} className="space-y-8 relative z-10">
                      {/* Access Token */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          User Access Token <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            type={showToken ? "text" : "password"}
                            placeholder="EAAxxxxxxx..."
                            value={credentials.accessToken}
                            onChange={(e) => setCredentials((p) => ({ ...p, accessToken: e.target.value }))}
                            className="input-premium h-12 pr-12 font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                          >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                          <InfoIcon className="w-3 h-3" />
                          Obtenha em: <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Meta Graph Explorer</a>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ad Account ID</label>
                          <Input
                            placeholder="act_123456789"
                            value={credentials.adAccountId}
                            onChange={(e) => setCredentials((p) => ({ ...p, adAccountId: e.target.value }))}
                            className="input-premium h-12"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nome da Conta</label>
                          <Input
                            placeholder="Ex: Minha Empresa"
                            value={credentials.accountName}
                            onChange={(e) => setCredentials((p) => ({ ...p, accountName: e.target.value }))}
                            className="input-premium h-12"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Meta App ID</label>
                          <Input
                            placeholder="123456789"
                            value={credentials.metaAppId}
                            onChange={(e) => setCredentials((p) => ({ ...p, metaAppId: e.target.value }))}
                            className="input-premium h-12"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Meta App Secret</label>
                          <div className="relative">
                            <Input
                              type={showSecret ? "text" : "password"}
                              placeholder="App Secret"
                              value={credentials.metaAppSecret}
                              onChange={(e) => setCredentials((p) => ({ ...p, metaAppSecret: e.target.value }))}
                              className="input-premium h-12 pr-12"
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

                      <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={isLoading} className="btn-premium h-12 flex-1 text-[10px] font-black uppercase tracking-[0.2em]">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Integração</>}
                        </Button>
                        {status?.hasCredentials && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleDeleteCredentials}
                            disabled={deleteCredentialsMutation.isPending}
                            className="h-12 border-red-500/20 text-red-500 hover:bg-red-500/10 px-6 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </form>
                  </Card>

                  {/* Connection Status Card */}
                  {status?.hasCredentials && (
                    <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Status da Conexão</h3>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 p-5 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center gap-4">
                          <div className={cn("p-2 rounded-lg", status.isValid ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                            {status.isValid ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">API Status</p>
                            <p className={cn("text-sm font-black uppercase", status.isValid ? "text-green-500" : "text-red-500")}>
                              {status.isValid ? "Conectado" : "Erro de Autenticação"}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 p-5 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center gap-4">
                          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conta Vinculada</p>
                            <p className="text-sm font-black text-white truncate max-w-[150px]">
                              {status.accountName || "Não definida"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
                    <div className="flex items-start gap-4 mb-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Informações do Perfil</h2>
                        <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Gerencie seus dados pessoais.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nome Completo</label>
                          <Input value={user?.name || ""} disabled className="input-premium h-12 opacity-50 cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">E-mail</label>
                          <div className="relative">
                            <Input value={user?.email || ""} disabled className="input-premium h-12 pl-10 opacity-50 cursor-not-allowed" />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                          A alteração de e-mail requer abertura de ticket com o suporte técnico para garantir a segurança da sua conta.
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
                    <div className="flex items-start gap-4 mb-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Segurança da Conta</h2>
                        <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Proteja seu acesso e dados.</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Alterar Senha</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Senha Atual</label>
                            <Input type="password" placeholder="••••••••" className="input-premium h-12" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nova Senha</label>
                              <Input type="password" placeholder="••••••••" className="input-premium h-12" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirmar Nova Senha</label>
                              <Input type="password" placeholder="••••••••" className="input-premium h-12" />
                            </div>
                          </div>
                        </div>
                        <Button className="btn-premium h-12 px-8 text-[10px] font-black uppercase tracking-widest">Atualizar Senha</Button>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                          <div>
                            <h4 className="text-sm font-black text-red-500 mb-1">Encerrar Todas as Sessões</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Desconecta todos os dispositivos ativos agora.</p>
                          </div>
                          <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl">
                            Encerrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
