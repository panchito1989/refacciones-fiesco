import type { Metadata } from "next";
import { Wrench, MapPin, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { crearSolicitud } from "./actions";

export const metadata: Metadata = {
  title: "Servicio técnico a domicilio",
  description:
    "Instalación y reparación de electrodomésticos a domicilio. Red de técnicos por ciudad. Si compras tu refacción y no puedes instalarla, un técnico lo hace por ti.",
};

type SearchParams = Promise<{ ok?: string; sku?: string; producto?: string }>;

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export default async function ServicioTecnicoPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, sku, producto } = await searchParams;
  const tecnicos = await prisma.tecnico.findMany({ where: { activo: true } });
  const ciudades = [...new Set(tecnicos.flatMap((t) => t.ciudades))].sort();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold text-slate-900">Servicio técnico a domicilio</h1>
      <p className="mt-2 text-slate-600">
        ¿Compraste tu refacción pero no puedes instalarla? Nuestra red de técnicos lo hace por ti.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <Wrench className="h-6 w-6 shrink-0 text-blue-700" aria-hidden />
          <p className="text-sm text-slate-600">Técnicos verificados</p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <MapPin className="h-6 w-6 shrink-0 text-blue-700" aria-hidden />
          <p className="text-sm text-slate-600">Cobertura por ciudad</p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <Clock className="h-6 w-6 shrink-0 text-blue-700" aria-hidden />
          <p className="text-sm text-slate-600">Agenda a tu medida</p>
        </div>
      </div>

      {ciudades.length > 0 && (
        <p className="mt-4 text-sm text-slate-500">Cobertura actual: {ciudades.join(" · ")}.</p>
      )}

      {ok === "1" ? (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          ¡Solicitud recibida! Te contactaremos pronto para agendar tu servicio.
        </div>
      ) : (
        <form action={crearSolicitud} className="mt-8 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Solicita tu instalación</h2>
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700">Nombre completo</label>
            <input id="nombre" name="nombre" placeholder="Nombre completo" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-slate-700">Teléfono / WhatsApp</label>
            <input id="telefono" name="telefono" placeholder="Teléfono / WhatsApp" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="ciudad" className="mb-1 block text-sm font-medium text-slate-700">Ciudad</label>
            <input id="ciudad" name="ciudad" placeholder="Ciudad" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="direccion" className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
            <input id="direccion" name="direccion" placeholder="Dirección" className={inputCls} required />
          </div>
          <div>
            <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-slate-700">¿Qué necesitas instalar o reparar?</label>
            <textarea
              id="descripcion"
              name="descripcion"
              placeholder="¿Qué necesitas instalar o reparar?"
              className={inputCls}
              rows={3}
              required
              defaultValue={producto ? `Instalación de: ${producto}` : ""}
            />
          </div>
          <input type="hidden" name="productoSku" defaultValue={sku ?? ""} />
          <button type="submit" className="mt-1 rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Enviar solicitud
          </button>
        </form>
      )}
    </div>
  );
}
