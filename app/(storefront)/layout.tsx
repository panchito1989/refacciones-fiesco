import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const escape = (o: unknown) =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Refacciones Fiesco",
      url: baseUrl,
      description:
        "Tienda en línea de refacciones y repuestos para electrodomésticos en México. Piezas nuevas y recuperadas con garantía, envío gratis en compras mayores a $599.",
      areaServed: "MX",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+525622042820",
          contactType: "customer service",
          areaServed: "MX",
          availableLanguage: ["Spanish"],
        },
      ],
    },
    {
      "@type": "WebSite",
      name: "Refacciones Fiesco",
      url: baseUrl,
      inLanguage: "es-MX",
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/buscar?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escape(siteGraph) }}
      />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
