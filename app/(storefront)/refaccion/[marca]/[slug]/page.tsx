import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { AddToCart } from "@/components/add-to-cart";

type Params = { marca: string; slug: string };

async function getProduct(marca: string, slug: string) {
  // slug = "<numero-parte-slug>-<nombre-slug>"; el partNumber slug es el prefijo
  const products = await prisma.product.findMany({
    where: { brandSlug: marca, status: "PUBLICADO" },
  });
  return (
    products.find((p) => slug === `${slugify(p.partNumber)}-${p.slug}`) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { marca, slug } = await params;
  const product = await getProduct(marca, slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: `${product.name} ${product.partNumber} — ${product.brand}`,
    description:
      product.description ??
      `${product.name} para ${product.brand}. Refacción ${product.condition.toLowerCase()} con garantía. Envíos a todo México.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { marca, slug } = await params;
  const product = await getProduct(marca, slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.partNumber,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition:
        product.condition === "NUEVO"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/RefurbishedCondition",
    },
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-600">
        {product.brand} · Núm. de parte {product.partNumber}
      </p>
      <p className="mt-4 text-3xl font-semibold">{formatMXN(product.priceCents)}</p>
      <p className="mt-1 text-sm">
        {product.condition === "NUEVO" ? "Nuevo" : "Recuperado"}
        {product.warranty ? ` · Garantía: ${product.warranty}` : ""}
      </p>
      <p className="mt-1 text-sm">
        {product.stock > 0 ? "En existencia" : "Bajo pedido — te lo conseguimos"}
      </p>
      <AddToCart sku={product.sku} />
      {product.equivalences.length > 0 && (
        <p className="mt-3 text-sm">
          Equivale a:{" "}
          {product.equivalences.map((eq, i) => (
            <span key={eq}>
              {i > 0 && ", "}
              <Link href={`/equivalencia/${encodeURIComponent(eq)}`} className="underline">
                {eq}
              </Link>
            </span>
          ))}
        </p>
      )}
      <Link
        href={`/servicio-tecnico?sku=${encodeURIComponent(product.sku)}&producto=${encodeURIComponent(product.name)}`}
        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        ¿No puedes instalarla? Que un técnico lo haga →
      </Link>
      <Link
        href={`/igualar-precio?sku=${encodeURIComponent(product.sku)}&producto=${encodeURIComponent(product.name)}`}
        className="mt-2 block text-sm font-medium text-blue-700 hover:underline"
      >
        ¿Lo viste más barato? Igualamos el precio →
      </Link>
      {product.description && <p className="mt-4">{product.description}</p>}
    </div>
  );
}
