import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { monitoringApi, adsApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

export const Monitoring: React.FC = () => {
  const [selectedAd, setSelectedAd] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { toast } = useToast();
  const { data: monitoring, isLoading, refetch } = useQuery({
    queryKey: ['monitoring'],
    queryFn: monitoringApi.list,
  });

  const handleViewHistory = async (adId: string) => {
    try {
      const h = await adsApi.history(adId);
      setHistory(h);
      setSelectedAd(adId);
    } catch (err) {
      toast('Erro ao carregar histórico', 'error');
    }
  };

  const handleRemove = async (adId: string) => {
    try {
      await monitoringApi.remove(adId);
      toast('Removido do monitoramento');
      refetch();
    } catch (err) {
      toast('Erro ao remover', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        [1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)
      ) : monitoring?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[#AAAAAA]">Nenhum anúncio em monitoramento</p>
          </CardContent>
        </Card>
      ) : (
        monitoring?.map((item: any) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{item.ad?.page_name}</h3>
                  <p className="text-[#AAAAAA] text-sm mb-3">Score: {item.ad?.score} | Gasto: {item.ad?.spend_range}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleViewHistory(item.ad_id)}>Ver histórico</Button>
                    <Button size="sm" variant="danger" onClick={() => handleRemove(item.ad_id)}>Remover</Button>
                  </div>
                </div>
                {item.ad?.creative_url && (
                  <img src={item.ad.creative_url} alt={item.ad.page_name} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!selectedAd} onClose={() => setSelectedAd(null)} title="Histórico de Score">
        {history.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <XAxis dataKey="date" tick={{ fill: '#AAAAAA', fontSize: 10 }} tickFormatter={v => v.slice(5)} axisLine={{ stroke: '#222222' }} />
              <YAxis tick={{ fill: '#AAAAAA', fontSize: 10 }} axisLine={{ stroke: '#222222' }} />
              <Tooltip contentStyle={{ background: '#111111', border: '1px solid #222222', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="score" stroke="#2C3E66" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Dialog>
    </div>
  );
};
