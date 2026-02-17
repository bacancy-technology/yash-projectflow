type SendEmailResult =
  | { sent: true }
  | { sent: false; error: string }

function requireEnv(name: string): string | null {
  const value = process.env[name]
  if (!value) return null
  return value
}

export async function sendOrgInviteEmail({
  to,
  orgName,
  role,
  inviteUrl,
  inviterName,
}: {
  to: string
  orgName: string
  role: string
  inviteUrl: string
  inviterName?: string | null
}): Promise<SendEmailResult> {
  const apiKey = requireEnv('RESEND_API_KEY')
  if (!apiKey) {
    return {
      sent: false,
      error:
        'RESEND_API_KEY is not set. Configure Resend to send invite emails.',
    }
  }

  const from =
    requireEnv('INVITE_FROM_EMAIL') ??
    requireEnv('RESEND_FROM_EMAIL') ??
    'ProjectFlow <onboarding@resend.dev>'

  const subject = `You’re invited to join ${orgName} on ProjectFlow`
  const safeInviter = inviterName?.trim() ? inviterName.trim() : 'A teammate'

  const text = `${safeInviter} invited you to join ${orgName} as ${role} on ProjectFlow.\n\nAccept invite: ${inviteUrl}\n\nIf you didn’t expect this, you can ignore this email.`

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5">
      <h2 style="margin:0 0 12px">Join ${escapeHtml(orgName)} on ProjectFlow</h2>
      <p style="margin:0 0 12px">${escapeHtml(
        safeInviter
      )} invited you to join <strong>${escapeHtml(
        orgName
      )}</strong> as <strong>${escapeHtml(role)}</strong>.</p>
      <p style="margin:16px 0">
        <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">
          Accept invite
        </a>
      </p>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">If you didn’t expect this invite, you can ignore this email.</p>
    </div>
  `.trim()

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
    })

    if (!res.ok) {
      const body = await safeReadBody(res)
      return {
        sent: false,
        error: `Resend error (${res.status}): ${body || res.statusText}`,
      }
    }

    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function safeReadBody(res: Response) {
  try {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as unknown
      if (json && typeof json === 'object' && 'message' in json) {
        const message = (json as { message?: unknown }).message
        if (typeof message === 'string') return message
      }
      return JSON.stringify(json)
    }
    return await res.text()
  } catch {
    return ''
  }
}

