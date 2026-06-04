import { describe, it, expect } from "vitest";
import { formatMXN } from "@/lib/format";

describe("formatMXN", () => {
  it("formatea centavos a pesos MXN", () => {
    expect(formatMXN(59900)).toBe("$599.00");
    expect(formatMXN(0)).toBe("$0.00");
    expect(formatMXN(1050)).toBe("$10.50");
  });
});
