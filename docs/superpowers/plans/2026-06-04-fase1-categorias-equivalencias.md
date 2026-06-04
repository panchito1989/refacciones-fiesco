# Fase 1 — Categorías + Equivalencias (Plan 3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Añadir navegación por categorías y las páginas de equivalencias entre números de parte (imanes de tráfico para Google e IA), y dar al admin la capacidad de asignar categoría y equivalencias a cada producto.

**Architecture:** Se aprovecha el modelo `Category` (ya existe) y el campo `Product.equivalences` (String[]). El admin gana un selector de categoría y un campo de equivalencias. Se crean páginas SSR `/categoria/[slug]` y `/equivalencia/[parte]`, ambas indexables y con metadata propia. La ficha de producto muestra sus equivalencias enlazadas. El sitemap se amplía para incluir categorías y equivalencias. Un helper puro `buildEquivalenceWhere(parte)` (con TDD) arma el filtro Prisma.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, Prisma 6, Vitest.

## Convenciones
- Windows + PowerShell. Dev server confiable: `Start-Process cmd -ArgumentList "/c","npm run dev"` + sondeo de readiness.
- Números de parte se normalizan a MAYÚSCULAS para comparar equivalencias.
- Cada tarea termina en commit.

## Contexto ya existente (NO recrear)
- `prisma` (`lib/prisma.ts`); modelo `Product` (campos incl. `categoryId?`, `equivalences String[]`, `status`) y `Category` (`id, name, slug, parentId, products`).
- `lib/slug.ts` (`slugify`, `productPath`), `lib/format.ts` (`formatMXN`), `lib/search.ts` (`buildProductWhere`).
- `components/product-card.tsx` (`ProductCard`).
- Storefront en `app/(storefront)/` con layout (header+footer); páginas `page.tsx` (home), `buscar/page.tsx`, `refaccion/[marca]/[slug]/page.tsx`.
- Admin: `app/admin/productos/nuevo/page.tsx` (form) y `app/admin/productos/actions.ts` (`crearProducto`).
- `app/sitemap.ts` lista home + productos publicados.
- Producto sembrado: Mabe / `WR55X10942` / "Termostato refrigerador" / $599.00 (sin categoría ni equivalencias aún).

## Estructura de archivos
```
prisma/seed-categorias.mjs                  # NUEVO: siembra taxonomía + enriquece el producto demo
package.json                                # MOD: script db:seed:cat
app/admin/productos/nuevo/page.tsx          # MOD: select de categoría + input de equivalencias
app/admin/productos/actions.ts              # MOD: guardar categoryId + equivalences
lib/equivalence.ts                          # NUEVO: buildEquivalenceWhere (puro)
tests/equivalence.test.ts                   # NUEVO
app/(storefront)/categoria/[slug]/page.tsx  # NUEVO: listado por categoría
app/(storefront)/equivalencia/[parte]/page.tsx # NUEVO: equivalencias (imán SEO)
components/category-nav.tsx                  # NUEVO: navegación de categorías
app/(storefront)/page.tsx                   # MOD: añade sección de categorías
app/(storefront)/refaccion/[marca]/[slug]/page.tsx # MOD: muestra equivalencias enlazadas
app/sitemap.ts                              # MOD: incluye categorías y equivalencias
```

---

### Task 1: Admin asigna categoría + equivalencias (y seed de categorías)

**Files:**
- Create: `prisma/seed-categorias.mjs`
- Modify: `package.json` (script)
- Modify: `app/admin/productos/nuevo/page.tsx`
- Modify: `app/admin/productos/actions.ts`

- [ ] **Step 1: Crear `prisma/seed-categorias.mjs`** (idempotente; siembra taxonomía y asigna categoría + equivalencias al producto demo):
```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CATS = [
  { name: "Refrigeración", slug: "refrigeracion" },
  { name: "Lavado", slug: "lavado" },
  { name: "Cocción", slug: "coccion" },
  { name: "Climas", slug: "climas" },
  { name: "Pequeños electrodomésticos", slug: "pequenos-electrodomesticos" },
];
try {
  for (const c of CATS) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
  }
  const refri = await prisma.category.findUnique({ where: { slug: "refrigeracion" } });
  await prisma.product.updateMany({
    where: { sku: "TEST-001" },
    data: { categoryId: refri.id, equivalences: ["WR55X10942", "AP6010191", "PS11743421"] },
  });
  console.log(`SEED_CAT_OK categorias=${CATS.length}`);
} catch (e) {
  console.error("SEED_CAT_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
```

