import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(name: string) {
  return readFileSync(join(__dirname, name), "utf8");
}

describe("createBusinessWithOwner wiring", () => {
  it("creates an owner membership, default shop, and unique slug", () => {
    const text = source("create-business.util.ts");
    expect(text).toContain("createBusinessWithOwner");
    expect(text).toContain("BusinessRole.OWNER");
    expect(text).toContain("LocationType.SHOP");
    expect(text).toContain("Main Location");
    expect(text).toContain("include: { locations: true }");
    expect(text).toContain("nextBusinessSlug");
    expect(source("businesses.service.ts")).toContain(
      "createBusinessWithOwner",
    );
  });
});
