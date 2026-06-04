import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildEquivalenceWhere, normalizePart } from "@/lib/equivalence";
import { ProductCard } from "@/components/product-card";

type Params = Promise<{ parte: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { parte } = await params;
  const p = normalizePart(decodeURIComponent(parte));
  return {
    title: `Refacciones equivalentes a ${p}`,
    description: `Refacciones nuevas y recuperadas equivalentes al número de parte ${p}. Compatibles, con garantía y envíos a todo México. Si no la tenemos, te la conseguimos.`,
  };
}

export default async function EquivalenciaPage({ params }: { params: Params }) {
  const { parte } = await params;
  const p = normalizePart(decodeURIComponent(parte));
  const products = await prisma.product.findMany({
    where: buildEquivalenceWhere(p),
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Equivalentes a {p}</h1>
      {products.length === 0 ? (
        <p className="text-gray-600">
          No tenemos equivalentes a {p} en este momento, pero <strong>te lo conseguimos</strong>.
          Contáctanos.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
