// Magic-link email delivery.
//
// STUB MODE (default): if process.env.BREVO_API_KEY is not set, sendMagicLink() sends
// nothing and simply resolves with the link so the caller (api/auth/request.js) can hand
// it back in the response as `devLink` for a human to click during development/demo.
//
// REAL MODE (operator env var): once the operator sets BREVO_API_KEY (and optionally
// BREVO_SENDER_EMAIL / BREVO_SENDER_NAME), this posts to Brevo's transactional email API
// and the link is never echoed back in the API response.
//
// The key is read from process.env only — never hard-coded.

'use strict';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * @param {string} email recipient address
 * @param {string} link the magic sign-in link
 * @returns {Promise<{sent: boolean, devLink?: string}>}
 */
async function sendMagicLink(email, link) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    // Stub mode: no email provider configured. No-op, hand the link back to the caller.
    // eslint-disable-next-line no-console
    console.warn('[client-hub] BREVO_API_KEY not set — stub mode, magic link not emailed:', link);
    return { sent: false, devLink: link };
  }

  // --- Real mode: needs operator env vars BREVO_API_KEY (required) and optionally
  // BREVO_SENDER_EMAIL / BREVO_SENDER_NAME (fall back to a generic VOM sender). ---
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@visionoutreachmedia.nl';
  const senderName = process.env.BREVO_SENDER_NAME || 'Client Business Hub';

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject: 'Your sign-in link',
      htmlContent: `<p>Click the link below to sign in to your business hub. This link expires in 15 minutes and can only be used once.</p><p><a href="${link}">${link}</a></p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo send failed: ${res.status} ${body}`);
  }

  return { sent: true };
}

module.exports = { sendMagicLink };
