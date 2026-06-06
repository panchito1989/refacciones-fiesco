"use client";

import { useActionState, startTransition } from "react";
import type { Product } from "@prisma/client";
import type { FormState } from "@/app/admin/productos/actions";

type Cat = { id: string; name: string };

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file); // throws for HEIC/unsupported
    const max = 1600;
    let { width, height } = bitmap;
    if (width > max || height > max) {
      const r = Math.min(max / width, max / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.82),
    );
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], base + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // HEIC/unsupported → submit original; server returns a friendly error
  }
}

export function ProductForm({
  action,
  categories,
  product,
  submitLabel = "Guardar",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  categories: Cat[];
  product?: Product | null;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const file = fd.get("image");
      if (file instanceof File && file.size > 0) {
        const compressed = await compressImage(file);
        fd.set("image", compressed, compressed.name);
      } else {
        fd.delete("image"); // no new photo
      }
      formAction(fd);
    });
  }

  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            className={inputCls}
            required
            defaultValue={product?.name ?? ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sku" className="mb-1.5 block text-sm font-medium text-slate-700">
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              className={inputCls}
              required
              defaultValue={product?.sku ?? ""}
            />
          </div>
          <div>
            <label htmlFor="partNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
              Número de parte
            </label>
            <input
              id="partNumber"
              name="partNumber"
              className={inputCls}
              required
              defaultValue={product?.partNumber ?? ""}
            />
          </div>
        </div>

        <div>
          <label htmlFor="brand" className="mb-1.5 block text-sm font-medium text-slate-700">
            Marca
          </label>
          <input
            id="brand"
            name="brand"
            className={inputCls}
            required
            defaultValue={product?.brand ?? ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="priceMxn" className="mb-1.5 block text-sm font-medium text-slate-700">
              Precio MXN
            </label>
            <input
              id="priceMxn"
              name="priceMxn"
              type="number"
              step="0.01"
              className={inputCls}
              required
              defaultValue={product ? (product.priceCents / 100).toString() : ""}
            />
          </div>
          <div>
            <label htmlFor="stock" className="mb-1.5 block text-sm font-medium text-slate-700">
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              className={inputCls}
              defaultValue={product?.stock ?? 0}
            />
          </div>
        </div>

        <div>
          <label htmlFor="condition" className="mb-1.5 block text-sm font-medium text-slate-700">
            Condición
          </label>
          <select
            id="condition"
            name="condition"
            className={inputCls}
            defaultValue={product?.condition ?? "NUEVO"}
          >
            <option value="NUEVO">Nuevo</option>
            <option value="RECUPERADO">Recuperado</option>
          </select>
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-slate-700">
            Categoría
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className={inputCls}
            defaultValue={product?.categoryId ?? ""}
          >
            <option value="">— Sin categoría —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="equivalences" className="mb-1.5 block text-sm font-medium text-slate-700">
            Equivalencias
          </label>
          <input
            id="equivalences"
            name="equivalences"
            placeholder="Números de parte separados por coma"
            className={inputCls}
            defaultValue={product?.equivalences.join(", ") ?? ""}
          />
        </div>

        <div>
          <label htmlFor="image" className="mb-1.5 block text-sm font-medium text-slate-700">
            Foto
          </label>
          {product?.photos?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.photos[0]} alt="" className="mb-2 h-32 w-32 rounded border object-cover" />
          )}
          <input id="image" name="image" type="file" accept="image/*" className={inputCls} />
          <p className="mt-1 text-xs text-slate-400">
            Cualquier foto (se optimiza automáticamente). Para fotos de iPhone, usa formato JPG si
            marca error.
          </p>
        </div>

        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            id="status"
            name="status"
            className={inputCls}
            defaultValue={product?.status ?? "BORRADOR"}
          >
            <option value="BORRADOR">Borrador (no visible en la tienda)</option>
            <option value="PUBLICADO">Publicado (visible)</option>
          </select>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