- [ ] **Step 2: Agregar script a `package.json`** — en `"scripts"`:
```json
"db:seed:cat": "node --env-file=.env prisma/seed-categorias.mjs"
```

- [ ] **Step 3: Correr el seed**
```powershell
npm run db:seed:cat
```
Expected: `SEED_CAT_OK categorias=5`.

- [ ] **Step 4: Reemplazar `app/admin/productos/actions.ts`** — EXACTO (añade categoryId + equivalences):
```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function crearProducto(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const partNumber = String(formData.get("partNumber") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const priceMxn = Number(formData.get("priceMxn") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const condition =
    String(formData.get("condition") ?? "NUEVO") === "RECUPERADO" ? "RECUPERADO" : "NUEVO";
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const categoryId = categoryIdRaw.length > 0 ? categoryIdRaw : null;
  const equivalences = String(formData.get("equivalences") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (!name || !sku || !partNumber || !brand) {
    throw new Error("Faltan campos obligatorios (nombre, SKU, número de parte, marca).");
  }

  await prisma.product.create({
    data: {
      name,
      sku,
      partNumber,
      brand,
      brandSlug: slugify(brand),
      slug: slugify(name),
      priceCents: Math.round(priceMxn * 100),
      stock,
      condition,
      categoryId,
      equivalences,
      status: "BORRADOR",
    },
  });

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
```

- [ ] **Step 5: Reemplazar `app/admin/productos/nuevo/page.tsx`** — EXACTO (async + select de categorías + input de equivalencias):
```tsx
import { prisma } from "@/lib/prisma";
import { crearProducto } from "../actions";

export default async function NuevoProductoPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <form action={crearProducto} className="flex max-w-lg flex-col gap-3">
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <input name="name" placeholder="Nombre" className="rounded border p-2" required />
      <input name="sku" placeholder="SKU" className="rounded border p-2" required />
      <input name="partNumber" placeholder="Número de parte" className="rounded border p-2" required />
      <input name="brand" placeholder="Marca" className="rounded border p-2" required />
      <input name="priceMxn" type="number" step="0.01" placeholder="Precio MXN" className="rounded border p-2" required />
      <input name="stock" type="number" placeholder="Stock" className="rounded border p-2" defaultValue={0} />
      <select name="condition" className="rounded border p-2">
        <option value="NUEVO">Nuevo</option>
        <option value="RECUPERADO">Recuperado</option>
      </select>
      <select name="categoryId" className="rounded border p-2" defaultValue="">
        <option value="">— Sin categoría —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="equivalences"
        placeholder="Equivalencias (números de parte separados por coma)"
        className="rounded border p-2"
      />
      <button type="submit" className="rounded bg-black p-2 text-white">
        Guardar
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Typecheck + tests**
```powershell
npx tsc --noEmit ; if ($?) { npm test }
```
Expected: sin errores de tipos; 7 tests verdes.

- [ ] **Step 7: Commit**
```powershell
git add prisma/seed-categorias.mjs package.json package-lock.json app/admin/productos
git commit -m "feat: admin assigns category + equivalences; seed categories"
```

---

### Task 2: Páginas de categoría + navegación + sitemap

**Files:**
- Create: `app/(storefront)/categoria/[slug]/page.tsx`
- Create: `components/category-nav.tsx`
- Modify: `app/(storefront)/page.tsx` (añadir sección categorías)
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Crear `components/category-nav.tsx`**:
```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function CategoryNav() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  if (categories.length === 0) return null;
  return (
    <nav className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categoria/${c.slug}`}
          className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Crear `app/(storefront)/categoria/[slug]/page.tsx`**:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: `Refacciones de ${category.name}`,
    description: `Catálogo de refacciones de ${category.name} para electrodomésticos. Nuevas y recuperadas con garantía. Envíos a todo México.`,
  };
}

export default async function CategoriaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, status: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Refacciones de {category.name}</h1>
      {products.length === 0 ? (
        <p className="text-gray-600">Aún no hay productos en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Añadir la sección de categorías a la home** `app/(storefront)/page.tsx`. Agregar el import y una sección ANTES de "Productos recientes". Importar arriba:
```tsx
import { CategoryNav } from "@/components/category-nav";
```
Y justo después de la `<section>` del titular (antes de la sección de productos), insertar:
```tsx
      <section className="pb-4">
        <h2 className="mb-3 text-lg font-semibold">Categorías</h2>
        <CategoryNav />
      </section>
```

- [ ] **Step 4: Ampliar `app/sitemap.ts`** — incluir categorías. Reemplazar el archivo por:
```typescript
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/slug";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLICADO" },
      select: { brandSlug: true, partNumber: true, slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const productUrls = products.map((p) => ({
    url: `${SITE}${productPath(p)}`,
    lastModified: p.updatedAt,
  }));
  const categoryUrls = categories.map((c) => ({
    url: `${SITE}/categoria/${c.slug}`,
    lastModified: c.updatedAt,
  }));

  return [{ url: SITE, lastModified: new Date() }, ...categoryUrls, ...productUrls];
}
```

- [ ] **Step 5: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Verificar en runtime** (cmd /c + poll):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  $ok = $false
  for ($i = 0; $i -lt 45; $i++) { Start-Sleep -Seconds 2; try { $null = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; $ok = $true; break } catch {} }
  Write-Output "ready=$ok"
  if ($ok) {
    $cat = (Invoke-WebRequest "http://localhost:3000/categoria/refrigeracion" -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("categoria muestra el producto: " + ($cat -match 'Termostato refrigerador'))
    $home = (Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("home tiene nav de categorias: " + ($home -match 'Refrigeraci'))
    $sm = (Invoke-WebRequest http://localhost:3000/sitemap.xml -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("sitemap incluye categoria: " + ($sm -match 'categoria/refrigeracion'))
  }
} finally { Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue }
```
Expected: las tres líneas True.

