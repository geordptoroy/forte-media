import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { FileText, Download, BarChart3, Heart, Eye, Loader2, Calendar, FileJson, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function Reports() {
  const [period, setPeriod] = useState('30d');
  const [format, setFormat] = useState('csv');
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

  const filterByPeriod = (items: any[], dateField: string) => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return items.filter((item) => new Date(item[dateField]) >= cutoff);
  };

  const recentFavorites = filterByPeriod(favorites, 'createdAt');
  const recentMonitored = filterByPeriod(monitored, 'createdAt');

  const handleExportCSV = () => {
    setLoading(true);
    try {
      const rows: string[][] = [['Tipo', 'ID', 'Nome/Página', 'Gasto', 'Impressões', 'Data']];
      recentFavorites.forEach((fav) => rows.push(['Favorito', fav.adId, fav.pageName || '', fav.spend || '', String(fav.impressions || ''), new Date(fav.createdAt).toLocaleDateString('pt-BR')]));
      recentMonitored.forEach((mon) => rows.push(['Monitorado', mon.adId, mon.pageName || '', mon.lastKnownSpend || '', String(mon.lastKnownImpressions || ''), new Date(mon.createdAt).toLocaleDateString('pt-BR')]));
      campaigns.forEach((camp) => rows.push(['Campanha', camp.campaignId, camp.campaignName, String(camp.totalSpend || ''), String(camp.totalImpressions || ''), camp.startDate ? new Date(camp.startDate).toLocaleDateString('pt-BR') : '']));

      const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `forte-media-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório CSV exportado');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    setLoading(true);
    try {
      const report = { period, generatedAt: new Date().toISOString(), favorites: recentFavorites, monitored: recentMonitored, campaigns };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `forte-media-report-${period}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório JSON exportado');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (format === 'csv') handleExportCSV();
    else handleExportJSON();
  };

  const isDataLoading = favoritesQuery.isLoading || monitoredQuery.isLoading || campaignsQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Relatórios</h1>
          <p className="text-gray-500 font-medium">Exporte dados estratégicos e análises consolidadas da sua operação.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Favoritos", value: favorites.length, recent: recentFavorites.length, icon: Heart, color: "text-red-500" },
            { label: "Monitorados", value: monitored.length, recent: recentMonitored.length, icon: Eye, color: "text-blue-500" },
            { label: "Campanhas", value: campaigns.length, recent: campaigns.length, icon: BarChart3, color: "text-green-500" },
          ].map((stat, i) => (
            <Card key={i} className="card-premium bg-white/[0.02] border-white/5 p-8">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-white/5 rounded-xl border border-white/10 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Total Geral</span>
              </div>
              <p className="text-4xl font-bold text-white tracking-tighter mb-1">
                {isDataLoading ? "---" : stat.value}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {stat.recent} Adicionados recentemente
              </p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Export Configuration */}
          <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
            <div className="flex items-center gap-2 mb-8">
              <FileText className="w-4 h-4 text-gray-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Configuração de Exportação</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Intervalo de Dados
                  </label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="input-premium h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                    {format === 'csv' ? <FileSpreadsheet className="w-3 h-3" /> : <FileJson className="w-3 h-3" />} 
                    Formato do Arquivo
                  </label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="input-premium h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="csv">CSV (Excel / Planilhas)</SelectItem>
                      <SelectItem value="json">JSON (Desenvolvedores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={loading || isDataLoading}
                className="btn-premium w-full h-14 text-sm font-bold uppercase tracking-[0.2em]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-3">
                    <Download className="w-5 h-5" />
                    Gerar e Baixar Relatório
                  </span>
                )}
              </Button>
            </div>
          </Card>

          {/* Data Structure Info */}
          <Card className="card-premium bg-white/[0.01] border-white/5 p-8 flex flex-col justify-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Estrutura do Relatório</h3>
            <div className="space-y-6">
              {[
                { title: "Métricas de Favoritos", desc: "Inclui IDs, nomes de páginas, gastos estimados e datas de arquivamento." },
                { title: "Dados de Monitoramento", desc: "Status de atividade em tempo real, últimas verificações e oscilações de gasto." },
                { title: "Performance de Campanhas", desc: "Consolidado de impressões, cliques, CTR e ROAS por conta de anúncio." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1 h-10 bg-white/10 rounded-full shrink-0 mt-1"></div>
                  <div>
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
