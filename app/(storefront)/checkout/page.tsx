import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { resolveCart } from "@/lib/orders";
import { formatMXN } from "@/lib/format";
import { getClienteEstado, descuentoPreferente } from "@/lib/preferente";
import { mpConfigurado } from "@/lib/mercadopago";
import { crearPedido } from "./actions";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export default async function CheckoutPage() {
  const user = await requireUser();
  const { lines, subtotalCents, shippingCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");
  const { preferente } = await getClienteEstado(user.id);
  const discountCents = preferente ? descuentoPreferente(subtotalCents) : 0;
  const totalCents = subtotalCents - discountCents + shippingCents;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-2">
      {/* Order summary — first in DOM so it shows at top on mobile */}
      <aside className="order-first h-fit rounded-lg border border-slate-200 bg-slate-50 p-6 md:order-last">
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

      <form action={crearPedido} className="order-last flex flex-col gap-3 md:order-first">
        <h1 className="text-2xl font-bold">Datos de envío</h1>

        <div>
          <label htmlFor="shipName" className="mb-1 block text-sm font-medium text-slate-700">Nombre completo</label>
          <input id="shipName" name="shipName" autoComplete="name" placeholder="Nombre completo" className={inputCls} required />
        </div>
        <div>
          <label htmlFor="shipPhone" className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
          <input id="shipPhone" name="shipPhone" autoComplete="tel" placeholder="Teléfono" className={inputCls} required />
        </div>
        <div>
          <label htmlFor="shipStreet" className="mb-1 block text-sm font-medium text-slate-700">Calle y número</label>
          <input id="shipStreet" name="shipStreet" autoComplete="street-address" placeholder="Calle y número" className={inputCls} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="shipCity" className="mb-1 block text-sm font-medium text-slate-700">Ciudad</label>
            <input id="shipCity" name="shipCity" autoComplete="address-level2" placeholder="Ciudad" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="shipState" className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
            <input id="shipState" name="shipState" autoComplete="address-level1" placeholder="Estado" className={inputCls} required />
          </div>
        </div>
        <div>
          <label htmlFor="shipZip" className="mb-1 block text-sm font-medium text-slate-700">Código postal</label>
          <input id="shipZip" name="shipZip" autoComplete="postal-code" placeholder="Código postal" className={inputCls} required />
        </div>

        <h2 className="mt-2 font-semibold">Método de pago</h2>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="TRANSFERENCIA" defaultChecked /> Transferencia (SPEI)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="EFECTIVO" /> Efectivo / OXXO
        </label>
        {mpConfigurado && (
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="TARJETA" /> Tarjeta (Mercado Pago)
          </label>
        )}
        {!mpConfigurado && (
          <p className="text-xs text-slate-400">Pago con tarjeta (Mercado Pago) próximamente.</p>
        )}

        <button type="submit" className="mt-2 rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
          Confirmar pedido
        </button>
      </form>
    </div>
  );
}
