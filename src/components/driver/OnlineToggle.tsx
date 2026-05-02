'use client'

type Props = { isOnline: boolean; onChange: (v: boolean) => void; disabled?: boolean; loading?: boolean }

export function OnlineToggle({ isOnline, onChange, disabled, loading }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={() => onChange(!isOnline)}
      className={`w-full rounded-xl p-6 text-lg font-semibold text-white transition ${
        isOnline ? 'bg-green-600' : 'bg-gray-500'
      } disabled:opacity-60`}
    >
      <span className="flex items-center justify-center gap-3">
        <span className={`h-3 w-3 rounded-full bg-white ${isOnline ? 'animate-pulse' : ''}`} />
        {loading ? 'Updating...' : isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </button>
  )
}
