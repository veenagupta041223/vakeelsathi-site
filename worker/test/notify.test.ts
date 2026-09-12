import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeForEmail } from "../src/sanitize";
import { sendLeadNotification } from "../src/notify";

describe("sanitizeForEmail", () => {
  it("strips CR/LF so a field can't inject extra lines into the email body", () => {
    expect(sanitizeForEmail("Asha\r\nBcc: attacker@evil.example")).toBe(
      "Asha Bcc: attacker@evil.example",
    );
  });

  it("strips other control characters", () => {
    expect(sanitizeForEmail("hi\x00\x07there")).toBe("hi there");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeForEmail("  hello  ")).toBe("hello");
  });

  it("caps length at 2000 characters", () => {
    expect(sanitizeForEmail("a".repeat(3000)).length).toBe(2000);
  });
});

describe("sendLeadNotification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lead = {
    name: "Asha Verma",
    phone: "9876543210",
    service: "mutual-divorce-petition" as const,
    message: "Need help with a custody matter.",
  };

  it("posts to Resend with the API key and lead details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendLeadNotification("test-key", lead);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.to).toBe("administrator@vakeelsathi.in");
    expect(body.text).toContain("Asha Verma");
  });

  it("throws when Resend responds with a non-2xx status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(sendLeadNotification("bad-key", lead)).rejects.toThrow();
  });
});
