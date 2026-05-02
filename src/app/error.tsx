'use client'

export default function Error({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"><div className="max-w-md rounded-2xl bg-[#1A1A2E] p-8 text-center"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-slate-300">An unexpected error occurred.</p><button onClick={() => unstable_retry()} className="mt-4 rounded bg-purple-600 px-4 py-2">Retry</button></div></div>
}
