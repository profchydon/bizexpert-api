import { readFileSync } from "node:fs";
import { join } from "node:path";

const dockerfile = readFileSync(join(__dirname, "../../Dockerfile"), "utf8");

describe("api Dockerfile", () => {
  it("installs native build tools and compiles bcrypt", () => {
    expect(dockerfile).toContain("python3");
    expect(dockerfile).toContain("make");
    expect(dockerfile).toContain("g++");
    expect(dockerfile).not.toContain("--ignore-scripts");
  });

  it("copies this project as the build context", () => {
    expect(dockerfile).toContain("COPY package.json ./");
    expect(dockerfile).toContain("COPY prisma ./prisma");
    expect(dockerfile).not.toContain("COPY apps/");
    expect(dockerfile).toContain("prisma migrate deploy");
    expect(dockerfile).toContain("db:seed:js");
    expect(dockerfile).toContain("node dist/main");
  });
});
