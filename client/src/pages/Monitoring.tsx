import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Plus,
  Trash2,
  Bell,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCw,
  X,
  Activity,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

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
      toast.error("Preencha os campos obrigatórios");
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

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Monitoramento</h1>
            <p className="text-gray-500 font-medium">Acompanhe métricas em tempo real e receba alertas de escala.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => monitoredQuery.refetch()}
              disabled={monitoredQuery.isFetching}
              className="border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${monitoredQuery.isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-premium flex items-center gap-2"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Cancelar" : "Novo Monitoramento"}
            </Button>
          </div>
        </div>

        {/* Add Form Card */}
        {showAddForm && (
          <Card className="card-premium bg-white/[0.02] border-white/5 p-8 animate-slide-in-up">
            <h3 className="text-lg font-bold text-white mb-6">Configurar Novo Monitoramento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">ID do Anúncio *</label>
                <Input
                  placeholder="Ex: 123456789"
                  value={newAdId}
                  onChange={(e) => setNewAdId(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">ID da Página *</label>
                <Input
                  placeholder="Ex: 987654321"
                  value={newPageId}
                  onChange={(e) => setNewPageId(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Nome da Página</label>
                <Input
                  placeholder="Opcional"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  className="input-premium"
                />
              </div>
            </div>
            <Button
              onClick={handleAddMonitoring}
              disabled={addMonitoredMutation.isPending}
              className="btn-premium px-8"
            >
              {addMonitoredMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ativar Monitoramento"
              )}
            </Button>
          </Card>
        )}

        {/* List of Monitored Ads */}
        {monitoredAds.length === 0 ? (
          <Card className="card-premium bg-white/[0.01] border-white/5 p-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Eye className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sem monitoramentos ativos</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Adicione IDs de anúncios competitivos para rastrear performance e mudanças de status.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="btn-premium px-8"
            >
              Iniciar Primeiro Monitoramento
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {monitoredAds.map((ad) => (
              <Card key={ad.id} className="card-premium bg-white/[0.02] border-white/5 p-8 group hover:border-white/20 transition-all">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Status Indicator */}
                  <div className="w-full md:w-48 h-40 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                    <Activity className={`w-8 h-8 ${ad.monitoringStatus === 'active' ? 'text-green-500' : 'text-gray-700'}`} />
                    <div className="mt-4 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</span>
                      <span className={`text-xs font-bold uppercase ${ad.monitoringStatus === 'active' ? 'text-green-500' : 'text-gray-400'}`}>
                        {ad.monitoringStatus === 'active' ? 'Monitorando' : 'Pausado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-primary-foreground transition-colors">
                          {ad.pageName || `Página ${ad.pageId}`}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            AD ID: {ad.adId}
                          </p>
                          <span className="text-gray-800">•</span>
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            Page ID: {ad.pageId}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMonitoring(ad.adId)}
                        disabled={removeMonitoredMutation.isPending}
                        className="text-gray-600 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Última Verif.
                        </p>
                        <p className="text-sm font-bold text-white">
                          {ad.updatedAt ? new Date(ad.updatedAt).toLocaleTimeString() : "Pendente"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" /> Gasto Conhecido
                        </p>
                        <p className="text-sm font-bold text-white">
                          {ad.metricsHistory && ad.metricsHistory.length > 0 ? `$${ad.metricsHistory[0].spend || '---'}` : "---"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <Eye className="w-3 h-3" /> Impressões
                        </p>
                        <p className="text-sm font-bold text-white">
                          {ad.metricsHistory && ad.metricsHistory.length > 0 ? Number(ad.metricsHistory[0].impressions || 0).toLocaleString() : "---"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                          <Bell className="w-3 h-3" /> Alertas
                        </p>
                        <p className="text-sm font-bold text-white">0 Ativos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8 border-l-4 border-l-white/20">
          <div className="flex items-center gap-4">
            <ShieldAlert className="w-6 h-6 text-gray-500" />
            <p className="text-sm text-gray-500 leading-relaxed">
              O monitoramento consome créditos da API Meta em intervalos regulares. Certifique-se de que seu token possui permissões de leitura de anúncios ativas.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
