import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { eliminarProducto, togglePublicado } from "./actions";

export default async function ProductosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <Link href="/admin/productos/nuevo" className="rounded bg-black px-3 py-2 text-white">
          Nuevo producto
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">SKU</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.brand}</td>
              <td>{formatMXN(p.priceCents)}</td>
              <td>{p.stock}</td>
              <td>
                <span className={p.status === "PUBLICADO" ? "text-green-700" : "text-slate-500"}>
                  {p.status === "PUBLICADO" ? "Publicado" : "Borrador"}
                </span>
              </td>
              <td className="flex flex-wrap items-center gap-3 py-2">
                <Link href={`/admin/productos/${p.id}/editar`} className="text-blue-700 hover:underline">
                  Editar
                </Link>
                <form action={togglePublicado.bind(null, p.id)}>
                  <button className="text-amber-700 hover:underline">
                    {p.status === "PUBLICADO" ? "Despublicar" : "Publicar"}
                  </button>
                </form>
                <form action={eliminarProducto.bind(null, p.id)}>
                  <button className="text-red-600 hover:underline">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-gray-500">
                Aún no hay productos. Crea el primero.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
