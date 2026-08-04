import { describe, expect, it } from "vitest";
import { assessWindowFeasibility } from "./window-feasibility";

describe("assessWindowFeasibility", () => {
  it("accepts a temporary absence when service still finishes in the slot", () => {
    const result = assessWindowFeasibility({
      estimatedArrival: "2026-08-04T14:35:00+09:00",
      unavailableUntil: "2026-08-04T14:30:00+09:00",
      serviceSeconds: 300,
      windowEnd: "2026-08-04T16:00:00+09:00",
    });

    expect(result.canCompleteWithinWindow).toBe(true);
    expect(result.serviceEnd).toBe("2026-08-04T05:40:00.000Z");
  });

  it("rejects a temporary absence when service would end after the slot", () => {
    const result = assessWindowFeasibility({
      estimatedArrival: "2026-08-04T15:58:00+09:00",
      unavailableUntil: "2026-08-04T15:55:00+09:00",
      serviceSeconds: 300,
      windowEnd: "2026-08-04T16:00:00+09:00",
    });

    expect(result.canCompleteWithinWindow).toBe(false);
  });

  it("treats a missing ETA or delivery window as needing manual rescheduling", () => {
    expect(
      assessWindowFeasibility({
        estimatedArrival: null,
        serviceSeconds: 300,
        windowEnd: "2026-08-04T16:00:00+09:00",
      }).canCompleteWithinWindow,
    ).toBe(false);
  });
});
