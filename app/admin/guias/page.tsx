import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { eliminarGuia } from "./actions";

export default async function AdminGuiasPage() {
  const guias = await prisma.guia.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guías</h1>
          <p className="text-sm text-slate-500">Artículos y guías de instalación</p>
        </div>
        <Link
          href="/admin/guias/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus size={16} />
          Nueva guía
        </Link>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Título</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Estado</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {guias.map((g) => (
              <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{g.titulo}</td>
                <td className="px-4 py-3">
                  {g.status === "PUBLICADO" ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Publicado
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Borrador
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/guias/${g.id}/editar`}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={eliminarGuia.bind(null, g.id)}>
                      <button className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {guias.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-500">
                  Aún no hay guías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
