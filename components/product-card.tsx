import Link from "next/link";
import { Package } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { productPath } from "@/lib/slug";

type ProductCardData = {
  name: string;
  brand: string;
  partNumber: string;
  brandSlug: string;
  slug: string;
  priceCents: number;
  condition: "NUEVO" | "RECUPERADO";
  photos: string[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const foto = product.photos?.[0];
  return (
    <Link
      href={productPath(product)}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-lg"
    >
      <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-300">
            <Package className="h-12 w-12" aria-hidden />
          </span>
        )}
        <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
          {product.condition === "NUEVO" ? "Nuevo" : "Recuperado"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{product.name}</h3>
        <p className="mt-0.5 text-xs text-slate-400">Parte {product.partNumber}</p>
        <p className="mt-auto pt-3 text-lg font-bold text-slate-900">{formatMXN(product.priceCents)}</p>
      </div>
    </Link>
  );
}
