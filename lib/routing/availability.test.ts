import { describe, expect, it } from "vitest";
import { latestAvailability } from "./availability";

describe("latestAvailability", () => {
  it("uses a temporary absence end time when it is later", () => {
    expect(
      latestAvailability(
        "2026-08-04T05:00:00.000Z",
        "2026-08-04T05:10:00.000Z",
      ),
    ).toBe("2026-08-04T05:10:00.000Z");
  });

  it("keeps an existing later availability constraint", () => {
    expect(
      latestAvailability(
        "2026-08-04T05:30:00.000Z",
        "2026-08-04T05:10:00.000Z",
      ),
    ).toBe("2026-08-04T05:30:00.000Z");
  });

  it("returns null when neither constraint is set", () => {
    expect(latestAvailability(null, null)).toBeNull();
  });
});
