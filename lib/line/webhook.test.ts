import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { extractCustomerCode, verifyLineSignature } from "./webhook";

describe("LINE webhook", () => {
  it("accepts a valid LINE signature", () => {
    const body = JSON.stringify({ events: [] });
    const secret = "test-channel-secret";
    const signature = createHmac("sha256", secret)
      .update(body)
      .digest("base64");

    expect(verifyLineSignature(body, signature, secret)).toBe(true);
    expect(verifyLineSignature(body, "invalid", secret)).toBe(false);
  });

  it.each([
    ["初回連携 USER-A", "USER-A"],
    ["初回連携 user-b", "USER-B"],
    ["連携 MOCK-0003", null],
  ])("extracts a tracking number from %s", (text, expected) => {
    expect(extractCustomerCode(text)).toBe(expected);
  });
});
