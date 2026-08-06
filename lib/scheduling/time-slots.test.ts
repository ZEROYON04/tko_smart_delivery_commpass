import { describe, expect, it } from "vitest";
import {
  getCarrierTimeSlots,
  resolveReattemptWindow,
  resolveRequestedDeliveryWindow,
} from "./time-slots";

describe("carrier delivery time slots", () => {
  it("exposes the official slot count for each carrier", () => {
    expect(getCarrierTimeSlots("yamato")).toHaveLength(5);
    expect(getCarrierTimeSlots("sagawa")).toHaveLength(7);
    expect(getCarrierTimeSlots("japan_post")).toHaveLength(6);
  });

  it("keeps a reattempt in the current slot when the recipient returns in time", () => {
    const result = resolveReattemptWindow({
      deliveryDate: "2026-08-03",
      carrier: "yamato",
      currentWindowCode: "morning",
      returnAt: new Date("2026-08-03T10:30:00+09:00"),
    });

    expect(result.code).toBe("morning");
    expect(result.availableFrom.toISOString()).toBe("2026-08-03T01:30:00.000Z");
    expect(result.movedToNextDay).toBe(false);
  });

  it("moves the reattempt to the next carrier slot when the current slot has ended", () => {
    const result = resolveReattemptWindow({
      deliveryDate: "2026-08-03",
      carrier: "yamato",
      currentWindowCode: "morning",
      returnAt: new Date("2026-08-03T12:30:00+09:00"),
    });

    expect(result.code).toBe("14-16");
    expect(result.availableFrom.toISOString()).toBe("2026-08-03T05:00:00.000Z");
  });

  it("rolls to the following day after the carrier's final slot", () => {
    const result = resolveReattemptWindow({
      deliveryDate: "2026-08-03",
      carrier: "japan_post",
      currentWindowCode: "19-21",
      returnAt: new Date("2026-08-03T21:30:00+09:00"),
    });

    expect(result.code).toBe("morning");
    expect(result.start.toISOString()).toBe("2026-08-03T23:00:00.000Z");
    expect(result.movedToNextDay).toBe(true);
  });
});

describe("recipient-requested delivery window", () => {
  it("keeps the exact date and carrier slot selected by the recipient", () => {
    const result = resolveRequestedDeliveryWindow({
      deliveryDate: "2026-08-06",
      carrier: "sagawa",
      windowCode: "18-21",
      now: new Date("2026-08-04T10:00:00+09:00"),
    });

    expect(result.deliveryDate).toBe("2026-08-06");
    expect(result.code).toBe("18-21");
    expect(result.start.toISOString()).toBe("2026-08-06T09:00:00.000Z");
    expect(result.availableFrom.toISOString()).toBe("2026-08-06T09:00:00.000Z");
  });

  it("rejects a delivery window that has already ended", () => {
    expect(() =>
      resolveRequestedDeliveryWindow({
        deliveryDate: "2026-08-03",
        carrier: "yamato",
        windowCode: "19-21",
        now: new Date("2026-08-04T10:00:00+09:00"),
      }),
    ).toThrow("PAST_DELIVERY_WINDOW");
  });
});
