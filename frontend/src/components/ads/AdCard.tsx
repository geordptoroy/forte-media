import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Ad, AdHistory } from '../../types/api.types';
import { getScoreBadgeColor, getTrendColor, getTrendIcon, formatSpendRange, formatImpressionsRange } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adsApi, favoritesApi, monitoringApi } from '../../services/api';
import { useToast } from '../ui/toast';

interface AdCardProps {
  ad: Ad;
}

export const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AdHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  const openDetail = async () => {
    setOpen(true);
    setLoadingHistory(true);
    try {
      const h = await adsApi.history(ad.id);
      setHistory(h);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFavorite = async () => {
    await favoritesApi.add(ad.id);
    toast('Adicionado aos favoritos!');
  };

  const handleMonitor = async () => {
    await monitoringApi.add(ad.id);
    toast('Monitoramento ativado!');
  };

  return (
    <>
      <Card className="hover:border-[#2C3E66]/50 transition-all duration-200 group">
        <div className="relative">
          <img
            src={ad.creative_url}
            alt={ad.page_name}
            className="w-full h-40 object-cover rounded-t-xl"
            onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${ad.id}/400/300`; }}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${getScoreBadgeColor(ad.score)}`}>
              Score {ad.score}
            </span>
          </div>
          {ad.media_type && (
            <div className="absolute top-2 left-2">
              <span className="text-xs px-2 py-0.5 rounded bg-black/60 text-[#AAAAAA] capitalize">{ad.media_type}</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-white font-semibold text-sm truncate mb-2">{ad.page_name}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#AAAAAA] mb-3">
            <div>
              <span className="block text-[#666666]">Gasto</span>
              <span>{formatSpendRange(ad.spend_range)}</span>
            </div>
            <div>
              <span className="block text-[#666666]">Impressões</span>
              <span>{formatImpressionsRange(ad.impressions_range)}</span>
            </div>
            <div>
              <span className="block text-[#666666]">Dias no ar</span>
              <span>{ad.days_active}d</span>
            </div>
            <div>
              <span className="block text-[#666666]">Tendência</span>
              <span className={getTrendColor(ad.trend)}>{getTrendIcon(ad.trend)} {ad.trend}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={openDetail} className="flex-1">Ver detalhes</Button>
            <Button size="sm" variant="ghost" onClick={handleFavorite} title="Favoritar">★</Button>
            <Button size="sm" variant="ghost" onClick={handleMonitor} title="Monitorar">◎</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={`Detalhes — ${ad.page_name}`}>
        <div className="space-y-4">
          <img src={ad.creative_url} alt={ad.page_name} className="w-full rounded-lg object-cover max-h-64" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-[#0d0d0d] p-3 rounded-lg">
              <span className="text-[#AAAAAA] block text-xs mb-1">Score</span>
              <span className={`font-bold text-lg ${getScoreBadgeColor(ad.score).split(' ')[1]}`}>{ad.score}</span>
            </div>
            <div className="bg-[#0d0d0d] p-3 rounded-lg">
              <span className="text-[#AAAAAA] block text-xs mb-1">Gasto</span>
              <span className="text-white font-medium">{formatSpendRange(ad.spend_range)}</span>
            </div>
            <div className="bg-[#0d0d0d] p-3 rounded-lg">
              <span className="text-[#AAAAAA] block text-xs mb-1">Impressões</span>
              <span className="text-white font-medium">{formatImpressionsRange(ad.impressions_range)}</span>
            </div>
            <div className="bg-[#0d0d0d] p-3 rounded-lg">
              <span className="text-[#AAAAAA] block text-xs mb-1">Dias no ar</span>
              <span className="text-white font-medium">{ad.days_active} dias</span>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Histórico de Score (30 dias)</h4>
            {loadingHistory ? (
              <div className="skeleton h-40 rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history}>
                  <XAxis dataKey="date" tick={{ fill: '#AAAAAA', fontSize: 10 }} tickFormatter={v => v.slice(5)} axisLine={{ stroke: '#222222' }} />
                  <YAxis tick={{ fill: '#AAAAAA', fontSize: 10 }} axisLine={{ stroke: '#222222' }} />
                  <Tooltip contentStyle={{ background: '#111111', border: '1px solid #222222', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="score" stroke="#2C3E66" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFavorite} variant="secondary" className="flex-1">★ Favoritar</Button>
            <Button onClick={handleMonitor} variant="primary" className="flex-1">◎ Monitorar</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
