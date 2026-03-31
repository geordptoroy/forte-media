import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  ChevronLeft,
  Plus,
  Trash2,
  Bell,
  TrendingUp,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Monitoring() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdId, setNewAdId] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [newPageName, setNewPageName] = useState("");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Query tRPC real para buscar anúncios monitorados
  const monitoredQuery = trpc.monitoring.getMonitored.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const addMonitoredMutation = trpc.monitoring.addMonitored.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Monitoramento adicionado com sucesso");
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
    if (!newAdId.trim()) {
      toast.error("Digite o ID do anúncio");
      return;
    }
    if (!newPageId.trim()) {
      toast.error("Digite o ID da página");
      return;
    }
    addMonitoredMutation.mutate({
      adId: newAdId.trim(),
      pageId: newPageId.trim(),
      pageName: newPageName.trim() || undefined,
    });
  };

  const handleRemoveMonitoring = (id: number) => {
    removeMonitoredMutation.mutate({ monitoredId: id });
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100"
      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100";
  };

  const monitoredAds = monitoredQuery.data?.monitored || [];

  if (monitoredQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Monitoramento
              </h1>
              <p className="text-xs text-muted-foreground">
                Acompanhe anúncios competitivos em tempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => monitoredQuery.refetch()}
              disabled={monitoredQuery.isFetching}
              className="border-border"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${monitoredQuery.isFetching ? "animate-spin" : ""}`}
                strokeWidth={2}
              />
              Atualizar
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary hover:bg-primary/90 text-white"
              size="sm"
            >
              {showAddForm ? (
                <>
                  <X className="w-4 h-4 mr-2" strokeWidth={2} />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Error state */}
        {monitoredQuery.isError && (
          <Card className="border-border/50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Erro ao carregar monitoramentos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {monitoredQuery.error?.message || "Tente novamente mais tarde"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-border/50 p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Adicionar Anúncio ao Monitoramento
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  ID do Anúncio *
                </label>
                <Input
                  placeholder="Ex: 123456789"
                  value={newAdId}
                  onChange={(e) => setNewAdId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  ID da Página *
                </label>
                <Input
                  placeholder="Ex: 987654321"
                  value={newPageId}
                  onChange={(e) => setNewPageId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Nome da Página (opcional)
                </label>
                <Input
                  placeholder="Ex: Empresa XYZ"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAddMonitoring}
              disabled={addMonitoredMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {addMonitoredMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={2} />
              ) : (
                <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
              )}
              Iniciar Monitoramento
            </Button>
          </Card>
        )}

        {/* Monitored Ads List */}
        {monitoredAds.length === 0 ? (
          <Card className="border-border/50 p-12 text-center">
            <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum anúncio em monitoramento
            </h3>
            <p className="text-muted-foreground mb-6">
              Adicione anúncios para monitorar mudanças em tempo real
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
              Começar Monitoramento
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {monitoredAds.length} Anúncio{monitoredAds.length !== 1 ? "s" : ""} em Monitoramento
            </h2>
            <div className="grid gap-4">
              {monitoredAds.map((ad) => (
                <Card
                  key={ad.id}
                  className="border-border/50 p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {ad.pageName || `Página ${ad.pageId}`}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            ad.monitoringStatus
                          )}`}
                        >
                          {ad.monitoringStatus === "active"
                            ? "Ativo"
                            : ad.monitoringStatus === "paused"
                            ? "Pausado"
                            : "Concluído"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Última Verificação</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.lastCheckedAt
                                ? new Date(ad.lastCheckedAt).toLocaleString("pt-BR")
                                : "Nunca"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Gasto Atual</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.lastKnownSpend ? `$${ad.lastKnownSpend}` : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Impressões</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.lastKnownImpressions
                                ? Number(ad.lastKnownImpressions).toLocaleString("pt-BR")
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.isStillActive ? "Ainda ativo" : "Inativo"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>ID do Anúncio: <span className="font-mono">{ad.adId}</span></span>
                        <span>•</span>
                        <span>Adicionado em {new Date(ad.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMonitoring(ad.id)}
                      disabled={removeMonitoredMutation.isPending}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" strokeWidth={2} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
