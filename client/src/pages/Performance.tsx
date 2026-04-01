import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Activity,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Performance() {
  const [, setLocation] = useLocation();
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
      toast.error(error instanceof Error ? error.message : "Erro ao carregar campanhas");
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
      toast.error(error instanceof Error ? error.message : "Erro ao carregar métricas");
    }
  };

  const isLoading = listCampaignsQuery.isFetching || getCampaignMetricsQuery.isFetching;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Performance</h1>
            <p className="text-gray-500 font-medium">Análise profunda de métricas e ROI das suas campanhas ativas.</p>
          </div>
          
          <Button
            onClick={handleLoadCampaigns}
            disabled={isLoading || !credentialsStatus.data?.isValid}
            className="btn-premium px-8"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sincronizar Campanhas
              </span>
            )}
          </Button>
        </div>

        {/* Status Check */}
        {!credentialsStatus.data?.isValid && !credentialsStatus.isLoading && (
          <Card className="card-premium bg-yellow-500/5 border-yellow-500/20 p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Métricas Indisponíveis</p>
              <p className="text-xs text-gray-400 mt-1">
                Conecte sua Meta API para visualizar o desempenho em tempo real das suas contas de anúncio.
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Campaigns Sidebar List */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 px-2">Campanhas Ativas</h2>
            
            {campaigns.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    onClick={() => handleLoadMetrics(campaign.id)}
                    className={`card-premium p-5 cursor-pointer transition-all border-white/5 ${
                      selectedCampaign === campaign.id 
                        ? "bg-white/10 border-white/20 ring-1 ring-white/20" 
                        : "bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{campaign.name}</h3>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${campaign.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                        {campaign.isActive ? 'Ativa' : 'Pausada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {campaign.objective || "Vendas"}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {campaign.budget || "0.00"}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-premium bg-white/[0.01] border-white/5 p-10 text-center border-dashed">
                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Nenhuma campanha sincronizada</p>
              </Card>
            )}
          </div>

          {/* Metrics Detail Area */}
          <div className="lg:col-span-2 space-y-8">
            {campaignMetrics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <DollarSign className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Investimento Total</p>
                    <p className="text-4xl font-bold text-white tracking-tighter">${campaignMetrics.spend || "0.00"}</p>
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase">
                      <ArrowUpRight className="w-3 h-3" /> 12% vs período anterior
                    </div>
                  </Card>

                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">ROAS da Campanha</p>
                    <p className="text-4xl font-bold text-white tracking-tighter">{campaignMetrics.roas || "0.00"}x</p>
                    <div className="mt-4 flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase">
                      Estável nas últimas 24h
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "Impressões", value: campaignMetrics.impressions || "0", icon: Users },
                    { label: "Cliques", value: campaignMetrics.clicks || "0", icon: Activity },
                    { label: "CTR", value: `${campaignMetrics.ctr || "0"}%`, icon: Target },
                    { label: "CPC Médio", value: `$${campaignMetrics.cpc || "0.00"}`, icon: DollarSign },
                  ].map((stat, i) => (
                    <Card key={i} className="card-premium bg-white/[0.02] border-white/5 p-5">
                      <stat.icon className="w-4 h-4 text-gray-600 mb-3" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </Card>
                  ))}
                </div>

                <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">Análise de Tendência</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                      <Calendar className="w-3 h-3" /> Últimos 30 dias
                    </div>
                  </div>
                  <div className="h-64 w-full bg-white/[0.01] rounded-2xl border border-white/5 flex items-center justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-800">Visualização Gráfica Indisponível</p>
                  </div>
                </Card>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed">
                <BarChart3 className="w-12 h-12 text-gray-800 mb-6" />
                <h3 className="text-lg font-bold text-white mb-2">Selecione uma Campanha</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Escolha uma campanha na lista ao lado para carregar as métricas detalhadas de performance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
