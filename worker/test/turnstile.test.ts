import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "../src/turnstile";

describe("verifyTurnstile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false without calling the API when the token is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await verifyTurnstile("secret", undefined, "1.2.3.4")).toBe(false);
    expect(await verifyTurnstile("secret", "", "1.2.3.4")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the token and secret to Cloudflare's siteverify endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const passed = await verifyTurnstile("test-secret", "test-token", "1.2.3.4");

    expect(passed).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const params = new URLSearchParams(init.body);
    expect(params.get("secret")).toBe("test-secret");
    expect(params.get("response")).toBe("test-token");
    expect(params.get("remoteip")).toBe("1.2.3.4");
  });

  it("returns false when Cloudflare rejects the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 })),
    );

    expect(await verifyTurnstile("secret", "bad-token", "1.2.3.4")).toBe(false);
  });
});
