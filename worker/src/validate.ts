export const SERVICES = [
  "cheque-bounce-notice",
  "legal-notice-money-recovery",
  "reply-to-legal-notice",
  "rent-agreement-drafting",
  "sale-deed-review",
  "property-title-verification",
  "will-drafting",
  "mutual-divorce-petition",
  "employment-contract-offer-letter",
  "co-founder-agreement",
  "startup-incorporation-pvt-ltd",
  "consumer-complaint-filing",
  "e-challan-dispute-filing",
  "other",
] as const;

export type Service = (typeof SERVICES)[number];

export interface LeadSubmission {
  name: string;
  phone: string;
  service: Service;
  message: string | null;
}

export type ValidationResult =
  | { ok: true; data: LeadSubmission }
  | { ok: false; error: string };

const PHONE_RE = /^\d{10}$/;

export function validateSubmission(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid submission." };
  }
  const body = input as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length === 0 || name.length > 100) {
    return { ok: false, error: "Please enter a valid name." };
  }

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "Please enter a valid 10-digit phone number." };
  }

  const service = typeof body.service === "string" ? body.service : "";
  if (!SERVICES.includes(service as Service)) {
    return { ok: false, error: "Please select a service." };
  }

  if (body.consent !== true) {
    return { ok: false, error: "Please accept the Privacy Policy and Terms to continue." };
  }

  const rawMessage = typeof body.message === "string" ? body.message.trim() : "";
  if (rawMessage.length > 2000) {
    return { ok: false, error: "Please shorten your message." };
  }
  if (service === "other" && rawMessage.length === 0) {
    return { ok: false, error: "Please describe your issue so we know how to help." };
  }
  const message = rawMessage.length > 0 ? rawMessage : null;

  return {
    ok: true,
    data: { name, phone, service: service as Service, message },
  };
}

export function isHoneypotFilled(hp: unknown): boolean {
  return typeof hp === "string" && hp.trim().length > 0;
}
