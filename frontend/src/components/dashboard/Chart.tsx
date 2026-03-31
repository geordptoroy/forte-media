import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartData } from '../../types/api.types';

interface ChartProps {
  data?: ChartData[];
  loading?: boolean;
}

export const Chart: React.FC<ChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Evolução dos Anúncios Escalados</CardTitle></CardHeader>
        <CardContent>
          <div className="skeleton h-64 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Evolução dos Anúncios Escalados (30 dias)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#AAAAAA', fontSize: 11 }}
              tickFormatter={v => v.slice(5)}
              axisLine={{ stroke: '#222222' }}
            />
            <YAxis tick={{ fill: '#AAAAAA', fontSize: 11 }} axisLine={{ stroke: '#222222' }} />
            <Tooltip
              contentStyle={{ background: '#111111', border: '1px solid #222222', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ color: '#AAAAAA' }}
            />
            <Line
              type="monotone"
              dataKey="scaled_ads"
              stroke="#2C3E66"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#2C3E66' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
