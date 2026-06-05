import { prisma } from "@/lib/prisma";
import { cambiarEstadoSolicitud } from "./actions";

const ESTADOS = ["SOLICITADO", "AGENDADO", "EN_PROCESO", "COMPLETADO", "CANCELADO"];
const ESTADO_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  AGENDADO: "Agendado",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
};

export default async function SolicitudesPage() {
  const solicitudes = await prisma.solicitudServicio.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de servicio</h1>
        <p className="text-sm text-slate-500">Solicitudes de reparación y servicio técnico</p>
      </div>

      {solicitudes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm py-12 text-center text-slate-500">
          Aún no hay solicitudes.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Ciudad</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Necesidad</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{s.telefono}</td>
                  <td className="px-4 py-3 text-slate-600">{s.ciudad}</td>
                  <td className="px-4 py-3 max-w-xs text-slate-600">{s.descripcion}</td>
                  <td className="px-4 py-3">
                    <form action={cambiarEstadoSolicitud.bind(null, s.id)} className="flex items-center gap-1">
                      <select
                        name="estado"
                        defaultValue={s.estado}
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
