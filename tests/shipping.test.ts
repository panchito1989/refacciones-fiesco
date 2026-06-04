import { describe, it, expect } from "vitest";
import { isFreeShipping, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

describe("isFreeShipping", () => {
  it("envío gratis cuando el subtotal supera $599", () => {
    expect(FREE_SHIPPING_THRESHOLD_CENTS).toBe(59900);
    expect(isFreeShipping(60000)).toBe(true);
    expect(isFreeShipping(59900)).toBe(false); // "mayores a 599" = estrictamente mayor
    expect(isFreeShipping(0)).toBe(false);
  });
});
