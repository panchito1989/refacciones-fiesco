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
      <h1 className="mb-4 text-xl font-semibold">Cotizaciones (conseguir / igualar precio)</h1>
      {leads.length === 0 ? (
        <p className="text-slate-500">Aún no hay solicitudes.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Tipo</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Detalle</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b align-top">
                <td className="py-2">{TIPO_LABEL[l.tipo] ?? l.tipo}</td>
                <td>{l.nombre}</td>
                <td>{l.telefono}</td>
                <td className="max-w-xs">{l.detalle}</td>
                <td>
                  <form action={cambiarEstadoLead.bind(null, l.id)} className="flex items-center gap-1">
                    <select name="estado" defaultValue={l.estado} className="rounded border border-slate-300 p-1 text-xs">
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
