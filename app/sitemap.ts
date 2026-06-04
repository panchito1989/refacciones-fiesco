import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/slug";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLICADO" },
    select: { brandSlug: true, partNumber: true, slug: true, updatedAt: true },
  });

  const productUrls = products.map((p) => ({
    url: `${SITE}${productPath(p)}`,
    lastModified: p.updatedAt,
  }));

  return [{ url: SITE, lastModified: new Date() }, ...productUrls];
}
