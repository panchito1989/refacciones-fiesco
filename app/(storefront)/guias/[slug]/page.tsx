import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Paso, Faq } from "@/lib/guias";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guia = await prisma.guia.findUnique({ where: { slug } });
  if (!guia || guia.status !== "PUBLICADO") return { title: "Guía no encontrada" };
  return { title: guia.titulo, description: guia.resumen };
}

export default async function GuiaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const guia = await prisma.guia.findUnique({ where: { slug } });
  if (!guia || guia.status !== "PUBLICADO") notFound();

  const pasos = (guia.pasos as unknown as Paso[]) ?? [];
  const faqs = (guia.faqs as unknown as Faq[]) ?? [];

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guia.titulo,
    description: guia.resumen,
    step: pasos.map((p, i) => ({ "@type": "HowToStep", position: i + 1, name: p.titulo, text: p.descripcion })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: { "@type": "Answer", text: f.respuesta },
    })),
  };
  const escape = (o: unknown) =>
    JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

  return (
    <article className="mx-auto max-w-2xl p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escape(howTo) }} />
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escape(faqLd) }} />
      )}

      <h1 className="text-3xl font-bold text-slate-900">{guia.titulo}</h1>
      <p className="mt-3 text-slate-700">{guia.intro}</p>

      {pasos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Paso a paso</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5">
            {pasos.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.titulo}.</span> {p.descripcion}
              </li>
            ))}
          </ol>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
          <dl className="mt-3 space-y-4">
            {faqs.map((f, i) => (
              <div key={i}>
                <dt className="font-medium text-slate-900">{f.pregunta}</dt>
                <dd className="mt-1 text-slate-600">{f.respuesta}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
