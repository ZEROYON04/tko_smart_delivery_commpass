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

  it("visits another stop instead of waiting outside during a short absence", () => {
    const result = optimizeRoute({
      startTime: new Date("2026-08-04T10:00:00+09:00"),
      stops: [
        {
          id: "temporarily-absent",
          serviceSeconds: 60,
          availableFrom: "2026-08-04T10:10:00+09:00",
          allowWaiting: false,
        },
        { id: "other-delivery", serviceSeconds: 60 },
      ],
      durations: [
        [0, 20, 60],
        [20, 0, 60],
        [60, 600, 0],
      ],
      distances: [
        [0, 100, 500],
        [100, 0, 500],
        [500, 5_000, 0],
      ],
    });

    expect(result.orderedStopIds).toEqual([
      "other-delivery",
      "temporarily-absent",
    ]);
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

  it("uses the scalable time-window-first route for a large delivery run", () => {
    const stopCount = 20;
    const stops = Array.from({ length: stopCount }, (_, index) => ({
      id: `stop-${index + 1}`,
      serviceSeconds: 60,
      preferredFirst: index === 4,
      windowStart:
        index < 10
          ? "2026-08-04T08:00:00+09:00"
          : "2026-08-04T12:00:00+09:00",
      windowEnd:
        index < 10
          ? "2026-08-04T12:00:00+09:00"
          : "2026-08-04T14:00:00+09:00",
    }));
    const matrixSize = stopCount + 1;
    const durations = Array.from({ length: matrixSize }, (_, from) =>
      Array.from({ length: matrixSize }, (_, to) =>
        from === to ? 0 : Math.abs(from - to) * 30,
      ),
    );
    const distances = durations.map((row) =>
      row.map((duration) => duration * 10),
    );

    const result = optimizeRoute({
      startTime: new Date("2026-08-04T08:00:00+09:00"),
      stops,
      durations,
      distances,
    });

    expect(result.orderedStopIds).toHaveLength(20);
    expect(result.orderedStopIds[0]).toBe("stop-5");
    expect(new Set(result.orderedStopIds.slice(0, 10))).toEqual(
      new Set(Array.from({ length: 10 }, (_, index) => `stop-${index + 1}`)),
    );
    expect(result.feasible).toBe(true);
  });
});
