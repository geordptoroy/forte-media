import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { CredentialsWarning } from "@/components/CredentialsWarning";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Loader2,
  RefreshCw,
  Activity,
  Calendar,
  MousePointerClick,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  budget?: number;
  budgetType?: string;
}

interface CampaignMetrics {
  impressions?: number;
  clicks?: number;
  spend?: number;
  reach?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  frequency?: number;
  conversions?: number;
  costPerConversion?: number;
  roas?: number;
  dateRange?: string;
}

export default function Performance() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics | null>(null);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const listCampaignsQuery = trpc.meta.listCampaigns.useQuery(undefined, {
    enabled: !!credentialsStatus.data?.hasCredentials,
  });

  const getCampaignMetricsQuery = trpc.meta.getCampaignMetrics.useQuery(
    { campaignId: selectedCampaign || "" },
    { enabled: !!selectedCampaign && !!credentialsStatus.data?.hasCredentials }
  );

  const handleLoadCampaigns = async () => {
    if (!credentialsStatus.data?.hasCredentials) {
      toast.error("Configure suas credenciais Meta primeiro");
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
      toast.error(error instanceof Error ? error.message : "Erro ao carregar campanhas");
    }
  };

  const handleLoadMetrics = async (campaignId: string) => {
    setSelectedCampaign(campaignId);
    try {
      const result = await getCampaignMetricsQuery.refetch();
      if (result.data?.metrics) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCampaignMetrics(result.data.metrics as any);
        toast.success("Metricas carregadas");
      } else {
        toast.error("Nenhuma metrica encontrada");
        setCampaignMetrics(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar metricas");
      setCampaignMetrics(null);
    }
  };

  const isLoading =
    listCampaignsQuery.isFetching || getCampaignMetricsQuery.isFetching;

  const selectedCampaignData = campaigns.find((c) => c.id === selectedCampaign);

  const metricCards = campaignMetrics
    ? [
        {
          icon: Eye,
          label: "Impressoes",
          value: campaignMetrics.impressions?.toLocaleString("pt-BR") ?? "—",
        },
        {
          icon: MousePointerClick,
          label: "Cliques",
          value: campaignMetrics.clicks?.toLocaleString("pt-BR") ?? "—",
        },
        {
          icon: DollarSign,
          label: "Gasto",
          value: campaignMetrics.spend
            ? `$${campaignMetrics.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : "—",
        },
        {
          icon: Users,
          label: "Alcance",
          value: campaignMetrics.reach?.toLocaleString("pt-BR") ?? "—",
        },
        {
          icon: Activity,
          label: "CTR",
          value: campaignMetrics.ctr
            ? `${campaignMetrics.ctr.toFixed(2)}%`
            : "—",
        },
        {
          icon: Target,
          label: "CPC",
          value: campaignMetrics.cpc
            ? `$${campaignMetrics.cpc.toFixed(2)}`
            : "—",
        },
        {
          icon: BarChart3,
          label: "CPM",
          value: campaignMetrics.cpm
            ? `$${campaignMetrics.cpm.toFixed(2)}`
            : "—",
        },
        {
          icon: TrendingUp,
          label: "ROAS",
          value: campaignMetrics.roas
            ? `${campaignMetrics.roas.toFixed(2)}x`
            : "—",
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Performance"
          subtitle="Analise profunda de metricas e ROI das suas campanhas ativas."
          actions={
            <Button
              onClick={handleLoadCampaigns}
              disabled={isLoading || !credentialsStatus.data?.hasCredentials}
              className="btn-premium"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar Campanhas
                </>
              )}
            </Button>
          }
        />

        {/* Aviso de credenciais */}
        {!credentialsStatus.isLoading && !credentialsStatus.data?.hasCredentials && (
          <CredentialsWarning message="Conecte sua Meta API para visualizar o desempenho em tempo real das suas contas de anuncio." />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Campanhas Ativas
            </h2>

            {campaigns.length === 0 ? (
              <Card className="card-premium bg-white/[0.02] border-white/5 p-8 text-center">
                <BarChart3 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {credentialsStatus.data?.hasCredentials
                    ? "Clique em Sincronizar para carregar suas campanhas."
                    : "Configure suas credenciais Meta para ver campanhas."}
                </p>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => handleLoadMetrics(campaign.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedCampaign === campaign.id
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold leading-tight truncate">
                        {campaign.name}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          selectedCampaign === campaign.id
                            ? "bg-black/10 text-black"
                            : campaign.status === "ACTIVE"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.objective && (
                      <p
                        className={`text-[10px] uppercase tracking-wider ${
                          selectedCampaign === campaign.id
                            ? "text-black/60"
                            : "text-gray-600"
                        }`}
                      >
                        {campaign.objective}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Panel */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Metricas
              {selectedCampaignData && (
                <span className="ml-2 text-white normal-case tracking-normal font-normal">
                  — {selectedCampaignData.name}
                </span>
              )}
            </h2>

            {getCampaignMetricsQuery.isFetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
              </div>
            ) : !selectedCampaign ? (
              <EmptyState
                icon={BarChart3}
                title="Selecione uma campanha"
                description="Escolha uma campanha na lista para visualizar suas metricas detalhadas."
              />
            ) : campaignMetrics ? (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {metricCards.map((metric, i) => (
                    <Card
                      key={i}
                      className="card-premium bg-white/[0.02] border-white/5 p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <metric.icon className="w-4 h-4 text-gray-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {metric.label}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-white">{metric.value}</p>
                    </Card>
                  ))}
                </div>

                {/* Date Range */}
                {campaignMetrics.dateRange && (
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Periodo: {campaignMetrics.dateRange}</span>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState
                icon={Activity}
                title="Nenhuma metrica disponivel"
                description="Nao foi possivel carregar as metricas desta campanha. Tente novamente."
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
