import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/slug";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, guias] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLICADO" },
      select: { brandSlug: true, partNumber: true, slug: true, equivalences: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.guia.findMany({ where: { status: "PUBLICADO" }, select: { slug: true, updatedAt: true } }),
  ]);

  const productUrls = products.map((p) => ({
    url: `${SITE}${productPath(p)}`,
    lastModified: p.updatedAt,
  }));
  const categoryUrls = categories.map((c) => ({
    url: `${SITE}/categoria/${c.slug}`,
    lastModified: c.updatedAt,
  }));

  const parts = new Set<string>();
  for (const p of products) {
    parts.add(p.partNumber.toUpperCase());
    for (const eq of p.equivalences) parts.add(eq.toUpperCase());
  }
  const equivalenceUrls = [...parts].map((part) => ({
    url: `${SITE}/equivalencia/${encodeURIComponent(part)}`,
  }));

  const guiaUrls = guias.map((g) => ({ url: `${SITE}/guias/${g.slug}`, lastModified: g.updatedAt }));

  const staticPages = ["/conseguir", "/igualar-precio", "/servicio-tecnico", "/buscar"].map(
    (path) => ({ url: `${SITE}${path}`, lastModified: new Date() })
  );

  return [
    { url: SITE, lastModified: new Date() },
    { url: `${SITE}/guias`, lastModified: new Date() },
    ...staticPages,
    ...categoryUrls,
    ...productUrls,
    ...equivalenceUrls,
    ...guiaUrls,
  ];
}
