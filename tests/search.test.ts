import { describe, it, expect } from "vitest";
import { buildProductWhere } from "@/lib/search";

describe("buildProductWhere", () => {
  it("filtra solo productos publicados y busca en nombre, parte y marca (insensible)", () => {
    const where = buildProductWhere("  Mabe ");
    expect(where.status).toBe("PUBLICADO");
    expect(where.OR).toEqual([
      { name: { contains: "Mabe", mode: "insensitive" } },
      { partNumber: { contains: "Mabe", mode: "insensitive" } },
      { brand: { contains: "Mabe", mode: "insensitive" } },
    ]);
  });

  it("con query vacía no devuelve resultados (id imposible)", () => {
    const where = buildProductWhere("   ");
    expect(where.status).toBe("PUBLICADO");
    expect(where.id).toBe("__no_match__");
  });
});
