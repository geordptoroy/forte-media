import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { reportsApi } from '../services/api';
import { useToast } from '../components/ui/toast';

export const Reports: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.export(period, format, ['spend', 'impressions', 'ads_count']);
      toast(`Relatório gerado: ${format.toUpperCase()}`);
    } catch (err) {
      toast('Erro ao gerar relatório', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Período"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              options={[
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: '90d', label: 'Últimos 90 dias' },
              ]}
            />
            <Select
              label="Formato"
              value={format}
              onChange={e => setFormat(e.target.value)}
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'csv', label: 'CSV' },
              ]}
            />
          </div>
          <Button onClick={handleExport} variant="primary" loading={loading} className="w-full">
            Gerar Relatório
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métricas Incluídas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-[#AAAAAA] text-sm">
            <li>✓ Total de anúncios escalados</li>
            <li>✓ Gasto total e médio</li>
            <li>✓ Impressões totais</li>
            <li>✓ Top 5 anunciantes</li>
            <li>✓ Tendência de crescimento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
