import Link from 'next/link'

export default function NotFound() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"><div className="rounded-2xl bg-[#1A1A2E] p-8 text-center"><p className="text-sm uppercase tracking-widest text-purple-300">Rideo</p><h1 className="mt-2 text-3xl font-bold">Page not found</h1><Link href="/" className="mt-5 inline-block rounded bg-purple-600 px-4 py-2">Back to home</Link></div></div>
}
