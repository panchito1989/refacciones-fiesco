import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Guías de reparación de electrodomésticos",
  description:
    "Guías paso a paso para reparar tus electrodomésticos: refrigeradores, lavadoras y más. Con la refacción correcta, tú puedes.",
  alternates: { canonical: "/guias" },
};

export default async function GuiasPage() {
  const guias = await prisma.guia.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
    select: { slug: true, titulo: true, resumen: true },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold text-slate-900">Guías de reparación</h1>
      <p className="mt-2 text-slate-600">Aprende a reparar tus electrodomésticos paso a paso.</p>
      {guias.length === 0 ? (
        <p className="mt-6 text-slate-500">Pronto publicaremos guías.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {guias.map((g) => (
            <li key={g.slug}>
              <Link href={`/guias/${g.slug}`} className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm">
                <h2 className="font-semibold text-slate-900">{g.titulo}</h2>
                <p className="mt-1 text-sm text-slate-600">{g.resumen}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
