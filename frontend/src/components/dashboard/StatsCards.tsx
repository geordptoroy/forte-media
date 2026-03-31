import React from 'react';
import { Card, CardContent } from '../ui/card';
import { DashboardStats } from '../../types/api.types';

interface StatsCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  const items = [
    { label: 'Anúncios Escalados', value: stats?.total_scaled_ads?.toString() || '—', icon: '⚡', change: `+${stats?.trend_percent || 0}%` },
    { label: 'Gasto Médio', value: stats?.avg_spend || '—', icon: '💰', change: '' },
    { label: 'Páginas Monitoradas', value: stats?.total_pages?.toString() || '—', icon: '◎', change: '' },
    { label: 'Tendência (30d)', value: `+${stats?.trend_percent || 0}%`, icon: '↑', change: 'crescimento' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="skeleton h-4 w-24 mb-3 rounded" />
              <div className="skeleton h-8 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#AAAAAA] text-sm mb-1">{item.label}</p>
                <p className="text-white text-2xl font-bold">{item.value}</p>
                {item.change && (
                  <p className="text-green-400 text-xs mt-1">{item.change}</p>
                )}
              </div>
              <span className="text-2xl opacity-60">{item.icon}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
