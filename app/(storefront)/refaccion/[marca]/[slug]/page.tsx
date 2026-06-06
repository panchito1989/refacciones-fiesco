import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { slugify, productPath } from "@/lib/slug";
import { AddToCart } from "@/components/add-to-cart";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const escape = (o: unknown) =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

type Params = { marca: string; slug: string };

async function getProduct(marca: string, slug: string) {
  // slug = "<numero-parte-slug>-<nombre-slug>"; el partNumber slug es el prefijo
  const products = await prisma.product.findMany({
    where: { brandSlug: marca, status: "PUBLICADO" },
    include: { category: true },
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
  const title = `${product.partNumber} — ${product.name}`;
  const description =
    product.description ??
    `${product.name} para ${product.brand}. Refacción ${product.condition.toLowerCase()} con garantía. Envíos a todo México.`;
  const path = productPath(product);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      images: product.photos?.length ? [{ url: product.photos[0] }] : [{ url: "/hero.jpg" }],
    },
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

  const path = productPath(product);
  const productUrl = `${baseUrl}${path}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.partNumber,
    brand: { "@type": "Brand", name: product.brand },
    ...(product.description ? { description: product.description } : {}),
    image: product.photos?.length ? product.photos : [`${baseUrl}/hero.jpg`],
    url: productUrl,
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
      url: productUrl,
      seller: { "@type": "Organization", name: "Refacciones Fiesco" },
    },
  };

  const breadcrumbItems: Array<{ "@type": string; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "Inicio", item: baseUrl },
  ];
  if (product.category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: product.category.name,
      item: `${baseUrl}/categoria/${product.category.slug}`,
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: productUrl,
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(breadcrumbLd) }}
      />
      {product.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.photos[0]}
          alt={product.name}
          className="mb-4 max-h-80 w-full rounded-lg border border-slate-200 object-contain"
        />
      )}
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
