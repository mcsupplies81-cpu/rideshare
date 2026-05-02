'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = { label: string; documentType: string; onUploaded: (path: string) => void }

export function DocumentUpload({ label, documentType, onUploaded }: Props) {
  const [status, setStatus] = useState<'pending' | 'uploading' | 'uploaded'>('pending')
  const [preview, setPreview] = useState<string | null>(null)

  async function upload(file: File) {
    const supabase = createClient()
    setStatus('uploading')
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return
    const path = `${userId}/${documentType}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('driver-documents').upload(path, file)
    if (error) {
      setStatus('pending')
      return
    }
    await fetch('/api/drivers/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document_type: documentType, storage_path: path }) })
    setStatus('uploaded')
    onUploaded(path)
  }

  return <div className="rounded-lg border p-4"><p className="font-medium">{label}</p><input type="file" accept="image/*,application/pdf" onChange={(e)=>{const f=e.target.files?.[0]; if(!f) return; if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f)); void upload(f)}}/>{preview && <img src={preview} alt={label} className="mt-2 h-24 w-24 object-cover"/>}<p className="mt-2 text-sm">Status: {status}</p></div>
}
