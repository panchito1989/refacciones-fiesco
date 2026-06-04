import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { isFreeShipping, SHIPPING_FLAT_CENTS } from "@/lib/shipping";

export type ResolvedLine = { sku: string; name: string; priceCents: number; qty: number; lineTotal: number };

export async function resolveCart(): Promise<{
  lines: ResolvedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}> {
  const cart = await getCart();
  const products = cart.length
    ? await prisma.product.findMany({ where: { sku: { in: cart.map((l) => l.sku) } } })
    : [];

  const lines: ResolvedLine[] = cart
    .map((l) => {
      const p = products.find((pr) => pr.sku === l.sku);
      if (!p) return null;
      return { sku: p.sku, name: p.name, priceCents: p.priceCents, qty: l.qty, lineTotal: p.priceCents * l.qty };
    })
    .filter((x): x is ResolvedLine => x !== null);

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingCents = lines.length === 0 || isFreeShipping(subtotalCents) ? 0 : SHIPPING_FLAT_CENTS;
  return { lines, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}
