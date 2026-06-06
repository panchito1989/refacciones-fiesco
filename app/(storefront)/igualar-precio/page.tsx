import type { Metadata } from "next";
import { crearLead } from "../solicitar/actions";

export const metadata: Metadata = {
  title: "Igualamos el precio",
  description: "¿Viste tu refacción más barata en otro lado? La igualamos. Envíanos el dato.",
};

type SearchParams = Promise<{ ok?: string; sku?: string; producto?: string }>;

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export default async function IgualarPrecioPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, sku, producto } = await searchParams;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Igualamos el precio</h1>
      <p className="mt-2 text-slate-600">
        ¿La viste más barata en otro lado? Mándanos el dato y te igualamos el precio.
      </p>
      {ok === "1" ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          ¡Gracias! Revisamos tu solicitud y te contactamos para igualarte el precio.
        </div>
      ) : (
        <form action={crearLead} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="tipo" value="IGUALAR_PRECIO" />
          <input type="hidden" name="productoSku" defaultValue={sku ?? ""} />
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
            <label htmlFor="detalle" className="mb-1 block text-sm font-medium text-slate-700">¿Dónde la viste más barata?</label>
            <textarea
              id="detalle"
              name="detalle"
              placeholder="Pega el enlace y el precio."
              className={inputCls}
              rows={3}
              required
              defaultValue={producto ? `Producto: ${producto}. ` : ""}
            />
          </div>
          <button type="submit" className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Solicitar igualación
          </button>
        </form>
      )}
    </div>
  );
}
