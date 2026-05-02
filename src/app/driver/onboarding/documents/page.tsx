'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DocumentUpload } from '@/components/driver/DocumentUpload'
export default function DocumentsStep(){const r=useRouter(); const [uploaded,setUploaded]=useState<Record<string,string>>({}); const ready=Object.keys(uploaded).length===3; return <main className="space-y-4"><DocumentUpload label="Driver's License" documentType="license" onUploaded={(p)=>setUploaded((s)=>({...s,license:p}))}/><DocumentUpload label="Insurance Card" documentType="insurance" onUploaded={(p)=>setUploaded((s)=>({...s,insurance:p}))}/><DocumentUpload label="Vehicle Registration" documentType="registration" onUploaded={(p)=>setUploaded((s)=>({...s,registration:p}))}/><button disabled={!ready} onClick={()=>{localStorage.setItem('driver_onboarding_step','4'); r.push('/driver/onboarding')}} className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50">Submit Application</button></main> }
