import { describe, expect, it } from "vitest";
import { isEtaWithin24Hours } from "./delivery";

const now = new Date("2026-08-04T03:00:00.000Z").getTime();

describe("isEtaWithin24Hours", () => {
  it("24時間以内の到着予定時刻を表示対象にする", () => {
    expect(isEtaWithin24Hours("2026-08-05T03:00:00.000Z", now)).toBe(true);
  });

  it("24時間より先の到着予定時刻を非表示にする", () => {
    expect(isEtaWithin24Hours("2026-08-05T03:00:00.001Z", now)).toBe(false);
  });

  it("未計算または不正な到着予定時刻を非表示にする", () => {
    expect(isEtaWithin24Hours(null, now)).toBe(false);
    expect(isEtaWithin24Hours("invalid", now)).toBe(false);
  });
});
