import Link from "next/link";
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
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={productPath(product)}
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{product.brand}</p>
      <h3 className="mt-1 font-medium text-slate-900">{product.name}</h3>
      <p className="text-xs text-slate-400">Núm. de parte {product.partNumber}</p>
      <p className="mt-3 text-lg font-bold text-slate-900">{formatMXN(product.priceCents)}</p>
      <span className="mt-1 inline-block w-fit rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        {product.condition === "NUEVO" ? "Nuevo" : "Recuperado"}
      </span>
    </Link>
  );
}
