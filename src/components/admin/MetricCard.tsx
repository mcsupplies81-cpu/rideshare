import type { ReactNode } from 'react'

type MetricCardProps = {
  label: string
  value: string | number
  trend?: string
  trendPositive?: boolean
}

export function MetricCard({ label, value, trend, trendPositive }: MetricCardProps) {
  const trendIcon: ReactNode = trend ? (trendPositive ? '↗' : '↘') : null

  return (
    <div className="rounded-xl border border-purple-900/40 bg-[#1A1A2E] p-4 text-white shadow-lg">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {trend ? (
        <p className={`mt-2 text-xs ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trendIcon} {trend}
        </p>
      ) : null}
    </div>
  )
}
