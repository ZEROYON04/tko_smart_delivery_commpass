import { describe, expect, it } from "vitest";
import {
  deliveryDateRequestSchema,
  deliveryMethodRequestSchema,
  deliveryWindowRequestSchema,
  reattemptRequestSchema,
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

describe("recipient delivery schedule validation", () => {
  it("accepts an exact redelivery date and time slot", () => {
    expect(
      reattemptRequestSchema.safeParse({
        deliveryDate: "2026-08-06",
        windowCode: "14-16",
        version: 3,
      }).success,
    ).toBe(true);
  });

  it("requires a date when changing the delivery window", () => {
    expect(
      deliveryWindowRequestSchema.safeParse({
        windowCode: "14-16",
        version: 3,
      }).success,
    ).toBe(false);
  });
});
