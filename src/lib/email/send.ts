import { getResend, FROM } from './client'

interface SendOpts {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: SendOpts) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await getResend().emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html })
  } catch (err) {
    console.error('[email] send failed', { to: opts.to, subject: opts.subject, err })
  }
}
