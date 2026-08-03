import { describe, expect, it } from "vitest";
import { calculateEtas, type EtaStopInput } from "./calculate-eta";

const baseTime = new Date("2026-08-03T00:00:00.000Z");

function createStops(serviceSeconds = 300): EtaStopInput[] {
  return [
    { stopOrder: 1, durationSeconds: 600, serviceSeconds },
    { stopOrder: 2, durationSeconds: 600, serviceSeconds: 300 },
    { stopOrder: 3, durationSeconds: 600, serviceSeconds: 300 },
  ];
}

describe("calculateEtas", () => {
  it("対面受取を置き配へ変えると後続ETAが290秒早まる", () => {
    const handoff = calculateEtas(baseTime, createStops(300));
    const dropoff = calculateEtas(baseTime, createStops(10));

    const difference =
      new Date(handoff[1].estimatedArrival).getTime() -
      new Date(dropoff[1].estimatedArrival).getTime();

    expect(difference).toBe(290_000);
  });

  it("受取方法を変えても配送順を維持する", () => {
    const result = calculateEtas(baseTime, createStops(10));

    expect(result.map((stop) => stop.stopOrder)).toEqual([1, 2, 3]);
  });

  it("複数の置き配による短縮時間を後続ETAへ累積する", () => {
    const handoff = calculateEtas(baseTime, createStops(300));
    const twoDropoffs = calculateEtas(baseTime, [
      { stopOrder: 1, durationSeconds: 600, serviceSeconds: 10 },
      { stopOrder: 2, durationSeconds: 600, serviceSeconds: 10 },
      { stopOrder: 3, durationSeconds: 600, serviceSeconds: 300 },
    ]);

    const difference =
      new Date(handoff[2].estimatedArrival).getTime() -
      new Date(twoDropoffs[2].estimatedArrival).getTime();

    expect(difference).toBe(580_000);
  });

  it("配達完了済み地点のETAを保持する", () => {
    const recordedArrival = "2026-08-03T00:08:00.000Z";
    const result = calculateEtas(baseTime, [
      {
        stopOrder: 1,
        durationSeconds: 600,
        serviceSeconds: 300,
        status: "delivered",
        estimatedArrival: recordedArrival,
      },
      { stopOrder: 2, durationSeconds: 600, serviceSeconds: 300 },
    ]);

    expect(result[0].estimatedArrival).toBe(recordedArrival);
  });
});
