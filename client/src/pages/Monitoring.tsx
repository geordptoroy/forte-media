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
} from "lucide-react";
import { toast } from "sonner";

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
        toast.error("Erro ao adicionar monitoramento");
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
        toast.error("Erro ao remover monitoramento");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover monitoramento");
    },
  });

  const handleAddMonitoring = () => {
    if (!newAdId.trim() || !newPageId.trim()) {
      toast.error("Preencha os campos obrigatorios");
      return;
    }
    addMonitoredMutation.mutate({
      adId: newAdId.trim(),
      pageId: newPageId.trim(),
      pageName: newPageName.trim() || undefined,
    });
  };

  const handleRemoveMonitoring = (adId: string) => {
    if (confirm("Deseja parar de monitorar este anuncio?")) {
      removeMonitoredMutation.mutate({ adId });
    }
  };

  const monitoredAds = monitoredQuery.data?.monitored || [];
  const activeCount = monitoredAds.filter((m) => m.monitoringStatus === "active").length;
  const stillActiveCount = monitoredAds.filter((m) => m.isStillActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Monitoramento"
          subtitle="Acompanhe anuncios competitivos e o status de atividade em tempo real."
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => monitoredQuery.refetch()}
                disabled={monitoredQuery.isFetching}
                className="border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${monitoredQuery.isFetching ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-premium text-xs font-bold uppercase tracking-widest"
              >
                {showAddForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Monitorar
                  </>
                )}
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: "Total", value: monitoredAds.length },
            { icon: Activity, label: "Ativos", value: activeCount },
            {
              icon: CheckCircle,
              label: "Ainda no Ar",
              value: stillActiveCount,
            },
            {
              icon: PauseCircle,
              label: "Pausados",
              value: monitoredAds.filter((m) => m.monitoringStatus === "paused").length,
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className="card-premium bg-white/[0.02] border-white/5 p-4 text-center"
            >
              <stat.icon className="w-4 h-4 text-gray-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {stat.label}
              </p>
            </Card>
          ))}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="card-premium bg-white/[0.02] border-white/5 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
              Adicionar Monitoramento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Ad ID *
                </label>
                <Input
                  placeholder="ID do anuncio"
                  value={newAdId}
                  onChange={(e) => setNewAdId(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Page ID *
                </label>
                <Input
                  placeholder="ID da pagina"
                  value={newPageId}
                  onChange={(e) => setNewPageId(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Nome da Pagina
                </label>
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
              className="btn-premium"
            >
              {addMonitoredMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Iniciar Monitoramento"
              )}
            </Button>
          </Card>
        )}

        {/* Loading */}
        {monitoredQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        )}

        {/* Empty State */}
        {!monitoredQuery.isLoading && monitoredAds.length === 0 && (
          <EmptyState
            icon={Eye}
            title="Nenhum anuncio monitorado"
            description="Adicione anuncios para monitorar seu status de atividade ao longo do tempo."
            actionLabel="Adicionar Monitoramento"
            onAction={() => setShowAddForm(true)}
          />
        )}

        {/* Monitored List */}
        {monitoredAds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitoredAds.map((ad) => (
              <Card
                key={ad.adId}
                className="card-premium-hover bg-white/[0.02] border-white/5 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {ad.pageName || "Pagina desconhecida"}
                    </p>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">
                      {ad.adId}
                    </p>
                  </div>
                  <span
                    className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      ad.monitoringStatus === "active"
                        ? "bg-green-500/10 text-green-500"
                        : ad.monitoringStatus === "paused"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {ad.monitoringStatus === "active"
                      ? "Ativo"
                      : ad.monitoringStatus === "paused"
                      ? "Pausado"
                      : "Concluido"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {ad.isStillActive && (
                    <div className="flex items-center gap-2 text-xs text-green-500">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-bold">Ainda no ar</span>
                    </div>
                  )}
                  {ad.lastCheckedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(ad.lastCheckedAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  )}
                  {ad.notes && (
                    <p className="text-xs text-gray-500 italic">{ad.notes}</p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMonitoring(ad.adId)}
                  disabled={removeMonitoredMutation.isPending}
                  className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remover
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
