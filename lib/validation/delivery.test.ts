import { describe, expect, it } from "vitest";
import {
  deliveryDateRequestSchema,
  deliveryMethodRequestSchema,
} from "./delivery";

describe("delivery method validation", () => {
  it("accepts a supported dropoff location", () => {
    expect(
      deliveryMethodRequestSchema.safeParse({
        method: "dropoff",
        dropoffLocation: "delivery_box",
        version: 2,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown dropoff location", () => {
    expect(
      deliveryMethodRequestSchema.safeParse({
        method: "dropoff",
        dropoffLocation: "garden",
        version: 2,
      }).success,
    ).toBe(false);
  });
});

describe("delivery date validation", () => {
  it("accepts a real ISO date", () => {
    expect(
      deliveryDateRequestSchema.safeParse({ deliveryDate: "2026-08-04" })
        .success,
    ).toBe(true);
  });

  it("rejects an impossible calendar date", () => {
    expect(
      deliveryDateRequestSchema.safeParse({ deliveryDate: "2026-02-30" })
        .success,
    ).toBe(false);
  });
});
