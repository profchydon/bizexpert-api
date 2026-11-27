import { nextBusinessSlug, slugifyBusinessName } from "./business-slug";

describe("business slug", () => {
  it("slugifies names and falls back when empty", () => {
    expect(slugifyBusinessName("Okeke General Stores")).toBe(
      "okeke-general-stores",
    );
    expect(slugifyBusinessName("  Ada's Shop  ")).toBe("ada-s-shop");
    expect(slugifyBusinessName("@@@")).toBe("business");
  });

  it("adds a numeric suffix when the slug is taken", () => {
    expect(nextBusinessSlug("ada", new Set())).toBe("ada");
    expect(nextBusinessSlug("ada", new Set(["ada"]))).toBe("ada-2");
    expect(nextBusinessSlug("ada", new Set(["ada", "ada-2"]))).toBe("ada-3");
  });
});
