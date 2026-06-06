/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { eliminarProducto, togglePublicado } from "./actions";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Build a URL query string from the given params, omitting undefined/empty values. */
function buildQs(params: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

const PAGE_SIZE = 24;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const rawQ = typeof sp.q === "string" ? sp.q.trim() : "";
  const foto = typeof sp.foto === "string" ? sp.foto : "";
  const pageNum = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1") || 1);

  // Build Prisma where clause
  const where: Prisma.ProductWhereInput = {};

  if (rawQ) {
    where.OR = [
      { name: { contains: rawQ, mode: "insensitive" } },
      { sku: { contains: rawQ, mode: "insensitive" } },
      { partNumber: { contains: rawQ, mode: "insensitive" } },
      { brand: { contains: rawQ, mode: "insensitive" } },
    ];
  }

  if (foto === "sin") {
    where.photos = { isEmpty: true };
  } else if (foto === "con") {
    where.NOT = { photos: { isEmpty: true } };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (pageNum - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(pageNum * PAGE_SIZE, total);

  // Link helpers — preserve q + foto when changing page, preserve q when changing foto
  const prevLink = buildQs({ q: rawQ || undefined, foto: foto || undefined, page: String(pageNum - 1) });
  const nextLink = buildQs({ q: rawQ || undefined, foto: foto || undefined, page: String(pageNum + 1) });

  const fotoLinks = {
    todos: buildQs({ q: rawQ || undefined }),
    con: buildQs({ q: rawQ || undefined, foto: "con" }),
    sin: buildQs({ q: rawQ || undefined, foto: "sin" }),
  };

  const inputCls =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500">Gestiona tu catálogo</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Upload size={16} />
            Importar CSV
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Plus size={16} />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* Search + filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search form (GET — puts ?q= in URL) */}
        <form method="get" className="flex items-center gap-2">
          {/* Preserve foto when submitting search */}
          {foto && <input type="hidden" name="foto" value={foto} />}
          <input
            type="search"
            name="q"
            defaultValue={rawQ}
            placeholder="Buscar por nombre, SKU, marca…"
            className={`${inputCls} w-64`}
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Buscar
          </button>
          {rawQ && (
            <Link
              href={buildQs({ foto: foto || undefined })}
              className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Foto filter links */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <Link
            href={`/admin/productos${fotoLinks.todos}`}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              foto === ""
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Todos
          </Link>
          <Link
            href={`/admin/productos${fotoLinks.con}`}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              foto === "con"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Con foto
          </Link>
          <Link
            href={`/admin/productos${fotoLinks.sin}`}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              foto === "sin"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Sin foto
          </Link>
        </div>

        {/* Count */}
        <p className="ml-auto text-sm text-slate-500">
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${rangeStart}–${rangeEnd} de ${total} producto${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">Foto</th>
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
                <td className="px-4 py-3">
                  {p.photos[0] ? (
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className="h-10 w-10 rounded object-cover border border-slate-200"
                    />
                  ) : (
                    <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                      Sin foto
                    </span>
                  )}
                </td>
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
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  {rawQ || foto
                    ? "No se encontraron productos con ese filtro."
                    : "Aún no hay productos. Crea el primero."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pageNum > 1 ? (
              <Link
                href={`/admin/productos${prevLink}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-300 cursor-not-allowed">
                ← Anterior
              </span>
            )}

            {pageNum < totalPages ? (
              <Link
                href={`/admin/productos${nextLink}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Siguiente →
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-300 cursor-not-allowed">
                Siguiente →
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500">
            Página {pageNum} de {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
