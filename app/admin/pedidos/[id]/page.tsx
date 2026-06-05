import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { cambiarEstadoPedido } from "../actions";

const ESTADOS = ["PENDIENTE_PAGO", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"];
const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default async function AdminPedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) notFound();

  const action = cambiarEstadoPedido.bind(null, order.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Pedido #{order.id.slice(-6).toUpperCase()}</h1>
      <p className="mt-1 text-sm text-slate-500">{order.customer.email} · {order.paymentMethod}</p>

      <ul className="mt-4 divide-y divide-slate-200 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between py-2">
            <span>{it.qty} × {it.name}</span>
            <span>{formatMXN(it.priceCents * it.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(order.subtotalCents)}</span></div>
        <div className="flex justify-between"><span>Envío</span><span>{order.shippingCents === 0 ? "Gratis" : formatMXN(order.shippingCents)}</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>{formatMXN(order.totalCents)}</span></div>
      </div>

      <div className="mt-4 rounded border border-slate-200 p-3 text-sm">
        <p className="font-semibold">Envío</p>
        <p>{order.shipName} · {order.shipPhone}</p>
        <p>{order.shipStreet}, {order.shipCity}, {order.shipState}, CP {order.shipZip}</p>
      </div>

      <form action={action} className="mt-6 flex items-center gap-2">
        <label className="text-sm font-medium">Estado:</label>
        <select name="status" defaultValue={order.status} className="rounded border border-slate-300 p-2 text-sm">
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{STATUS_LABEL[e]}</option>
          ))}
        </select>
        <button className="rounded bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800">Actualizar</button>
      </form>
    </div>
  );
}
