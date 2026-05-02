'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#0F0F1A] p-6 text-white">
        <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#1A1A2E] p-6">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-300">{error.message || 'Unexpected error occurred.'}</p>
          <button onClick={() => reset()} className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-500">Try again</button>
        </div>
      </body>
    </html>
  )
}
