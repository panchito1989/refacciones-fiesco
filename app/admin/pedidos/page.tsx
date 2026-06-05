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

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-slate-500">Aún no hay pedidos.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Pedido</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2">#{o.id.slice(-6).toUpperCase()}</td>
                <td>{o.customer.email}</td>
                <td>{formatMXN(o.totalCents)}</td>
                <td>{o.paymentMethod}</td>
                <td>{STATUS_LABEL[o.status] ?? o.status}</td>
                <td>
                  <Link href={`/admin/pedidos/${o.id}`} className="text-blue-700 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
