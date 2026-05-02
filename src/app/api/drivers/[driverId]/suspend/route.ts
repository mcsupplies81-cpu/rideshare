import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'
import { sendEmail } from '@/lib/email/send'
import { driverRejected } from '@/lib/email/templates'

export async function POST(_: Request, { params }: { params: Promise<{ driverId: string }> }) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const { driverId } = await params
  const supabase = await createServiceClient() as any
  await supabase.from('drivers').update({ approval_status: 'suspended', is_online: false }).eq('id', driverId)

  const { data: user } = await supabase.from('users').select('email,full_name').eq('id', driverId).single()
  if (user?.email) {
    void sendEmail({ to: user.email, ...driverRejected({ driverName: user.full_name ?? 'there' }) })
  }

  return NextResponse.json({ success: true })
}
