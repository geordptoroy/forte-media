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
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Monitoring() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [monitoredAds, setMonitoredAds] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdName, setNewAdName] = useState("");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  // Queries
  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const handleAddMonitoring = () => {
    if (!newAdName.trim()) {
      toast.error("Digite o nome do anúncio");
      return;
    }

    const newMonitoredAd = {
      id: Date.now().toString(),
      name: newAdName,
      status: "active",
      lastUpdate: new Date().toLocaleString("pt-BR"),
      changePercentage: 0,
      currentSpend: "$0",
      alerts: 0,
    };

    setMonitoredAds([...monitoredAds, newMonitoredAd]);
    setNewAdName("");
    setShowAddForm(false);
    toast.success("Monitoramento adicionado");
  };

  const handleRemoveMonitoring = (id: string) => {
    setMonitoredAds(monitoredAds.filter((ad) => ad.id !== id));
    toast.success("Monitoramento removido");
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100"
      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100";
  };

  const getTrendIcon = (percentage: number) => {
    return percentage > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" strokeWidth={2} />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" strokeWidth={2} />
    );
  };

  if (credentialsStatus.isLoading) {
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
                Acompanhe anúncios em tempo real
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
            Adicionar Monitoramento
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-6 py-8">
        {!credentialsStatus.data?.isValid && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Credenciais não configuradas
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Configure suas credenciais Meta em Configurações para ativar monitoramento em tempo real
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-border/50 p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Adicionar Novo Monitoramento
            </h2>
            <div className="flex gap-4">
              <Input
                placeholder="Nome do anúncio..."
                value={newAdName}
                onChange={(e) => setNewAdName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddMonitoring()}
              />
              <Button
                onClick={handleAddMonitoring}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Adicionar
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewAdName("");
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {/* Monitored Ads */}
        {monitoredAds.length === 0 ? (
          <Card className="border-border/50 p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum monitoramento ativo
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
                          {ad.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            ad.status
                          )}`}
                        >
                          {ad.status === "active" ? "Ativo" : "Pausado"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Última Atualização</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.lastUpdate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Mudança</p>
                            <p className="text-sm font-medium text-foreground flex items-center gap-1">
                              {getTrendIcon(ad.changePercentage)}
                              {ad.changePercentage > 0 ? "+" : ""}
                              {ad.changePercentage}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Gasto Atual</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.currentSpend}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Alertas</p>
                            <p className="text-sm font-medium text-foreground">
                              {ad.alerts} novo{ad.alerts !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {ad.alerts > 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            Há {ad.alerts} alerta{ad.alerts !== 1 ? "s" : ""} novo{ad.alerts !== 1 ? "s" : ""} para este anúncio
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveMonitoring(ad.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
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
