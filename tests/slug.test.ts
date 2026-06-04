import { describe, it, expect } from "vitest";
import { slugify, productPath } from "@/lib/slug";

describe("slugify", () => {
  it("convierte a kebab-case sin acentos ni símbolos", () => {
    expect(slugify("Termostato Refrigerador")).toBe("termostato-refrigerador");
    expect(slugify("Válvula 1/2\" Níquel")).toBe("valvula-1-2-niquel");
    expect(slugify("  WR55X10942  ")).toBe("wr55x10942");
  });
});

describe("productPath", () => {
  it("arma la URL semántica /refaccion/[marca]/[parte]-[slug]", () => {
    expect(
      productPath({ brandSlug: "mabe", partNumber: "WR55X10942", slug: "termostato" })
    ).toBe("/refaccion/mabe/wr55x10942-termostato");
  });
});
