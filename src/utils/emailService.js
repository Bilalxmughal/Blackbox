// src/utils/emailService.js
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwy4C25az1URtJQmIbrsq_lQ1jTra15SgG_RP-P44bvEkFbrSToSrF4ztTzXTN8je96VA/exec'

// ─── Shared Email Wrapper ───────────────────────────────────────────────────
const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI', Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius:16px 16px 0 0; padding: 32px 40px; text-align:center;">
              <div style="display:inline-block; background:rgba(0,212,255,0.15); border:1px solid rgba(0,212,255,0.3); border-radius:50px; padding:8px 20px; margin-bottom:16px;">
                <span style="color:#00d4ff; font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase;">Buscaro Ticket System</span>
              </div>
              <br/>
              <img src="https://ui-avatars.com/api/?name=B+T&background=00d4ff&color=fff&size=48&bold=true&rounded=true" 
                   alt="BTS" style="width:48px; height:48px; border-radius:50%; margin-bottom:8px;" />
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff; padding: 40px 40px 32px; border-left:1px solid #e8ecf0; border-right:1px solid #e8ecf0;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc; border:1px solid #e8ecf0; border-top:none; border-radius:0 0 16px 16px; padding:24px 40px; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#94a3b8;">
                This is an automated notification from <strong style="color:#475569;">Buscaro Ticket System</strong>
              </p>
              <p style="margin:0; font-size:11px; color:#cbd5e1;">
                © ${new Date().getFullYear()} Buscaro · ticket@buscaro.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`

// ─── Mention Email Body ─────────────────────────────────────────────────────
const mentionBody = ({ toName, fromName, commentText, ticketNo, ticketLink }) => `

  <!-- Greeting -->
  <p style="margin:0 0 6px; font-size:22px; font-weight:700; color:#1e293b;">
    Hey ${toName}!
  </p>
  <p style="margin:0 0 28px; font-size:15px; color:#64748b; line-height:1.6;">
    <strong style="color:#1e293b;">${fromName}</strong> mentioned you in a comment on ticket
    <span style="background:#e0f7ff; color:#0284c7; font-weight:600; padding:2px 8px; border-radius:4px; font-family:monospace;">${ticketNo}</span>
  </p>

  <!-- Comment Box -->
  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #00d4ff; border-radius:0 12px 12px 0; padding:20px 24px; margin-bottom:28px;">
    <p style="margin:0 0 8px; font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Comment</p>
    <p style="margin:0; font-size:15px; color:#334155; line-height:1.7;">${commentText}</p>
  </div>

  <!-- CTA Button -->
  <div style="text-align:center; margin-bottom:8px;">
    <a href="${ticketLink}" 
       style="display:inline-block; background:linear-gradient(135deg, #00d4ff, #00b8d9); color:#ffffff; text-decoration:none; 
              font-size:15px; font-weight:600; padding:14px 36px; border-radius:10px; 
              box-shadow: 0 4px 14px rgba(0,212,255,0.35); letter-spacing:0.3px;">
      View Ticket →
    </a>
  </div>
`

// ─── Assign Email Body ──────────────────────────────────────────────────────
const assignBody = ({ toName, fromName, ticketNo, ticketLink, message, type }) => {

  const isReassign = type === 'reassign'
  const icon = isReassign ? '🔄' : '🎫'
  const heading = isReassign ? 'Ticket Reassigned' : 'New Ticket Assigned'
  const badgeColor = isReassign ? '#7c3aed' : '#0284c7'
  const badgeBg = isReassign ? '#ede9fe' : '#e0f7ff'
  const btnColor = isReassign ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #00d4ff, #00b8d9)'
  const btnShadow = isReassign ? 'rgba(124,58,237,0.35)' : 'rgba(0,212,255,0.35)'

  return `
  <!-- Icon + Heading -->
  <div style="text-align:center; margin-bottom:28px;">
    <div style="font-size:40px; margin-bottom:12px;">${icon}</div>
    <h2 style="margin:0 0 6px; font-size:22px; font-weight:700; color:#1e293b;">${heading}</h2>
    <p style="margin:0; font-size:14px; color:#64748b;">From <strong style="color:#1e293b;">${fromName}</strong></p>
  </div>

  <!-- Ticket Badge -->
  <div style="text-align:center; margin-bottom:24px;">
    <span style="display:inline-block; background:${badgeBg}; color:${badgeColor}; font-size:18px; font-weight:700; 
                 padding:10px 24px; border-radius:8px; font-family:monospace; letter-spacing:1px;">
      ${ticketNo}
    </span>
  </div>

  <!-- Message Box -->
  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin-bottom:28px;">
    <p style="margin:0 0 6px; font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Message</p>
    <p style="margin:0; font-size:14px; color:#475569; line-height:1.7;">Hi <strong>${toName}</strong>, ${message}</p>
  </div>

  <!-- CTA Button -->
  <div style="text-align:center; margin-bottom:8px;">
    <a href="${ticketLink}"
       style="display:inline-block; background:${btnColor}; color:#ffffff; text-decoration:none;
              font-size:15px; font-weight:600; padding:14px 36px; border-radius:10px;
              box-shadow: 0 4px 14px ${btnShadow}; letter-spacing:0.3px;">
      Open Ticket →
    </a>
  </div>
`
}

// ─── Send Helper ─────────────────────────────────────────────────────────────
const sendEmail = async (payload) => {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    })
    return await res.json()
  } catch (err) {
    console.error('Email send failed:', err)
    return { success: false, error: err.message }
  }
}

// ─── Public Functions ─────────────────────────────────────────────────────────

export const sendMentionEmail = async ({ toEmail, toName, fromName, commentText, ticketNo, ticketId }) => {
  if (!toEmail) return { success: false, error: 'No email provided' }
  const ticketLink = `${window.location.origin}/complaints/${ticketId}`

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject: ` ${fromName} mentioned you in Ticket ${ticketNo}`,
    message: emailWrapper(mentionBody({ toName, fromName, commentText, ticketNo, ticketLink }))
  })
}

export const sendAssignEmail = async ({ toEmail, toName, fromName, ticketNo, ticketId, message, type = 'assign' }) => {
  if (!toEmail) return { success: false, error: 'No email provided' }
  const ticketLink = `${window.location.origin}/complaints/${ticketId}`
  const subject = type === 'reassign'
    ? `🔄 Ticket ${ticketNo} has been reassigned`
    : `🎫 Ticket ${ticketNo} assigned to you`

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject,
    message: emailWrapper(assignBody({ toName, fromName, ticketNo, ticketLink, message, type }))
  })
}