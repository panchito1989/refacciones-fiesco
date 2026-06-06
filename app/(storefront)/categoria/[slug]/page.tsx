import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { productPath } from "@/lib/slug";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_SIZE = 24;

const escape = (o: unknown) =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

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

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const where = { categoryId: category.id, status: "PUBLICADO" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
      position: (page - 1) * PAGE_SIZE + i + 1,
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
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={`/categoria/${slug}?page=${page - 1}`}
              className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Anterior
            </Link>
          ) : (
            <span className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-400">
              Anterior
            </span>
          )}
          <span className="text-sm text-slate-600">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/categoria/${slug}?page=${page + 1}`}
              className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Siguiente
            </Link>
          ) : (
            <span className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-400">
              Siguiente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
