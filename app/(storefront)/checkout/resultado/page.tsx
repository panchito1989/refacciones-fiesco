import type { Metadata } from "next";
import Link from "next/link";
import { obtenerPagoMP, marcarPedidoPagado } from "@/lib/mercadopago";

export const metadata: Metadata = {
  robots: { index: false },
};

type SP = Promise<{ payment_id?: string; status?: string; external_reference?: string }>;

export default async function ResultadoPage({ searchParams }: { searchParams: SP }) {
  const { payment_id, status, external_reference } = await searchParams;

  let aprobado = false;
  let orderId = external_reference ?? null;

  if (payment_id) {
    try {
      const pago = await obtenerPagoMP(payment_id);
      if (pago.status === "approved" && pago.external_reference) {
        orderId = pago.external_reference;
        await marcarPedidoPagado(orderId);
        aprobado = true;
      }
    } catch {
      // si falla la verificación, mostramos estado según el query
    }
  }
  if (!aprobado && status === "approved") aprobado = true;

  return (
    <div className="mx-auto max-w-xl p-6 text-center">
      {aprobado ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800">
          <h1 className="text-2xl font-bold">¡Pago aprobado! <span aria-hidden="true">🎉</span></h1>
          <p className="mt-2">Tu pedido fue pagado y está en proceso.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h1 className="text-2xl font-bold">Pago pendiente o no completado</h1>
          <p className="mt-2">Si ya pagaste, lo confirmaremos en breve. Si no, intenta de nuevo.</p>
        </div>
      )}
      <div className="mt-6 flex justify-center gap-4">
        {orderId && (
          <Link href={`/pedido/${orderId}`} className="rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
            Ver mi pedido
          </Link>
        )}
        <Link href="/" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
