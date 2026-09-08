'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function DashboardChart({ data, color = '#0f766e' }: { data: { date: string; count: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(v) => `Date: ${v}`}
        />
        <Area type="monotone" dataKey="count" stroke={color} fill={`url(#fill-${color.replace('#', '')})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
