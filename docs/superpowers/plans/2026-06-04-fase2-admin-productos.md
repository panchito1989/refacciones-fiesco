# Fase 2 — Admin operable: gestión de productos (Plan 7) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que el admin pueda **editar, borrar y publicar/despublicar** productos (hoy solo crea y lista, y los productos quedan en BORRADOR sin forma de publicarlos desde la UI). Se introduce un formulario compartido con selector de **estado** (publicar).

**Architecture:** Un componente `ProductForm` reutilizable (lo usan alta y edición) que incluye un `<select name="status">`. Server actions `crearProducto` (actualizado para leer status), `actualizarProducto(id, formData)`, `eliminarProducto(id)` y `togglePublicado(id)`, todos protegidos con `requireAdmin()`. La lista gana columna de acciones.

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6.

## Convenciones
- Windows + PowerShell. Dev: `Start-Process cmd -ArgumentList "/c","npm run dev"` + poll; matar node de 3000 al final.
- Cada tarea termina en commit. No `.env*`.

## Contexto ya existente (NO recrear)
- `app/admin/productos/actions.ts` con `crearProducto` (usa `requireAdmin()`, crea con `status: "BORRADOR"` fijo).
- `app/admin/productos/nuevo/page.tsx` (async; fetch categorías; form con name/sku/partNumber/brand/priceMxn/stock/condition/categoryId/equivalences).
- `app/admin/productos/page.tsx` (tabla SKU/Nombre/Marca/Precio/Stock/Estado).
- `lib/auth.ts` (`requireAdmin`), `lib/slug.ts` (`slugify`), `lib/format.ts` (`formatMXN`), `lib/prisma.ts`. Modelo `Product` (campos: name, sku, partNumber, brand, brandSlug, slug, priceCents, stock, condition, categoryId?, equivalences String[], status [BORRADOR|PUBLICADO], description?, warranty?, photos String[]).
- El admin está protegido por `app/admin/layout.tsx` (requireAdmin).

## Estructura de archivos
```
components/admin/product-form.tsx        # NUEVO: formulario compartido (alta+edición) con estado
app/admin/productos/actions.ts            # MOD: status en crear; + actualizar/eliminar/togglePublicado
app/admin/productos/nuevo/page.tsx        # MOD: usar ProductForm
app/admin/productos/[id]/editar/page.tsx  # NUEVO: página de edición
app/admin/productos/page.tsx              # MOD: columna de acciones (editar/publicar/eliminar)
```

---

### Task 1: Formulario compartido + status al crear

**Files:** Create `components/admin/product-form.tsx`; Modify `app/admin/productos/actions.ts`, `app/admin/productos/nuevo/page.tsx`.

- [ ] **Step 1: Create `components/admin/product-form.tsx`** — EXACTO:
```tsx
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
```

- [ ] **Step 2: Replace `app/admin/productos/actions.ts`** entirely — EXACTO (agrega status al crear; añade actualizar/eliminar/togglePublicado):
```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

function leerCampos(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const partNumber = String(formData.get("partNumber") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const priceMxn = Number(formData.get("priceMxn") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const condition =
    String(formData.get("condition") ?? "NUEVO") === "RECUPERADO" ? "RECUPERADO" : "NUEVO";
  const status =
    String(formData.get("status") ?? "BORRADOR") === "PUBLICADO" ? "PUBLICADO" : "BORRADOR";
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const categoryId = categoryIdRaw.length > 0 ? categoryIdRaw : null;
  const equivalences = String(formData.get("equivalences") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (!name || !sku || !partNumber || !brand) {
    throw new Error("Faltan campos obligatorios (nombre, SKU, número de parte, marca).");
  }
  return {
    name,
    sku,
    partNumber,
    brand,
    brandSlug: slugify(brand),
    slug: slugify(name),
    priceCents: Math.round(priceMxn * 100),
    stock,
    condition: condition as "NUEVO" | "RECUPERADO",
    status: status as "BORRADOR" | "PUBLICADO",
    categoryId,
    equivalences,
  };
}

export async function crearProducto(formData: FormData) {
  await requireAdmin();
  const data = leerCampos(formData);
  await prisma.product.create({ data });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function actualizarProducto(id: string, formData: FormData) {
  await requireAdmin();
  const data = leerCampos(formData);
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function eliminarProducto(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/productos");
}

export async function togglePublicado(id: string) {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id }, select: { status: true } });
  if (!p) return;
  await prisma.product.update({
    where: { id },
    data: { status: p.status === "PUBLICADO" ? "BORRADOR" : "PUBLICADO" },
  });
  revalidatePath("/admin/productos");
}
```

