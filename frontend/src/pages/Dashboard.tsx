import React from 'react';
import { StatsCards } from '../components/dashboard/StatsCards';
import { Chart } from '../components/dashboard/Chart';
import { RecentUpdates } from '../components/dashboard/RecentUpdates';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useDashboardStats, useDashboardChart, useTopAdvertisers, useRecentAds } from '../hooks/useAds';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart();
  const { data: topAds, isLoading: topLoading } = useTopAdvertisers();
  const { data: recentAds, isLoading: recentLoading } = useRecentAds();

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} loading={statsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Chart data={chartData} loading={chartLoading} />
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle>Top 5 Anunciantes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topLoading ? (
                [1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-8 rounded" />)
              ) : (
                topAds?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#0d0d0d] rounded-lg">
                    <span className="text-white text-sm truncate">{item.name}</span>
                    <span className="text-[#2C3E66] font-bold text-sm">{item.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentUpdates ads={recentAds} loading={recentLoading} />
    </div>
  );
};
