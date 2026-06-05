import type { Metadata } from "next";
import { crearLead } from "../solicitar/actions";

export const metadata: Metadata = {
  title: "Igualamos el precio",
  description: "¿Viste tu refacción más barata en otro lado? La igualamos. Envíanos el dato.",
};

type SearchParams = Promise<{ ok?: string; sku?: string; producto?: string }>;

export default async function IgualarPrecioPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, sku, producto } = await searchParams;
  const input = "rounded-md border border-slate-300 p-2";

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
        <form action={crearLead} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="tipo" value="IGUALAR_PRECIO" />
          <input type="hidden" name="productoSku" defaultValue={sku ?? ""} />
          <input name="nombre" placeholder="Nombre" className={input} required />
          <input name="telefono" placeholder="Teléfono / WhatsApp" className={input} required />
          <input name="email" type="email" placeholder="Correo (opcional)" className={input} />
          <textarea
            name="detalle"
            placeholder="¿Dónde la viste más barata? Pega el enlace y el precio."
            className={input}
            rows={3}
            required
            defaultValue={producto ? `Producto: ${producto}. ` : ""}
          />
          <button type="submit" className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Solicitar igualación
          </button>
        </form>
      )}
    </div>
  );
}
