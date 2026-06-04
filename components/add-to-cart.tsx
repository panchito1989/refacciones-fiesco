"use client";

import { useTransition } from "react";
import { agregarAlCarrito } from "@/app/(storefront)/carrito/actions";

export function AddToCart({ sku }: { sku: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => agregarAlCarrito(sku))}
      disabled={pending}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-amber-500 px-5 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-600 disabled:opacity-50"
    >
      {pending ? "Agregando…" : "Agregar al carrito"}
    </button>
  );
}
