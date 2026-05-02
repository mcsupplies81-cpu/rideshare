'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DocumentUpload } from '@/components/driver/DocumentUpload'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

export default function DocumentsStep() {
  const r = useRouter()
  const [uploaded, setUploaded] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadState, setUploadState] = useState<Record<string, 'uploading' | 'uploaded' | 'idle'>>({})

  function validateFile(documentType: string, file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((s) => ({ ...s, [documentType]: 'Invalid file type. Use JPG, PNG, or PDF.' }))
      return false
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrors((s) => ({ ...s, [documentType]: 'File too large. Maximum size is 10MB.' }))
      return false
    }
    setErrors((s) => ({ ...s, [documentType]: '' }))
    return true
  }

  const ready = Object.keys(uploaded).length === 3

  return <main className="space-y-4">
    <DocumentUpload label="Driver's License" documentType="license" validateFile={(file) => validateFile('license', file)} onUploadStatusChange={(status) => setUploadState((s) => ({ ...s, license: status }))} onUploaded={(p) => setUploaded((s) => ({ ...s, license: p }))} />
    {errors.license ? <p className="text-sm text-red-300">{errors.license}</p> : <p className="text-xs text-slate-400">{uploadState.license === 'uploading' ? 'uploading...' : uploadState.license === 'uploaded' ? 'uploaded' : ''}</p>}
    <DocumentUpload label="Insurance Card" documentType="insurance" validateFile={(file) => validateFile('insurance', file)} onUploadStatusChange={(status) => setUploadState((s) => ({ ...s, insurance: status }))} onUploaded={(p) => setUploaded((s) => ({ ...s, insurance: p }))} />
    {errors.insurance ? <p className="text-sm text-red-300">{errors.insurance}</p> : <p className="text-xs text-slate-400">{uploadState.insurance === 'uploading' ? 'uploading...' : uploadState.insurance === 'uploaded' ? 'uploaded' : ''}</p>}
    <DocumentUpload label="Vehicle Registration" documentType="registration" validateFile={(file) => validateFile('registration', file)} onUploadStatusChange={(status) => setUploadState((s) => ({ ...s, registration: status }))} onUploaded={(p) => setUploaded((s) => ({ ...s, registration: p }))} />
    {errors.registration ? <p className="text-sm text-red-300">{errors.registration}</p> : <p className="text-xs text-slate-400">{uploadState.registration === 'uploading' ? 'uploading...' : uploadState.registration === 'uploaded' ? 'uploaded' : ''}</p>}
    <button disabled={!ready} onClick={() => { localStorage.setItem('driver_onboarding_step', '4'); r.push('/driver/onboarding') }} className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50">Submit Application</button>
  </main>
}
