import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { resolveCart } from "@/lib/orders";
import { formatMXN } from "@/lib/format";
import { getClienteEstado, descuentoPreferente } from "@/lib/preferente";
import { crearPedido } from "./actions";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser();
  const { lines, subtotalCents, shippingCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");
  const { preferente } = await getClienteEstado(user.id);
  const discountCents = preferente ? descuentoPreferente(subtotalCents) : 0;
  const totalCents = subtotalCents - discountCents + shippingCents;

  const input = "rounded-md border border-slate-300 p-2";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-2">
      <form action={crearPedido} className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Datos de envío</h1>
        <input name="shipName" placeholder="Nombre completo" className={input} required />
        <input name="shipPhone" placeholder="Teléfono" className={input} required />
        <input name="shipStreet" placeholder="Calle y número" className={input} required />
        <div className="grid grid-cols-2 gap-3">
          <input name="shipCity" placeholder="Ciudad" className={input} required />
          <input name="shipState" placeholder="Estado" className={input} required />
        </div>
        <input name="shipZip" placeholder="Código postal" className={input} required />

        <h2 className="mt-2 font-semibold">Método de pago</h2>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="TRANSFERENCIA" defaultChecked /> Transferencia (SPEI)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="EFECTIVO" /> Efectivo / OXXO
        </label>
        <p className="text-xs text-slate-400">Pago con tarjeta (Mercado Pago) próximamente.</p>

        <button type="submit" className="mt-2 rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
          Confirmar pedido
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Tu pedido</h2>
        <ul className="divide-y divide-slate-200 text-sm">
          {lines.map((l) => (
            <li key={l.sku} className="flex justify-between py-2">
              <span>{l.qty} × {l.name}</span>
              <span>{formatMXN(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(subtotalCents)}</span></div>
          <div className="flex justify-between"><span>Envío</span><span>{shippingCents === 0 ? "Gratis" : formatMXN(shippingCents)}</span></div>
            {preferente && (
              <div className="flex justify-between text-green-700">
                <span>Descuento cliente preferente (5%)</span><span>-{formatMXN(discountCents)}</span>
              </div>
            )}
          <div className="flex justify-between border-t border-slate-300 pt-2 font-bold"><span>Total</span><span>{formatMXN(totalCents)}</span></div>
        </div>
      </aside>
    </div>
  );
}
