import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getClienteEstado, UMBRAL_PREFERENTE } from "@/lib/preferente";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function MiCuentaPage() {
  const user = await requireUser();
  const { preferente, ordenesPagadas } = await getClienteEstado(user.id);
  const faltan = Math.max(0, UMBRAL_PREFERENTE - ordenesPagadas);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <p className="mt-2 text-slate-600">Sesión iniciada como {user.email}.</p>

      {preferente ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800">⭐ Eres Cliente Preferente</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900">
            <li>5% de descuento automático en todas tus compras.</li>
            <li>Acceso a capacitaciones para revendedores y técnicos.</li>
            <li>Préstamo de herramienta especializada.</li>
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Conviértete en Cliente Preferente</p>
          <p className="mt-1">
            Llevas {ordenesPagadas} compra(s). Te {faltan === 1 ? "falta" : "faltan"} {faltan} para
            desbloquear 5% de descuento, capacitaciones y préstamo de herramienta.
          </p>
        </div>
      )}

      <Link href="/mis-pedidos" className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
        Ver mis pedidos
      </Link>
    </div>
  );
}
