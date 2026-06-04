import { prisma } from "@/lib/prisma";

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
                <td>{ESTADO_LABEL[s.estado] ?? s.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
