import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.customerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        ¡Gracias! Tu pedido <strong>#{order.id.slice(-6).toUpperCase()}</strong> fue registrado.
      </div>

      <h1 className="mt-6 text-xl font-bold">Resumen</h1>
      <ul className="mt-3 divide-y divide-slate-200 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between py-2">
            <span>{it.qty} × {it.name}</span>
            <span>{formatMXN(it.priceCents * it.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(order.subtotalCents)}</span></div>
        <div className="flex justify-between"><span>Envío</span><span>{order.shippingCents === 0 ? "Gratis" : formatMXN(order.shippingCents)}</span></div>
        {order.discountCents > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento cliente preferente</span><span>-{formatMXN(order.discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Total</span><span>{formatMXN(order.totalCents)}</span></div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold">Instrucciones de pago</p>
        {order.paymentMethod === "TRANSFERENCIA" ? (
          <p className="mt-1 text-slate-600">
            Realiza una transferencia SPEI por {formatMXN(order.totalCents)} a la cuenta que te
            compartiremos por WhatsApp/correo y envía tu comprobante. Apartamos tu pedido en cuanto lo recibamos.
          </p>
        ) : order.paymentMethod === "TARJETA" ? (
          <p className="mt-1 text-slate-600">
            Tu pago con tarjeta (Mercado Pago) se procesa en línea. Si quedó pendiente, puedes reintentar desde tu pedido.
          </p>
        ) : (
          <p className="mt-1 text-slate-600">
            Pago en efectivo: te contactaremos para coordinar el pago contra entrega o en punto OXXO.
          </p>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500">Enviaremos a: {order.shipName}, {order.shipStreet}, {order.shipCity}, {order.shipState}, CP {order.shipZip}.</p>
    </div>
  );
}
