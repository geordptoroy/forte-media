import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { FileText, Download, BarChart3, Heart, Eye, Loader2, AlertCircle } from 'lucide-react';

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState('30d');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  // Queries para obter dados reais
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

  // Filtrar por período
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
      const rows: string[][] = [];

      // Cabeçalho
      rows.push(['Tipo', 'ID', 'Nome/Página', 'Gasto', 'Impressões', 'Data']);

      // Favoritos
      recentFavorites.forEach((fav) => {
        rows.push([
          'Favorito',
          fav.adId,
          fav.pageName || '',
          fav.spend || '',
          String(fav.impressions || ''),
          new Date(fav.createdAt).toLocaleDateString('pt-BR'),
        ]);
      });

      // Monitorados
      recentMonitored.forEach((mon) => {
        rows.push([
          'Monitorado',
          mon.adId,
          mon.pageName || '',
          mon.lastKnownSpend || '',
          String(mon.lastKnownImpressions || ''),
          new Date(mon.createdAt).toLocaleDateString('pt-BR'),
        ]);
      });

      // Campanhas
      campaigns.forEach((camp) => {
        rows.push([
          'Campanha',
          camp.campaignId,
          camp.campaignName,
          String(camp.totalSpend || ''),
          String(camp.totalImpressions || ''),
          camp.startDate ? new Date(camp.startDate).toLocaleDateString('pt-BR') : '',
        ]);
      });

      // Gerar CSV
      const csvContent = rows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `forte-media-relatorio-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Relatório CSV exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    setLoading(true);
    try {
      const report = {
        periodo: period,
        geradoEm: new Date().toISOString(),
        resumo: {
          totalFavoritos: recentFavorites.length,
          totalMonitorados: recentMonitored.length,
          totalCampanhas: campaigns.length,
        },
        favoritos: recentFavorites,
        monitorados: recentMonitored,
        campanhas: campaigns,
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `forte-media-relatorio-${period}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Relatório JSON exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (format === 'csv') {
      handleExportCSV();
    } else {
      handleExportJSON();
    }
  };

  const isDataLoading = favoritesQuery.isLoading || monitoredQuery.isLoading || campaignsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Favoritos</p>
              <p className="text-3xl font-bold text-foreground">
                {favoritesQuery.isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" strokeWidth={2} />
                ) : (
                  favorites.length
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {recentFavorites.length} no período selecionado
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
          </div>
        </Card>
        <Card className="border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monitorados</p>
              <p className="text-3xl font-bold text-foreground">
                {monitoredQuery.isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" strokeWidth={2} />
                ) : (
                  monitored.length
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {recentMonitored.length} no período selecionado
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
          </div>
        </Card>
        <Card className="border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Campanhas</p>
              <p className="text-3xl font-bold text-foreground">
                {campaignsQuery.isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" strokeWidth={2} />
                ) : (
                  campaigns.length
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total sincronizadas
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
          </div>
        </Card>
      </div>

      {/* Export Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" strokeWidth={2} />
            Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={loading || isDataLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={2} />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" strokeWidth={2} />
                Exportar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Metrics Included */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Incluídos no Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Favoritos</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>ID e nome do anúncio</li>
                <li>Gasto estimado</li>
                <li>Impressões</li>
                <li>Data de adição</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Monitoramentos</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>ID e página do anúncio</li>
                <li>Gasto atual</li>
                <li>Impressões atuais</li>
                <li>Status de atividade</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Campanhas</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Nome e ID da campanha</li>
                <li>Gasto total</li>
                <li>Impressões e cliques</li>
                <li>ROAS e CTR</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