- [ ] **Step 3: Replace `app/admin/productos/nuevo/page.tsx`** — EXACTO (usa ProductForm):
```tsx
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { crearProducto } from "../actions";

export default async function NuevoProductoPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Nuevo producto</h1>
      <ProductForm action={crearProducto} categories={categories} submitLabel="Crear producto" />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores. (Si aparece error stale de `.next/dev/types`, borrar `.next` y reintentar.)

- [ ] **Step 5: Commit**
```powershell
git add components/admin app/admin/productos/actions.ts app/admin/productos/nuevo/page.tsx
git commit -m "feat: shared ProductForm + product status on create; CRUD actions"
```

---

### Task 2: Página de edición

**Files:** Create `app/admin/productos/[id]/editar/page.tsx`.

- [ ] **Step 1: Create `app/admin/productos/[id]/editar/page.tsx`** — EXACTO:
```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { actualizarProducto } from "../../actions";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const action = actualizarProducto.bind(null, product.id);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar producto</h1>
      <ProductForm action={action} categories={categories} product={product} submitLabel="Guardar cambios" />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 3: Verificar** — `/admin/productos/<algo>/editar` sin sesión redirige a `/admin/login` (lo protege el layout admin). (cmd /c + poll; matar node 3000.)
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  try { Invoke-WebRequest http://localhost:3000/admin/productos/xxx/editar -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 | Out-Null; Write-Output "editar sin sesion: NO redirige (revisar)" } catch { Write-Output ("editar redirige a: " + $_.Exception.Response.Headers.Location) }
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: redirige a `/admin/login`.

- [ ] **Step 4: Commit**
```powershell
git add app/admin/productos
git commit -m "feat: admin product edit page"
```

---

### Task 3: Acciones en la lista (editar / publicar / eliminar)

**Files:** Modify `app/admin/productos/page.tsx`.

- [ ] **Step 1: Replace `app/admin/productos/page.tsx`** — EXACTO (agrega columna de acciones):
```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { eliminarProducto, togglePublicado } from "./actions";

export default async function ProductosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <Link href="/admin/productos/nuevo" className="rounded bg-black px-3 py-2 text-white">
          Nuevo producto
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">SKU</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.brand}</td>
              <td>{formatMXN(p.priceCents)}</td>
              <td>{p.stock}</td>
              <td>
                <span className={p.status === "PUBLICADO" ? "text-green-700" : "text-slate-500"}>
                  {p.status === "PUBLICADO" ? "Publicado" : "Borrador"}
                </span>
              </td>
              <td className="flex flex-wrap items-center gap-3 py-2">
                <Link href={`/admin/productos/${p.id}/editar`} className="text-blue-700 hover:underline">
                  Editar
                </Link>
                <form action={togglePublicado.bind(null, p.id)}>
                  <button className="text-amber-700 hover:underline">
                    {p.status === "PUBLICADO" ? "Despublicar" : "Publicar"}
                  </button>
                </form>
                <form action={eliminarProducto.bind(null, p.id)}>
                  <button className="text-red-600 hover:underline">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-gray-500">
                Aún no hay productos. Crea el primero.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 3: Verificación funcional (controlador, con script Prisma).** El controlador probará en BD que las acciones funcionan (crear→publicar→editar→borrar) tras esta tarea, ya que requieren sesión admin. Para esta tarea, verificar tsc + que la lista carga sin error de tipos.

- [ ] **Step 4: Commit**
```powershell
git add app/admin/productos/page.tsx
git commit -m "feat: product list actions (edit, publish toggle, delete)"
```

---

## Definición de "terminado" (Plan 7)
- El admin puede **crear con estado** (publicar directo), **editar** (incluido publicar/despublicar), y **eliminar** productos.
- La lista muestra estado y acciones (Editar / Publicar-Despublicar / Eliminar).
- `npx tsc --noEmit` limpio y `npm test` verde.

## Próximo plan
- **Plan 8:** Subida de imágenes de producto (Supabase Storage) + mostrarlas en tarjetas y ficha.
