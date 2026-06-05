import { prisma } from "@/lib/prisma";
import { cambiarEstadoLead } from "./actions";

const ESTADOS = ["NUEVO", "EN_PROCESO", "RESUELTO", "CERRADO"];
const ESTADO_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  EN_PROCESO: "En proceso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};
const TIPO_LABEL: Record<string, string> = {
  CONSEGUIR: "Conseguir pieza",
  IGUALAR_PRECIO: "Igualar precio",
};

export default async function CotizacionesPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
        <p className="text-sm text-slate-500">Solicitudes de conseguir pieza o igualar precio</p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm py-12 text-center text-slate-500">
          Aún no hay solicitudes.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Detalle</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {TIPO_LABEL[l.tipo] ?? l.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{l.telefono}</td>
                  <td className="px-4 py-3 max-w-xs text-slate-600">{l.detalle}</td>
                  <td className="px-4 py-3">
                    <form action={cambiarEstadoLead.bind(null, l.id)} className="flex items-center gap-1">
                      <select
                        name="estado"
                        defaultValue={l.estado}
                        className="rounded border border-slate-300 p-1 text-xs"
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
                        ))}
                      </select>
                      <button className="text-xs font-medium text-blue-700 hover:underline">OK</button>
                    </form>
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
