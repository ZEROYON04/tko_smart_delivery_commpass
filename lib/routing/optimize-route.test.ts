import { describe, expect, it } from "vitest";
import { optimizeRoute } from "./optimize-route";

describe("optimizeRoute", () => {
  it("uses travel time before a recipient becomes available", () => {
    const result = optimizeRoute({
      startTime: new Date("2026-08-03T10:00:00+09:00"),
      stops: [
        {
          id: "reattempt",
          serviceSeconds: 300,
          availableFrom: "2026-08-03T10:30:00+09:00",
          windowStart: "2026-08-03T10:00:00+09:00",
          windowEnd: "2026-08-03T12:00:00+09:00",
        },
        { id: "nearby", serviceSeconds: 300 },
      ],
      durations: [
        [0, 60, 60],
        [60, 0, 60],
        [60, 60, 0],
      ],
      distances: [
        [0, 500, 500],
        [500, 0, 500],
        [500, 500, 0],
      ],
    });

    expect(result.orderedStopIds).toEqual(["nearby", "reattempt"]);
    expect(result.feasible).toBe(true);
  });

  it("rejects orders that miss a delivery window", () => {
    const result = optimizeRoute({
      startTime: new Date("2026-08-03T10:00:00+09:00"),
      stops: [
        {
          id: "urgent",
          serviceSeconds: 60,
          windowEnd: "2026-08-03T10:03:00+09:00",
        },
        { id: "flexible", serviceSeconds: 300 },
      ],
      durations: [
        [0, 60, 60],
        [60, 0, 180],
        [60, 180, 0],
      ],
      distances: [
        [0, 500, 500],
        [500, 0, 1_500],
        [500, 1_500, 0],
      ],
    });

    expect(result.orderedStopIds[0]).toBe("urgent");
    expect(result.feasible).toBe(true);
  });
});
