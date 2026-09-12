import { isHoneypotFilled, validateSubmission } from "./validate";
import { sendLeadNotification } from "./notify";

export interface Env {
  DB: D1Database;
  RATE_LIMITER: RateLimit;
  ALLOWED_ORIGIN: string;
  RESEND_API_KEY: string;
}

function corsHeaders(origin: string, allowedOrigin: string): HeadersInit {
  if (origin !== allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body: unknown, status: number, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    if (url.pathname !== "/submit") {
      return json({ ok: false, error: "Not found." }, 404, cors);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed." }, 405, cors);
    }

    if (origin !== env.ALLOWED_ORIGIN) {
      return json({ ok: false, error: "Origin not allowed." }, 403);
    }

    try {
      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success: withinLimit } = await env.RATE_LIMITER.limit({ key: ip });
      if (!withinLimit) {
        return json({ ok: false, error: "Too many requests. Please try again later." }, 429, cors);
      }
    } catch (error) {
      console.error("rate limiter failed:", error);
      return json({ ok: false, error: "Something went wrong. Please try again." }, 500, cors);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid request body." }, 400, cors);
    }

    const body = (payload ?? {}) as Record<string, unknown>;

    if (isHoneypotFilled(body.hp)) {
      // Pretend success so bots don't learn they were caught.
      return json({ ok: true }, 200, cors);
    }

    const result = validateSubmission(body);
    if (!result.ok) {
      return json({ ok: false, error: result.error }, 400, cors);
    }

    try {
      const { name, phone, service, message } = result.data;
      await env.DB.prepare(
        `INSERT INTO leads (name, phone, service, message, consent, user_agent)
         VALUES (?, ?, ?, ?, 1, ?)`,
      )
        .bind(name, phone, service, message, request.headers.get("User-Agent") ?? null)
        .run();
    } catch (error) {
      // D1 outage: fail with a clean, CORS-visible response instead of an
      // unhandled exception the browser can't even read (no CORS headers).
      console.error("D1 insert failed:", error);
      return json({ ok: false, error: "Something went wrong. Please try again." }, 500, cors);
    }

    try {
      await sendLeadNotification(env.RESEND_API_KEY, result.data);
    } catch (error) {
      // Best-effort: the lead is already stored in D1, so a notification
      // failure (e.g. Resend misconfigured) must not fail the request.
      console.error("lead notification failed:", error);
    }

    return json({ ok: true }, 200, cors);
  },
};
