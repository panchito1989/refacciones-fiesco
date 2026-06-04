import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { BenefitsBar } from "@/components/benefits-bar";
import { CategoryGrid } from "@/components/category-grid";

export const metadata: Metadata = {
  title: "Refacciones de electrodomésticos — Refacciones Fiesco",
  description:
    "Refacciones de electrodomésticos nuevas y recuperadas con garantía. Busca por número de parte, nombre o marca. Si no la tenemos, te la conseguimos. Envíos a todo México.",
};

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLICADO" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="mb-3 inline-block rounded-full bg-blue-600/50 px-3 py-1 text-xs font-medium tracking-wide text-blue-100">
            Piezas nuevas y recuperadas · Envíos a todo México
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            La refacción que tu electrodoméstico necesita
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-blue-100">
            Con garantía y al mejor precio. Y si no la tenemos,{" "}
            <span className="font-semibold text-white">te la conseguimos</span>.
          </p>
          <form action="/buscar" method="get" className="mt-8 flex max-w-xl gap-2">
            <input
              type="search"
              name="q"
              placeholder="Número de parte, nombre o marca…"
              aria-label="Buscar refacciones"
              className="flex-1 rounded-lg bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-600"
            >
              Buscar
            </button>
          </form>
          <p className="mt-3 text-sm text-blue-200">Ej: WR55X10942 · termostato · Mabe</p>
        </div>
      </section>

      <BenefitsBar />

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Explora por categoría</h2>
        <CategoryGrid categories={categories} />
      </section>

      {/* Productos destacados */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Productos destacados</h2>
          <Link href="/buscar?q=" className="text-sm font-medium text-blue-700 hover:underline">
            Ver todo
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-slate-600">Pronto publicaremos nuestro catálogo.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-14 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">¿No encuentras tu pieza?</h2>
          <p className="max-w-xl text-slate-300">
            No te preocupes: te la conseguimos. Dinos qué necesitas y la buscamos por ti.
          </p>
          <Link
            href="/buscar?q="
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-600"
          >
            Buscar mi refacción
          </Link>
        </div>
      </section>
    </>
  );
}
