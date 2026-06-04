import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { formatMXN } from "@/lib/format";
import { isFreeShipping, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/shipping";
import { ButtonLink } from "@/components/ui/button";
import { quitarDelCarrito, vaciarCarrito } from "./actions";

export const metadata: Metadata = { title: "Tu carrito", robots: { index: false } };

export default async function CarritoPage() {
  const lines = await getCart();
  const products = lines.length
    ? await prisma.product.findMany({ where: { sku: { in: lines.map((l) => l.sku) } } })
    : [];

  const items = lines
    .map((l) => {
      const p = products.find((pr) => pr.sku === l.sku);
      return p ? { ...l, product: p, lineTotal: p.priceCents * l.qty } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const envioGratis = isFreeShipping(subtotal);
  const envio = items.length === 0 || envioGratis ? 0 : SHIPPING_FLAT_CENTS;
  const total = subtotal + envio;
  const faltante = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Tu carrito</h1>
      {items.length === 0 ? (
        <p className="text-slate-600">
          Tu carrito está vacío.{" "}
          <Link href="/" className="text-blue-700 underline">
            Ver productos
          </Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {items.map((i) => (
              <li key={i.sku} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{i.product.name}</p>
                  <p className="text-sm text-slate-500">
                    {i.product.brand} · {i.qty} × {formatMXN(i.product.priceCents)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatMXN(i.lineTotal)}</span>
                  <form action={quitarDelCarrito.bind(null, i.sku)}>
                    <button className="text-sm text-red-600 hover:underline">Quitar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMXN(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{envioGratis ? "Gratis" : formatMXN(envio)}</span>
            </div>
            {!envioGratis && faltante > 0 && (
              <p className="text-blue-700">Te faltan {formatMXN(faltante)} para envío gratis.</p>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatMXN(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <form action={vaciarCarrito}>
              <button className="text-sm text-slate-500 hover:underline">Vaciar carrito</button>
            </form>
            <ButtonLink variant="buy" href="/checkout" className="px-6 py-3">
              Continuar al pago
            </ButtonLink>
          </div>
          <p className="mt-2 text-right text-xs text-slate-400">
            El pago (Mercado Pago) se habilita en el siguiente plan.
          </p>
        </>
      )}
    </div>
  );
}
