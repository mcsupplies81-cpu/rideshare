import type { ReactNode } from 'react'

type MetricCardProps = {
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
}

export function MetricCard({ label, value, subtitle, trend, icon }: MetricCardProps) {
  const trendNode: ReactNode = trend
    ? trend === 'up'
      ? '↗'
      : trend === 'down'
        ? '↘'
        : '→'
    : null

  return (
    <div className="rounded-2xl bg-[#1A1A2E] p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-4xl font-bold leading-none">{value}</p>
          <p className="mt-2 text-sm text-slate-300">{label}</p>
        </div>
        {icon ? <span className="text-xl text-purple-300">{icon}</span> : null}
      </div>
      {subtitle ? <p className="mt-3 text-xs text-slate-400">{subtitle}</p> : null}
      {trend ? (
        <p
          className={`mt-2 text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-300'}`}
        >
          {trendNode}
        </p>
      ) : null}
    </div>
  )
}
