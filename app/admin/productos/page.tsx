import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { eliminarProducto, togglePublicado } from "./actions";

export default async function ProductosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500">Gestiona tu catálogo</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Nombre</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Marca</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Precio</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Stock</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Estado</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.brand}</td>
                <td className="px-4 py-3 text-slate-600">{formatMXN(p.priceCents)}</td>
                <td className="px-4 py-3 text-slate-600">{p.stock}</td>
                <td className="px-4 py-3">
                  {p.status === "PUBLICADO" ? (
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
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/productos/${p.id}/editar`}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={togglePublicado.bind(null, p.id)}>
                      <button className="text-sm font-medium text-amber-700 hover:underline">
                        {p.status === "PUBLICADO" ? "Despublicar" : "Publicar"}
                      </button>
                    </form>
                    <form action={eliminarProducto.bind(null, p.id)}>
                      <button className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Aún no hay productos. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
