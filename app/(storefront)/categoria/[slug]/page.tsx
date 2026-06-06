import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { productPath } from "@/lib/slug";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const escape = (o: unknown) =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Categoría no encontrada" };
  const title = `Refacciones de ${category.name}`;
  const description = `Catálogo de refacciones de ${category.name} para electrodomésticos. Nuevas y recuperadas con garantía. Envíos a todo México.`;
  return {
    title,
    description,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: {
      title,
      description,
      images: [{ url: "/hero.jpg" }],
    },
  };
}

export default async function CategoriaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, status: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${baseUrl}/categoria/${slug}`,
      },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Refacciones de ${category.name}`,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}${productPath(p)}`,
      name: p.name,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(itemListLd) }}
      />
      <h1 className="mb-4 text-2xl font-bold">Refacciones de {category.name}</h1>
      {products.length === 0 ? (
        <p className="text-slate-600">Aún no hay productos en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
