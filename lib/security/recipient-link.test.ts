import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createRecipientAccessQuery,
  verifyRecipientAccess,
} from "./recipient-link";

const originalSecret = process.env.RECIPIENT_LINK_SECRET;

describe("recipient access link", () => {
  beforeEach(() => {
    process.env.RECIPIENT_LINK_SECRET = "test-recipient-link-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.RECIPIENT_LINK_SECRET;
    } else {
      process.env.RECIPIENT_LINK_SECRET = originalSecret;
    }
  });

  it("accepts a valid signed link", () => {
    const now = Date.UTC(2026, 7, 3, 0, 0, 0);
    const query = createRecipientAccessQuery("delivery-1", now);

    expect(
      verifyRecipientAccess({
        deliveryId: "delivery-1",
        expires: query.get("expires"),
        signature: query.get("signature"),
        now,
      }),
    ).toBe(true);
  });

  it("rejects tampering and expired links", () => {
    const now = Date.UTC(2026, 7, 3, 0, 0, 0);
    const query = createRecipientAccessQuery("delivery-1", now);

    expect(
      verifyRecipientAccess({
        deliveryId: "delivery-2",
        expires: query.get("expires"),
        signature: query.get("signature"),
        now,
      }),
    ).toBe(false);
    expect(
      verifyRecipientAccess({
        deliveryId: "delivery-1",
        expires: query.get("expires"),
        signature: query.get("signature"),
        now: now + 37 * 60 * 60 * 1000,
      }),
    ).toBe(false);
  });
});
