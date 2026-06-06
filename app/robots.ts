import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Buscadores y crawlers generales
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/carrito", "/checkout", "/mi-cuenta", "/ingresar", "/registro"],
      },
      // Crawlers de IA: acceso total al catálogo público, sin admin
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin"] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
