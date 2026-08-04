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

  it("inserts a same-slot redelivery at the fastest feasible position", () => {
    const result = optimizeRoute({
      startTime: new Date("2026-08-04T14:00:00+09:00"),
      stops: [
        {
          id: "same-slot-redelivery",
          serviceSeconds: 60,
          availableFrom: "2026-08-04T14:00:00+09:00",
          windowStart: "2026-08-04T14:00:00+09:00",
          windowEnd: "2026-08-04T14:06:00+09:00",
        },
        { id: "nearby", serviceSeconds: 60 },
        { id: "later", serviceSeconds: 60 },
      ],
      durations: [
        [0, 240, 60, 600],
        [240, 0, 60, 60],
        [60, 60, 0, 600],
        [600, 60, 600, 0],
      ],
      distances: [
        [0, 2_000, 500, 5_000],
        [2_000, 0, 500, 500],
        [500, 500, 0, 5_000],
        [5_000, 500, 5_000, 0],
      ],
    });

    expect(result.orderedStopIds).toEqual([
      "nearby",
      "same-slot-redelivery",
      "later",
    ]);
    expect(result.feasible).toBe(true);
    expect(result.finishedAt).toBe("2026-08-04T05:06:00.000Z");
  });

  it("requires service to finish before the selected time slot ends", () => {
    const result = optimizeRoute({
      startTime: new Date("2026-08-04T14:00:00+09:00"),
      stops: [
        {
          id: "too-late",
          serviceSeconds: 120,
          windowEnd: "2026-08-04T14:02:00+09:00",
        },
      ],
      durations: [
        [0, 60],
        [60, 0],
      ],
      distances: [
        [0, 500],
        [500, 0],
      ],
    });

    expect(result.feasible).toBe(false);
  });
});
