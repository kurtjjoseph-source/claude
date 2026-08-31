/**
 * Outbound email. Configured with a Resend API key, invitations are delivered
 * by mail; without one the invitation still exists and the admin screen shows a
 * link to pass on by hand, so the site is usable with no mail provider at all.
 */
export type MailResult = { delivered: boolean; error?: string };

export async function sendMail(opts: {
  to: string; subject: string; html: string; text: string;
}): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    return { delivered: false, error: "Geen e-mailprovider ingesteld (RESEND_API_KEY / MAIL_FROM)." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject,
                             html: opts.html, text: opts.text }),
    });
    if (!res.ok) return { delivered: false, error: `Resend ${res.status}: ${await res.text()}` };
    return { delivered: true };
  } catch (err) {
    return { delivered: false, error: String(err) };
  }
}

export function invitationEmail(opts: { name: string; url: string; inviter: string }) {
  const text = [
    `Beste ${opts.name || "student"},`,
    ``,
    `${opts.inviter} nodigt je uit voor het studieplatform voor het Exhorter licentie-examen`,
    `van de Church of God.`,
    ``,
    `Maak je account aan via deze link:`,
    opts.url,
    ``,
    `De link is 14 dagen geldig.`,
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#1c1c22">
      <p>Beste ${opts.name || "student"},</p>
      <p><strong>${opts.inviter}</strong> nodigt je uit voor het studieplatform voor het
         Exhorter licentie-examen van de Church of God.</p>
      <p><a href="${opts.url}"
            style="display:inline-block;background:#2f4f9b;color:#fff;padding:10px 18px;
                   border-radius:6px;text-decoration:none">Account aanmaken</a></p>
      <p style="color:#666;font-size:13px">Of kopieer deze link: ${opts.url}<br>
         De link is 14 dagen geldig.</p>
    </div>`;
  return { text, html };
}