- [ ] **Step 7: Commit**
```powershell
git add app components
git commit -m "feat: category pages + nav + sitemap categories"
```

---

### Task 3: Equivalencias (helper TDD + páginas + ficha + sitemap)

**Files:**
- Create/Test: `tests/equivalence.test.ts` → `lib/equivalence.ts`
- Create: `app/(storefront)/equivalencia/[parte]/page.tsx`
- Modify: `app/(storefront)/refaccion/[marca]/[slug]/page.tsx` (mostrar equivalencias)
- Modify: `app/sitemap.ts` (incluir equivalencias)

- [ ] **Step 1: Test (debe fallar)** — `tests/equivalence.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { normalizePart, buildEquivalenceWhere } from "@/lib/equivalence";

describe("normalizePart", () => {
  it("recorta y pasa a mayúsculas", () => {
    expect(normalizePart("  wr55x10942 ")).toBe("WR55X10942");
  });
});

describe("buildEquivalenceWhere", () => {
  it("busca por número de parte o dentro de equivalencias, solo publicados", () => {
    const where = buildEquivalenceWhere("ap6010191");
    expect(where.status).toBe("PUBLICADO");
    expect(where.OR).toEqual([
      { partNumber: { equals: "AP6010191", mode: "insensitive" } },
      { equivalences: { has: "AP6010191" } },
    ]);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**
```powershell
npx vitest run tests/equivalence.test.ts
```
Expected: FAIL (módulo no encontrado).

- [ ] **Step 3: Implementar `lib/equivalence.ts`**:
```typescript
import type { Prisma } from "@prisma/client";

export function normalizePart(part: string): string {
  return part.trim().toUpperCase();
}

export function buildEquivalenceWhere(part: string): Prisma.ProductWhereInput {
  const p = normalizePart(part);
  return {
    status: "PUBLICADO",
    OR: [
      { partNumber: { equals: p, mode: "insensitive" } },
      { equivalences: { has: p } },
    ],
  };
}
```

- [ ] **Step 4: Verificar que pasa + suite completa**
```powershell
npx vitest run tests/equivalence.test.ts ; if ($?) { npm test }
```
Expected: PASS; suite completa verde (9 tests).

- [ ] **Step 5: Crear `app/(storefront)/equivalencia/[parte]/page.tsx`**:
```tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildEquivalenceWhere, normalizePart } from "@/lib/equivalence";
import { ProductCard } from "@/components/product-card";

type Params = Promise<{ parte: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { parte } = await params;
  const p = normalizePart(decodeURIComponent(parte));
  return {
    title: `Refacciones equivalentes a ${p}`,
    description: `Refacciones nuevas y recuperadas equivalentes al número de parte ${p}. Compatibles, con garantía y envíos a todo México. Si no la tenemos, te la conseguimos.`,
  };
}

