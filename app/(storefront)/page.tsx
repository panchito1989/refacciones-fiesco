import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { CategoryNav } from "@/components/category-nav";

export const metadata: Metadata = {
  title: "Refacciones de electrodomésticos — Refacciones Fiesco",
  description:
    "Refacciones de electrodomésticos nuevas y recuperadas con garantía. Busca por número de parte, nombre o marca. Si no la tenemos, te la conseguimos. Envíos a todo México.",
};

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <section className="py-8">
        <h1 className="text-3xl font-bold">Refacciones de electrodomésticos</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Nuevas y recuperadas con garantía. Si no la tenemos, te la conseguimos.
          Usa el buscador de arriba por número de parte, nombre o marca.
        </p>
      </section>

      <section className="pb-4">
        <h2 className="mb-3 text-lg font-semibold">Categorías</h2>
        <CategoryNav />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Productos recientes</h2>
        {products.length === 0 ? (
          <p className="text-gray-600">Pronto publicaremos nuestro catálogo.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
