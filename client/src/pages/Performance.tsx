import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Performance() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<any>(null);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();
  const listCampaignsQuery = trpc.meta.listCampaigns.useQuery(
    { adAccountId: "" },
    { enabled: false }
  );
  const getCampaignMetricsQuery = trpc.meta.getCampaignMetrics.useQuery(
    { 
      campaignId: selectedCampaign || "",
      dateStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateStop: new Date().toISOString().split('T')[0]
    },
    { enabled: false }
  );

  const handleLoadCampaigns = async () => {
    if (!credentialsStatus.data?.isValid) {
      toast.error("Configure suas credenciais Meta primeiro");
      setLocation("/settings");
      return;
    }

    try {
      const result = await listCampaignsQuery.refetch();
      if (result.data?.campaigns) {
        setCampaigns(result.data.campaigns);
        toast.success(`${result.data.campaigns.length} campanhas carregadas`);
      } else {
        toast.info("Nenhuma campanha encontrada");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar campanhas"
      );
    }
  };

  const handleLoadMetrics = async (campaignId: string) => {
    setSelectedCampaign(campaignId);
    try {
      const result = await getCampaignMetricsQuery.refetch();
      if (result.data?.metrics) {
        setCampaignMetrics(result.data.metrics);
        toast.success("Métricas carregadas");
      } else {
        toast.error("Nenhuma métrica encontrada");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar métricas"
      );
    }
  };

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
                Dashboard de Performance
              </h1>
              <p className="text-xs text-muted-foreground">
                Métricas detalhadas de suas campanhas Meta
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Load Button */}
        <Card className="border-border/50 p-6">
          {!credentialsStatus.data?.isValid && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Credenciais não configuradas
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                  Configure suas credenciais Meta em Configurações para acessar
                  métricas de campanhas
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleLoadCampaigns}
              disabled={isLoading || !credentialsStatus.data?.isValid}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" strokeWidth={2} />
                  Carregar Campanhas
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Campaigns List */}
        {campaigns.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {campaigns.length} Campanhas
            </h2>

            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className={`border-border/50 p-6 cursor-pointer hover:shadow-lg transition-all duration-300 ${
                    selectedCampaign === campaign.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => handleLoadMetrics(campaign.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {campaign.status || "Status desconhecido"}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Orçamento</p>
                            <p className="text-sm font-medium text-foreground">
                              ${campaign.budget || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Público</p>
                            <p className="text-sm font-medium text-foreground">
                              {campaign.targetAudience || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Objetivo</p>
                            <p className="text-sm font-medium text-foreground">
                              {campaign.objective || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" strokeWidth={2} />
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="text-sm font-medium text-foreground">
                              {campaign.isActive ? "Ativa" : "Inativa"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Campaign Metrics */}
        {campaignMetrics && selectedCampaign && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Métricas da Campanha
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gasto</p>
                    <p className="text-3xl font-bold text-foreground">
                      ${campaignMetrics.spend || "0"}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                </div>
              </Card>

              <Card className="border-border/50 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Impressões
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {campaignMetrics.impressions || "0"}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                </div>
              </Card>

              <Card className="border-border/50 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cliques</p>
                    <p className="text-3xl font-bold text-foreground">
                      {campaignMetrics.clicks || "0"}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                </div>
              </Card>

              <Card className="border-border/50 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CTR</p>
                    <p className="text-3xl font-bold text-foreground">
                      {campaignMetrics.ctr || "0"}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Advanced Metrics */}
            <Card className="border-border/50 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Métricas Avançadas
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">CPC</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${campaignMetrics.cpc || "0"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">CPM</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${campaignMetrics.cpm || "0"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">ROAS</p>
                  <p className="text-2xl font-bold text-foreground">
                    {campaignMetrics.roas || "0"}x
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {campaigns.length === 0 && !isLoading && (
          <Card className="border-border/50 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma campanha carregada
            </h3>
            <p className="text-muted-foreground">
              Clique em "Carregar Campanhas" para visualizar suas campanhas Meta
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
