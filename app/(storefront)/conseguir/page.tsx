import type { Metadata } from "next";
import { crearLead } from "../solicitar/actions";

export const metadata: Metadata = {
  title: "Te conseguimos la pieza que necesitas",
  description:
    "¿No encuentras tu refacción? Dinos qué necesitas y la conseguimos por ti. Nunca decimos que no.",
};

type SearchParams = Promise<{ ok?: string; q?: string }>;

export default async function ConseguirPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, q } = await searchParams;
  const input = "rounded-md border border-slate-300 p-2";

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Te lo conseguimos</h1>
      <p className="mt-2 text-slate-600">
        Si no la tenemos en el catálogo, la buscamos por ti. Dinos qué necesitas.
      </p>
      {ok === "1" ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          ¡Recibido! Te contactamos pronto con la cotización de tu pieza.
        </div>
      ) : (
        <form action={crearLead} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="tipo" value="CONSEGUIR" />
          <input name="nombre" placeholder="Nombre" className={input} required />
          <input name="telefono" placeholder="Teléfono / WhatsApp" className={input} required />
          <input name="email" type="email" placeholder="Correo (opcional)" className={input} />
          <textarea
            name="detalle"
            placeholder="¿Qué pieza buscas? Incluye marca y modelo del aparato si lo sabes."
            className={input}
            rows={3}
            required
            defaultValue={q ? `Busco: ${q}` : ""}
          />
          <button type="submit" className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Conséguemela
          </button>
        </form>
      )}
    </div>
  );
}
