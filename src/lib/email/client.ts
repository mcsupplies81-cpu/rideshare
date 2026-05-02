import { Resend } from 'resend'

let _resend: Resend | null = null
export function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}
export const FROM = 'Moove <noreply@moove.app>'
