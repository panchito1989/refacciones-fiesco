import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default async function MisPedidosPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-slate-600">Aún no tienes pedidos. <Link href="/" className="text-blue-700 underline">Explora el catálogo</Link>.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/pedido/${o.id}`} className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Pedido #{o.id.slice(-6).toUpperCase()}</span>
                  <span className="font-semibold">{formatMXN(o.totalCents)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {o.items.length} artículo(s) · {STATUS_LABEL[o.status] ?? o.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
