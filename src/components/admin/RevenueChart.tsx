'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type RevenuePoint = {
  date: string
  revenue: number
  payouts: number
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-80 w-full rounded-xl border border-slate-800 bg-[#1A1A2E] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 12 }} />
          <YAxis
            stroke="#94A3B8"
            tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => `$${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
          />
          <Legend />
          <Area type="monotone" dataKey="revenue" stroke="#7B5EA7" fill="#7B5EA7" fillOpacity={0.25} name="Revenue" />
          <Area type="monotone" dataKey="payouts" stroke="#64748B" fill="#64748B" fillOpacity={0.2} name="Payouts" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
