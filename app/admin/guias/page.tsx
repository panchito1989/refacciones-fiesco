import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { eliminarGuia } from "./actions";

export default async function AdminGuiasPage() {
  const guias = await prisma.guia.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Guías</h1>
        <Link href="/admin/guias/nuevo" className="rounded bg-black px-3 py-2 text-white">Nueva guía</Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b"><th className="py-2">Título</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {guias.map((g) => (
            <tr key={g.id} className="border-b">
              <td className="py-2">{g.titulo}</td>
              <td>{g.status === "PUBLICADO" ? "Publicado" : "Borrador"}</td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/guias/${g.id}/editar`} className="text-blue-700 hover:underline">Editar</Link>
                <form action={eliminarGuia.bind(null, g.id)}>
                  <button className="text-red-600 hover:underline">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
          {guias.length === 0 && (
            <tr><td colSpan={3} className="py-6 text-center text-gray-500">Aún no hay guías.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
