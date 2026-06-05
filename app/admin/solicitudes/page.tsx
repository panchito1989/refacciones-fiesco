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
      <h1 className="mb-4 text-xl font-semibold">Solicitudes de servicio técnico</h1>
      {solicitudes.length === 0 ? (
        <p className="text-slate-500">Aún no hay solicitudes.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Cliente</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Necesidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-b align-top">
                <td className="py-2">{s.nombre}</td>
                <td>{s.telefono}</td>
                <td>{s.ciudad}</td>
                <td className="max-w-xs">{s.descripcion}</td>
                <td>
                  <form action={cambiarEstadoSolicitud.bind(null, s.id)} className="flex items-center gap-1">
                    <select name="estado" defaultValue={s.estado} className="rounded border border-slate-300 p-1 text-xs">
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
                      ))}
                    </select>
                    <button className="text-xs text-blue-700 hover:underline">OK</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
