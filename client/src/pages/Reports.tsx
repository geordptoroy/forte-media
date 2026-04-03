import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Download,
  BarChart3,
  Heart,
  Eye,
  Loader2,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";

export default function Reports() {
  const [period, setPeriod] = useState("30d");
  const [format, setFormat] = useState("csv");
  const [loading, setLoading] = useState(false);

  const favoritesQuery = trpc.ads.getFavorites.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const monitoredQuery = trpc.monitoring.getMonitored.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const campaignsQuery = trpc.campaigns.getCampaigns.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const favorites = favoritesQuery.data?.favorites || [];
  const monitored = monitoredQuery.data?.monitored || [];
  const campaigns = campaignsQuery.data?.campaigns || [];

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recentFavorites = favorites.filter(
    (item) => new Date(item.createdAt) >= cutoff
  );
  const recentMonitored = monitored.filter(
    (item) => new Date(item.createdAt) >= cutoff
  );

  const handleExportCSV = () => {
    setLoading(true);
    try {
      const rows: string[][] = [
        ["Tipo", "ID", "Nome/Pagina", "Gasto Min", "Impressoes Min", "Data"],
      ];
      recentFavorites.forEach((fav) =>
        rows.push([
          "Favorito",
          fav.adId,
          fav.pageName || "",
          String(fav.spend?.min ?? ""),
          String(fav.impressions?.min ?? ""),
          new Date(fav.createdAt).toLocaleDateString("pt-BR"),
        ])
      );
      recentMonitored.forEach((mon) =>
        rows.push([
          "Monitorado",
          mon.adId,
          mon.pageName || "",
          "",
          "",
          new Date(mon.createdAt).toLocaleDateString("pt-BR"),
        ])
      );
      campaigns.forEach((camp) =>
        rows.push([
          "Campanha",
          camp.campaignId,
          camp.campaignName,
          String(camp.totalSpend ?? ""),
          String(camp.totalImpressions ?? ""),
          camp.startDate
            ? new Date(camp.startDate).toLocaleDateString("pt-BR")
            : "",
        ])
      );

      const csvContent = rows
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forte-media-report-${period}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Relatorio CSV exportado");
    } catch {
      toast.error("Erro ao gerar relatorio");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    setLoading(true);
    try {
      const report = {
        period,
        generatedAt: new Date().toISOString(),
        favorites: recentFavorites,
        monitored: recentMonitored,
        campaigns,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forte-media-report-${period}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Relatorio JSON exportado");
    } catch {
      toast.error("Erro ao gerar relatorio");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (format === "csv") handleExportCSV();
    else handleExportJSON();
  };

  const isDataLoading =
    favoritesQuery.isLoading ||
    monitoredQuery.isLoading ||
    campaignsQuery.isLoading;

  const summaryCards = [
    {
      icon: Heart,
      label: "Favoritos no Periodo",
      value: recentFavorites.length,
    },
    {
      icon: Eye,
      label: "Monitorados no Periodo",
      value: recentMonitored.length,
    },
    {
      icon: BarChart3,
      label: "Campanhas Totais",
      value: campaigns.length,
    },
    {
      icon: Download,
      label: "Total de Registros",
      value: recentFavorites.length + recentMonitored.length + campaigns.length,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Relatorios"
          subtitle="Exporte dados estrategicos e analises consolidadas da sua operacao."
        />

        {/* Config Panel */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Exportar Relatorio</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Selecione o periodo e formato para exportar seus dados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Periodo
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                  <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                  <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Formato
              </label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      JSON
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {summaryCards.map((card, i) => (
              <div
                key={i}
                className="p-4 bg-white/5 rounded-xl border border-white/10 text-center"
              >
                <card.icon className="w-4 h-4 text-gray-500 mx-auto mb-2" />
                {isDataLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                )}
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mt-1">
                  {card.label}
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={handleExport}
            disabled={loading || isDataLoading}
            className="btn-premium w-full sm:w-auto px-10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar {format.toUpperCase()}
              </>
            )}
          </Button>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: "Dados Incluidos",
              items: [
                "Anuncios favoritos com metricas",
                "Anuncios monitorados e status",
                "Campanhas e performance",
              ],
            },
            {
              title: "Formatos Suportados",
              items: [
                "CSV — compativel com Excel e Google Sheets",
                "JSON — para integracao com sistemas",
              ],
            },
            {
              title: "Privacidade",
              items: [
                "Dados exportados localmente",
                "Nenhum dado enviado a terceiros",
                "Conformidade com LGPD",
              ],
            },
          ].map((section, i) => (
            <Card
              key={i}
              className="card-premium bg-white/[0.02] border-white/5 p-5"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-gray-600 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
