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
  Calendar,
  Zap,
  ShieldCheck,
  TrendingUp,
  FileText,
  PieChart
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        ["Tipo", "ID", "Nome/Pagina", "Gasto Min", "Impressoes Min", "Data Criacao"],
      ];
      recentFavorites.forEach((fav) =>
        rows.push([
          "Favorito",
          fav.adId,
          fav.pageName || "",
          String(fav.spend?.min ?? "N/A"),
          String(fav.impressions?.min ?? "N/A"),
          new Date(fav.createdAt).toLocaleDateString("pt-BR"),
        ])
      );
      recentMonitored.forEach((mon) =>
        rows.push([
          "Monitorado",
          mon.adId,
          mon.pageName || "",
          "N/A",
          "N/A",
          new Date(mon.createdAt).toLocaleDateString("pt-BR"),
        ])
      );
      campaigns.forEach((camp) =>
        rows.push([
          "Campanha",
          camp.campaignId,
          camp.campaignName,
          String(camp.totalSpend ?? "0"),
          String(camp.totalImpressions ?? "0"),
          camp.startDate
            ? new Date(camp.startDate).toLocaleDateString("pt-BR")
            : "N/A",
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
      link.download = `forte-media-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório CSV exportado com sucesso!");
    } catch {
      toast.error("Erro ao gerar relatório CSV");
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
        summary: {
          favorites: recentFavorites.length,
          monitored: recentMonitored.length,
          campaigns: campaigns.length,
        },
        data: {
          favorites: recentFavorites,
          monitored: recentMonitored,
          campaigns,
        }
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
      toast.success("Relatório JSON exportado com sucesso!");
    } catch {
      toast.error("Erro ao gerar relatório JSON");
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

  const stats = [
    { label: "Favoritos", value: recentFavorites.length, icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Monitorados", value: recentMonitored.length, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Campanhas", value: campaigns.length, icon: BarChart3, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Registros", value: recentFavorites.length + recentMonitored.length + campaigns.length, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Relatórios e BI"
          subtitle="Extraia inteligência estratégica da sua operação para análise em ferramentas externas."
        />

        {/* Export Panel */}
        <Card className="card-premium bg-white/[0.02] border-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <PieChart className="w-48 h-48 text-white" />
          </div>

          <div className="flex items-start gap-4 mb-10 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Exportação de Dados</h2>
              <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">
                Consolide sua inteligência de mercado em um único arquivo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Período de Análise
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="input-premium h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Formato do Arquivo
              </label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="input-premium h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 text-white">
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-500" />
                      <span>CSV (Excel / Sheets)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-yellow-500" />
                      <span>JSON (Sistemas / BI)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Real-time Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 text-center group hover:border-white/10 transition-all"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3", stat.bg, stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
                {isDataLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white/10 mx-auto" />
                ) : (
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                )}
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={handleExport}
            disabled={loading || isDataLoading}
            className="btn-premium w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl relative z-10"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Download className="w-5 h-5 mr-3" />
                Gerar e Baixar Relatório
              </>
            )}
          </Button>
        </Card>

        {/* Documentation / Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "O que será exportado?",
              icon: FileText,
              items: [
                "Criativos salvos na biblioteca",
                "Status de rastreio Utmify-style",
                "Métricas de campanhas ativas",
                "IDs de anúncios e páginas Meta",
              ],
            },
            {
              title: "Como usar os dados?",
              icon: TrendingUp,
              items: [
                "Importe no Excel para pivot tables",
                "Suba no PowerBI para dashboards",
                "Use JSON para scripts de automação",
                "Histórico de atividade offline",
              ],
            },
            {
              title: "Segurança e BI",
              icon: ShieldCheck,
              items: [
                "Exportação 100% local no browser",
                "Nenhum dado sensível sai da conta",
                "Conformidade total com LGPD",
                "Backup offline de estratégias",
              ],
            },
          ].map((section, i) => (
            <Card key={i} className="card-premium bg-white/[0.02] border-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-4 h-4 text-gray-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
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
