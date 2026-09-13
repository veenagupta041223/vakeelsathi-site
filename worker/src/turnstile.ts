const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  secretKey: string,
  token: unknown,
  remoteIp: string,
): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0) {
    return false;
  }

  const body = new URLSearchParams({ secret: secretKey, response: token, remoteip: remoteIp });
  const res = await fetch(VERIFY_URL, { method: "POST", body });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
