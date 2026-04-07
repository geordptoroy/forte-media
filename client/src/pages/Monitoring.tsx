import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Eye,
  Plus,
  Trash2,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCw,
  X,
  Activity,
  CheckCircle,
  PauseCircle,
  Target,
  Search,
  ExternalLink,
  Zap,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Monitoring() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdId, setNewAdId] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [newPageName, setNewPageName] = useState("");

  const monitoredQuery = trpc.monitoring.getMonitored.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const addMonitoredMutation = trpc.monitoring.addMonitored.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Monitoramento iniciado com sucesso");
        setNewAdId("");
        setNewPageId("");
        setNewPageName("");
        setShowAddForm(false);
        monitoredQuery.refetch();
      } else {
        toast.error(data.error || "Erro ao adicionar monitoramento");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar monitoramento");
    },
  });

  const removeMonitoredMutation = trpc.monitoring.removeMonitored.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Monitoramento removido");
        monitoredQuery.refetch();
      } else {
        toast.error(data.error || "Erro ao remover monitoramento");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover monitoramento");
    },
  });

  const handleAddMonitoring = () => {
    if (!newAdId.trim() || !newPageId.trim()) {
      toast.error("Preencha os campos obrigatórios (Ad ID e Page ID)");
      return;
    }
    addMonitoredMutation.mutate({
      adId: newAdId.trim(),
      pageId: newPageId.trim(),
      pageName: newPageName.trim() || undefined,
    });
  };

  const handleRemoveMonitoring = (adId: string) => {
    if (confirm("Deseja parar de monitorar este anúncio?")) {
      removeMonitoredMutation.mutate({ adId });
    }
  };

  const monitoredAds = monitoredQuery.data?.monitored || [];
  const activeCount = monitoredAds.filter((m) => m.monitoringStatus === "active").length;
  const stillActiveCount = monitoredAds.filter((m) => m.isStillActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <PageHeader
            title="Meus Anúncios (Tracking)"
            subtitle="Rastreamento em tempo real dos seus próprios anúncios e concorrentes diretos."
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => monitoredQuery.refetch()}
              disabled={monitoredQuery.isFetching}
              className="border-white/10 hover:bg-white/5 h-11 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", monitoredQuery.isFetching && "animate-spin")} />
              Atualizar Status
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className={cn(
                "h-11 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                showAddForm ? "bg-red-500 text-white" : "btn-premium"
              )}
            >
              {showAddForm ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tracking
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Banner Style Utmify */}
        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Módulo de Rastreamento Ativo</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
              Diferente da Dashboard de Escala, aqui você monitora anúncios específicos inserindo o ID deles. 
              O sistema verificará a cada 1 hora se o anúncio ainda está ativo na Meta Ad Library e notificará sobre mudanças de status.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Eye, label: "Total Monitorados", value: monitoredAds.length, color: "text-gray-400" },
            { icon: Activity, label: "Em Monitoramento", value: activeCount, color: "text-blue-500" },
            { icon: ShieldCheck, label: "Ainda no Ar", value: stillActiveCount, color: "text-green-500" },
            { icon: AlertCircle, label: "Pausados/Inativos", value: monitoredAds.length - stillActiveCount, color: "text-red-500" },
          ].map((stat, i) => (
            <Card key={i} className="card-premium bg-white/[0.02] border-white/5 p-6 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                </div>
                <div className={cn("p-2 rounded-lg bg-white/5 border border-white/10", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Form with Animation */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="card-premium bg-white/[0.02] border-white/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Target className="w-32 h-32 text-white" />
                </div>
                
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-8 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Configurar Novo Tracking
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Ad ID (Meta) *</label>
                    <Input
                      placeholder="Ex: 123456789012345"
                      value={newAdId}
                      onChange={(e) => setNewAdId(e.target.value)}
                      className="input-premium h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Page ID *</label>
                    <Input
                      placeholder="Ex: 987654321"
                      value={newPageId}
                      onChange={(e) => setNewPageId(e.target.value)}
                      className="input-premium h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Nome Amigável</label>
                    <Input
                      placeholder="Ex: Criativo 01 - Escala"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      className="input-premium h-12"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddMonitoring}
                    disabled={addMonitoredMutation.isPending}
                    className="btn-premium h-12 px-10 text-[10px] font-black uppercase tracking-widest rounded-xl"
                  >
                    {addMonitoredMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Iniciar Rastreamento"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
                  >
                    Descartar
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {monitoredQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-white/20" />
            <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">Sincronizando trackers...</p>
          </div>
        )}

        {/* Empty State */}
        {!monitoredQuery.isLoading && monitoredAds.length === 0 && !showAddForm && (
          <EmptyState
            icon={Target}
            title="Nenhum anúncio em rastreio"
            description="Comece a monitorar seus anúncios ou de concorrentes para saber exatamente quando eles forem pausados."
            actionLabel="Adicionar Primeiro Tracker"
            onAction={() => setShowAddForm(true)}
          />
        )}

        {/* Monitored List Grid */}
        {monitoredAds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitoredAds.map((ad, i) => (
              <motion.div
                key={ad.adId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="card-premium bg-white/[0.02] border-white/5 p-6 group hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white truncate group-hover:text-blue-400 transition-colors">
                        {ad.pageName || "Anúncio Sem Nome"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">ID: {ad.adId}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-800" />
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Page: {ad.pageId}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                      ad.monitoringStatus === "active" 
                        ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                        : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                    )}>
                      {ad.monitoringStatus === "active" ? "Ativo" : "Pausado"}
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <Activity className={cn("w-3.5 h-3.5", ad.isStillActive ? "text-green-500" : "text-red-500")} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status na Meta</span>
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", ad.isStillActive ? "text-green-500" : "text-red-500")}>
                        {ad.isStillActive ? "Online" : "Offline"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Última Checagem</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        {ad.lastCheckedAt ? new Date(ad.lastCheckedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 h-10 border-white/5 bg-white/[0.02] hover:bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl"
                    >
                      <a href={`https://www.facebook.com/ads/library/?id=${ad.adId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Ver na Meta
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMonitoring(ad.adId)}
                      disabled={removeMonitoredMutation.isPending}
                      className="w-10 h-10 rounded-xl text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
