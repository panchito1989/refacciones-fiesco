import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildProductWhere } from "@/lib/search";
import { ProductCard } from "@/components/product-card";

type SearchParams = Promise<{ q?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Resultados para "${q}"` : "Buscar refacciones",
    robots: { index: false }, // las páginas de resultados no se indexan
  };
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const products = query
    ? await prisma.product.findMany({
        where: buildProductWhere(query),
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-semibold">
        {query ? `Resultados para "${query}"` : "Escribe algo para buscar"}
      </h1>
      {query && products.length === 0 && (
        <p className="text-gray-600">
          No encontramos "{query}". Pero no te preocupes: <strong>te lo conseguimos</strong>.
          Contáctanos y lo buscamos por ti.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
