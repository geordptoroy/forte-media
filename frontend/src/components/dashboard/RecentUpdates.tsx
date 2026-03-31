import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Ad } from '../../types/api.types';
import { getScoreBadgeColor, formatSpendRange } from '../../lib/utils';

interface RecentUpdatesProps {
  ads?: Ad[];
  loading?: boolean;
}

export const RecentUpdates: React.FC<RecentUpdatesProps> = ({ ads, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Últimas Atualizações</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-14 rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Últimas Atualizações</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {ads?.map(ad => (
          <div key={ad.id} className="flex items-center gap-3 p-3 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a]">
            <img
              src={ad.creative_url}
              alt={ad.page_name}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/48/48'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{ad.page_name}</p>
              <p className="text-[#AAAAAA] text-xs">{formatSpendRange(ad.spend_range)}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getScoreBadgeColor(ad.score)}`}>
              {ad.score}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
