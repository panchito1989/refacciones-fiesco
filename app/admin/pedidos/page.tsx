import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const STATUS_BADGE: Record<string, string> = {
  PENDIENTE_PAGO: "bg-amber-100 text-amber-700",
  PAGADO: "bg-blue-100 text-blue-700",
  ENVIADO: "bg-purple-100 text-purple-700",
  ENTREGADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-600",
};

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
        <p className="text-sm text-slate-500">Historial de órdenes recibidas</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm py-12 text-center text-slate-500">
          Aún no hay pedidos.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Pedido</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Total</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Pago</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                    #{o.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.customer.email}</td>
                  <td className="px-4 py-3 text-slate-600">{formatMXN(o.totalCents)}</td>
                  <td className="px-4 py-3 text-slate-600">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                        (STATUS_BADGE[o.status] ?? "bg-slate-100 text-slate-600")
                      }
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