export default async function EquivalenciaPage({ params }: { params: Params }) {
  const { parte } = await params;
  const p = normalizePart(decodeURIComponent(parte));
  const products = await prisma.product.findMany({
    where: buildEquivalenceWhere(p),
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Equivalentes a {p}</h1>
      {products.length === 0 ? (
        <p className="text-gray-600">
          No tenemos equivalentes a {p} en este momento, pero <strong>te lo conseguimos</strong>.
          Contáctanos.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Mostrar equivalencias en la ficha de producto.** En `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`, añadir el import:
```tsx
import Link from "next/link";
```
y, dentro del `return`, JUSTO ANTES de la línea `{product.description && <p className="mt-4">{product.description}</p>}`, insertar:
```tsx
      {product.equivalences.length > 0 && (
        <p className="mt-3 text-sm">
          Equivale a:{" "}
          {product.equivalences.map((eq, i) => (
            <span key={eq}>
              {i > 0 && ", "}
              <Link href={`/equivalencia/${encodeURIComponent(eq)}`} className="underline">
                {eq}
              </Link>
            </span>
          ))}
        </p>
      )}
```

- [ ] **Step 7: Ampliar `app/sitemap.ts`** para incluir equivalencias. Reemplazar el archivo por:
```typescript
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/slug";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLICADO" },
      select: { brandSlug: true, partNumber: true, slug: true, equivalences: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const productUrls = products.map((p) => ({
    url: `${SITE}${productPath(p)}`,
    lastModified: p.updatedAt,
  }));
  const categoryUrls = categories.map((c) => ({
    url: `${SITE}/categoria/${c.slug}`,
    lastModified: c.updatedAt,
  }));

  // Una página de equivalencia por cada número de parte y cada equivalencia (deduplicado)
  const parts = new Set<string>();
  for (const p of products) {
    parts.add(p.partNumber.toUpperCase());
    for (const eq of p.equivalences) parts.add(eq.toUpperCase());
  }
  const equivalenceUrls = [...parts].map((part) => ({
    url: `${SITE}/equivalencia/${encodeURIComponent(part)}`,
  }));

  return [
    { url: SITE, lastModified: new Date() },
    ...categoryUrls,
    ...productUrls,
    ...equivalenceUrls,
  ];
}
```

- [ ] **Step 8: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 9: Verificar en runtime**:
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  $ok = $false
  for ($i = 0; $i -lt 45; $i++) { Start-Sleep -Seconds 2; try { $null = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; $ok = $true; break } catch {} }
  Write-Output "ready=$ok"
  if ($ok) {
    $eq = (Invoke-WebRequest "http://localhost:3000/equivalencia/AP6010191" -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("equivalencia AP6010191 encuentra el producto: " + ($eq -match 'Termostato refrigerador'))
    $prod = (Invoke-WebRequest "http://localhost:3000/refaccion/mabe/wr55x10942-termostato-refrigerador" -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("ficha muestra equivalencias: " + ($prod -match 'Equivale a'))
    $sm = (Invoke-WebRequest http://localhost:3000/sitemap.xml -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("sitemap incluye equivalencia: " + ($sm -match 'equivalencia/AP6010191'))
  }
} finally { Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue }
```
Expected: las tres líneas True.

- [ ] **Step 10: Commit**
```powershell
git add lib/equivalence.ts tests/equivalence.test.ts app
git commit -m "feat: equivalence pages + product equivalences + sitemap"
```

---

## Definición de "terminado" (Plan 3)
- Existen 5 categorías sembradas; el admin puede asignar categoría y equivalencias al crear un producto.
- `/categoria/[slug]` lista los productos de la categoría; la home muestra la navegación de categorías.
- `/equivalencia/[parte]` encuentra productos por número de parte o por equivalencia; la ficha de producto muestra sus equivalencias enlazadas.
- El sitemap incluye home + categorías + productos + equivalencias.
- `npx tsc --noEmit` limpio y `npm test` verde (9 tests, +equivalence).

## Próximos planes
- **Plan 4:** Cuentas de cliente + carrito + checkout (Mercado Pago) + mis pedidos + envío.
- **Plan 5:** Servicio Técnico (directorio de técnicos por ciudad + solicitud).
