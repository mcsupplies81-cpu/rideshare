'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type EarningsChartPoint = {
  date: string
  amount: number
}

export default function EarningsChart({ data }: { data: EarningsChartPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.amount, 0)

  return (
    <section className="rounded-xl border border-[#2A2540] bg-[#121024] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Last 30 Days</h2>
        <p className="text-sm text-[#C6B2E5]">Total: ${total.toFixed(2)}</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) =>
                new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })
              }
              stroke="#8D7AB3"
            />
            <YAxis stroke="#8D7AB3" tickFormatter={(value: number) => `$${value}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1630', border: '1px solid #2A2540', color: '#fff' }}
              formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Earnings']}
              labelFormatter={(label) =>
                new Date(`${String(label)}T00:00:00Z`).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })
              }
            />
            <Area type="monotone" dataKey="amount" stroke="#C6B2E5" fill="#7B5EA7" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
