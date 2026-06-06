import type { Metadata } from "next";
import { crearLead } from "../solicitar/actions";

export const metadata: Metadata = {
  title: "Te conseguimos la pieza que necesitas",
  description:
    "¿No encuentras tu refacción? Dinos qué necesitas y la conseguimos por ti. Nunca decimos que no.",
};

type SearchParams = Promise<{ ok?: string; q?: string }>;

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export default async function ConseguirPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, q } = await searchParams;

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
        <form action={crearLead} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="tipo" value="CONSEGUIR" />
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
            <input id="nombre" name="nombre" placeholder="Nombre" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-slate-700">Teléfono / WhatsApp</label>
            <input id="telefono" name="telefono" placeholder="Teléfono / WhatsApp" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Correo <span className="font-normal text-slate-400">(opcional)</span></label>
            <input id="email" name="email" type="email" placeholder="Correo (opcional)" className={inputCls} />
          </div>
          <div>
            <label htmlFor="detalle" className="mb-1 block text-sm font-medium text-slate-700">¿Qué pieza buscas?</label>
            <textarea
              id="detalle"
              name="detalle"
              placeholder="Incluye marca y modelo del aparato si lo sabes."
              className={inputCls}
              rows={3}
              required
              defaultValue={q ? `Busco: ${q}` : ""}
            />
          </div>
          <button type="submit" className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Conséguemela
          </button>
        </form>
      )}
    </div>
  );
}
