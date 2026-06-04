import { describe, it, expect } from "vitest";
import { normalizePart, buildEquivalenceWhere } from "@/lib/equivalence";

describe("normalizePart", () => {
  it("recorta y pasa a mayúsculas", () => {
    expect(normalizePart("  wr55x10942 ")).toBe("WR55X10942");
  });
});

describe("buildEquivalenceWhere", () => {
  it("busca por número de parte o dentro de equivalencias, solo publicados", () => {
    const where = buildEquivalenceWhere("ap6010191");
    expect(where.status).toBe("PUBLICADO");
    expect(where.OR).toEqual([
      { partNumber: { equals: "AP6010191", mode: "insensitive" } },
      { equivalences: { has: "AP6010191" } },
    ]);
  });
});
