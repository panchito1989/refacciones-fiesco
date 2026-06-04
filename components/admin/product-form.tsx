import type { Product } from "@prisma/client";

type Cat = { id: string; name: string };

export function ProductForm({
  action,
  categories,
  product,
  submitLabel = "Guardar",
}: {
  action: (formData: FormData) => void;
  categories: Cat[];
  product?: Product | null;
  submitLabel?: string;
}) {
  const input = "rounded border border-slate-300 p-2";
  return (
    <form action={action} className="flex max-w-lg flex-col gap-3">
      <input name="name" placeholder="Nombre" className={input} required defaultValue={product?.name ?? ""} />
      <input name="sku" placeholder="SKU" className={input} required defaultValue={product?.sku ?? ""} />
      <input name="partNumber" placeholder="Número de parte" className={input} required defaultValue={product?.partNumber ?? ""} />
      <input name="brand" placeholder="Marca" className={input} required defaultValue={product?.brand ?? ""} />
      <input name="priceMxn" type="number" step="0.01" placeholder="Precio MXN" className={input} required defaultValue={product ? (product.priceCents / 100).toString() : ""} />
      <input name="stock" type="number" placeholder="Stock" className={input} defaultValue={product?.stock ?? 0} />
      <select name="condition" className={input} defaultValue={product?.condition ?? "NUEVO"}>
        <option value="NUEVO">Nuevo</option>
        <option value="RECUPERADO">Recuperado</option>
      </select>
      <select name="categoryId" className={input} defaultValue={product?.categoryId ?? ""}>
        <option value="">— Sin categoría —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="equivalences" placeholder="Equivalencias (números de parte separados por coma)" className={input} defaultValue={product?.equivalences.join(", ") ?? ""} />
      <select name="status" className={input} defaultValue={product?.status ?? "BORRADOR"}>
        <option value="BORRADOR">Borrador (no visible en la tienda)</option>
        <option value="PUBLICADO">Publicado (visible)</option>
      </select>
      <button type="submit" className="rounded bg-black p-2 text-white">{submitLabel}</button>
    </form>
  );
}
