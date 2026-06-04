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
      className="block rounded-lg border p-4 transition hover:shadow-md"
    >
      <p className="text-sm text-gray-500">{product.brand}</p>
      <h3 className="font-medium">{product.name}</h3>
      <p className="text-xs text-gray-400">Núm. de parte {product.partNumber}</p>
      <p className="mt-2 text-lg font-semibold">{formatMXN(product.priceCents)}</p>
      <span className="text-xs text-gray-500">
        {product.condition === "NUEVO" ? "Nuevo" : "Recuperado"}
      </span>
    </Link>
  );
}
