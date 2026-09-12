import type { LeadSubmission } from "./validate";
import { sanitizeForEmail } from "./sanitize";

const FROM_ADDRESS = "leads@vakeelsathi.in";
const TO_ADDRESS = "administrator@vakeelsathi.in";

export async function sendLeadNotification(apiKey: string, lead: LeadSubmission): Promise<void> {
  const text = [
    `Name: ${sanitizeForEmail(lead.name)}`,
    `Phone: ${sanitizeForEmail(lead.phone)}`,
    `Service: ${lead.service}`,
    `Message: ${lead.message ? sanitizeForEmail(lead.message) : "(none)"}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
      subject: `New lead: ${lead.service}`,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status}`);
  }
}
