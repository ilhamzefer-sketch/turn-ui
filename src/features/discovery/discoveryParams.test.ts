import { describe, expect, it } from "vitest";

import { readDiscoveryParams, withPage } from "./discoveryParams";

describe("discovery params", () => {
  it("keeps only bounded public search values", () => {
    const params = new URLSearchParams({
      q: " saç kəsimi ",
      categoryId: "3",
      city: "Bakı",
      district: "Nəsimi",
      mode: "PLANNED_BOOKING",
      page: "2",
    });

    expect(readDiscoveryParams(params)).toEqual({
      q: "saç kəsimi",
      categoryId: 3,
      city: "Bakı",
      district: "Nəsimi",
      mode: "PLANNED_BOOKING",
      page: 2,
      size: 12,
    });
  });

  it("drops invalid identifiers, modes, and negative pages", () => {
    const params = new URLSearchParams({ categoryId: "nope", mode: "BOTH", page: "-4" });
    expect(readDiscoveryParams(params)).toEqual({
      q: undefined,
      categoryId: undefined,
      city: undefined,
      district: undefined,
      mode: undefined,
      page: 0,
      size: 12,
    });
  });

  it("changes only the pagination value", () => {
    const params = new URLSearchParams({ q: "Leyla", mode: "LIVE_QUEUE", page: "3" });
    expect(withPage(params, 1)).toBe("?q=Leyla&mode=LIVE_QUEUE&page=1");
    expect(withPage(params, 0)).toBe("?q=Leyla&mode=LIVE_QUEUE");
  });
});
