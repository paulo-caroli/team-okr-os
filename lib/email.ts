import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || "Team OKR OS <onboarding@resend.dev>"

export async function sendInvitationEmail({
  to,
  teamName,
  inviterName,
  signUpUrl,
}: {
  to: string
  teamName: string
  inviterName: string
  signUpUrl: string
}): Promise<boolean> {
  if (!resend) {
    console.log(
      `[Email] No RESEND_API_KEY configured. Invitation email to ${to} skipped.`
    )
    return false
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${inviterName} invited you to join "${teamName}" on Team OKR OS`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #18181b; margin-bottom: 8px;">
            You've been invited
          </h2>
          <p style="font-size: 15px; color: #52525b; line-height: 1.6; margin-bottom: 24px;">
            <strong>${inviterName}</strong> invited you to join the team
            <strong>"${teamName}"</strong> on Team OKR OS.
          </p>
          <p style="font-size: 15px; color: #52525b; line-height: 1.6; margin-bottom: 32px;">
            Team OKR OS helps teams define clear objectives and track
            measurable results. Create your account to join the team.
          </p>
          <a
            href="${signUpUrl}"
            style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;"
          >
            Create your account
          </a>
          <p style="font-size: 13px; color: #a1a1aa; margin-top: 32px; line-height: 1.5;">
            Once you sign up with this email address (${to}), you'll
            be automatically added to the team.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error("[Email] Failed to send invitation:", error)
    return false
  }
}
