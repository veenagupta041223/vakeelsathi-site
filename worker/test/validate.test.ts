import { describe, expect, it } from "vitest";
import { isHoneypotFilled, validateSubmission } from "../src/validate";

const validPayload = {
  name: "Asha Verma",
  phone: "9876543210",
  service: "mutual-divorce-petition",
  message: "Need help with a custody matter.",
  consent: true,
  hp: "",
};

describe("validateSubmission", () => {
  it("accepts a fully valid payload", () => {
    const result = validateSubmission(validPayload);
    expect(result.ok).toBe(true);
  });

  it("accepts a payload with no message (optional field)", () => {
    const { message, ...rest } = validPayload;
    const result = validateSubmission(rest);
    expect(result.ok).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = validateSubmission({ ...validPayload, name: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    const result = validateSubmission({ ...validPayload, name: "a".repeat(101) });
    expect(result.ok).toBe(false);
  });

  it.each(["987654321", "98765432100", "98765-4321-0", "98765432ab"])(
    "rejects a malformed phone number: %s",
    (phone) => {
      const result = validateSubmission({ ...validPayload, phone });
      expect(result.ok).toBe(false);
    },
  );

  it("rejects a service outside the allowed enum", () => {
    const result = validateSubmission({ ...validPayload, service: "immigration" });
    expect(result.ok).toBe(false);
  });

  it("rejects when consent is false", () => {
    const result = validateSubmission({ ...validPayload, consent: false });
    expect(result.ok).toBe(false);
  });

  it("rejects when consent is missing", () => {
    const { consent, ...rest } = validPayload;
    const result = validateSubmission(rest);
    expect(result.ok).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    const result = validateSubmission({ ...validPayload, message: "a".repeat(2001) });
    expect(result.ok).toBe(false);
  });

  it("accepts a message at exactly 2000 characters", () => {
    const result = validateSubmission({ ...validPayload, message: "a".repeat(2000) });
    expect(result.ok).toBe(true);
  });

  it("rejects service 'other' with no message", () => {
    const result = validateSubmission({ ...validPayload, service: "other", message: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects service 'other' with a whitespace-only message", () => {
    const result = validateSubmission({ ...validPayload, service: "other", message: "   " });
    expect(result.ok).toBe(false);
  });

  it("accepts service 'other' when a message is provided", () => {
    const result = validateSubmission({ ...validPayload, service: "other", message: "Need help with a landlord dispute." });
    expect(result.ok).toBe(true);
  });
});

describe("isHoneypotFilled", () => {
  it("is false for an empty or missing honeypot value", () => {
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
  });

  it("is true for any non-empty honeypot value", () => {
    expect(isHoneypotFilled("http://spam.example")).toBe(true);
  });
});
