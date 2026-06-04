# Fase 1 — Catálogo + Búsqueda (Plan 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al sitio su cara pública: una cáscara de tienda (header con buscador + footer), un buscador por número de parte / nombre / marca con su página de resultados, y una home que muestra productos. Todo renderizado en servidor (SSR) para mantener la ventaja de SEO/GEO.

**Architecture:** Se introduce un route group `(storefront)` de Next.js con su propio layout (header + footer) para separar la tienda pública del panel `/admin`. Las páginas públicas (home, ficha de producto, resultados de búsqueda) viven en ese grupo. La búsqueda usa una función pura `buildProductWhere(query)` (probada con TDD) que arma el filtro Prisma (`ILIKE`/contains insensible a mayúsculas sobre `name`, `partNumber`, `brand`), consumida por una página de resultados SSR. Un componente `ProductCard` reutilizable se usa en home y resultados.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, Prisma 6, Vitest.

## Convenciones
- Windows + PowerShell. Para correr el dev server de forma confiable: **`Start-Process cmd -ArgumentList "/c","npm run dev"`** (NO `Start-Process npm`, que falla porque npm es un `.cmd`). Esperar a que responda con un bucle de sondeo antes de hacer peticiones.
- Precios en centavos (`priceCents`). Mostrar con `formatMXN` de `lib/format.ts`.
- Cada tarea termina en commit.

## Contexto ya existente (NO recrear)
- `lib/prisma.ts` → `prisma` (Prisma 6, conecta a Supabase local). Modelo `Product`: `sku, partNumber, name, slug, description?, brand, brandSlug, condition (NUEVO|RECUPERADO), warranty?, priceCents, stock, photos, equivalences, status (BORRADOR|PUBLICADO)`.
- `lib/slug.ts` → `slugify`, `productPath({brandSlug, partNumber, slug})`.
- `lib/format.ts` → `formatMXN(cents)`.
- `app/refaccion/[marca]/[slug]/page.tsx` → ficha de producto SSR + JSON-LD (Plan 1). **Se moverá** dentro del route group en la Tarea 1 (la URL `/refaccion/...` NO cambia).
- `app/page.tsx` → home por defecto de create-next-app. **Se moverá** al route group y se reemplazará en la Tarea 4.
- `app/admin/*` → panel con su propio layout/guard. NO se toca.
- Hay un producto publicado de prueba: Mabe / `WR55X10942` / "Termostato refrigerador" / $599.00 / stock 5, URL `/refaccion/mabe/wr55x10942-termostato-refrigerador`.

## Estructura de archivos (qué crea/mueve este plan)
```
app/
├── (storefront)/
│   ├── layout.tsx                      # NUEVO: header + footer para la tienda
│   ├── page.tsx                        # MOVIDO desde app/page.tsx, luego REEMPLAZADO (home)
│   ├── buscar/page.tsx                 # NUEVO: resultados de búsqueda
│   └── refaccion/[marca]/[slug]/page.tsx  # MOVIDO desde app/refaccion/...
components/
├── site-header.tsx                     # NUEVO: logo + formulario de búsqueda
├── site-footer.tsx                     # NUEVO
└── product-card.tsx                    # NUEVO: tarjeta de producto reutilizable
lib/
└── search.ts                           # NUEVO: buildProductWhere (puro, con tests)
tests/
└── search.test.ts                      # NUEVO
```

---

### Task 1: Cáscara de la tienda (route group + header + footer)

**Files:**
- Create: `app/(storefront)/layout.tsx`
- Create: `components/site-header.tsx`
- Create: `components/site-footer.tsx`
- Move: `app/page.tsx` → `app/(storefront)/page.tsx`
- Move: `app/refaccion/[marca]/[slug]/page.tsx` → `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`

- [ ] **Step 1: Crear el route group y mover las páginas públicas**

Usar `Move-Item -LiteralPath` (NO `git mv`: git interpreta los corchetes `[marca]`/`[slug]` como comodines y falla). Git detectará los renames al hacer `git add -A` en el commit.

```powershell
New-Item -ItemType Directory -Force "app/(storefront)" | Out-Null
Move-Item -LiteralPath "E:\Refacciones-Fiesco\app\page.tsx" -Destination "E:\Refacciones-Fiesco\app\(storefront)\page.tsx"
New-Item -ItemType Directory -Force "app/(storefront)/refaccion/[marca]" | Out-Null
Move-Item -LiteralPath "E:\Refacciones-Fiesco\app\refaccion\[marca]\[slug]" -Destination "E:\Refacciones-Fiesco\app\(storefront)\refaccion\[marca]\"
```
Expected: existen `app/(storefront)/page.tsx` y `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`. La carpeta `app/refaccion/[marca]` queda vacía; **no pasa nada** — git no versiona carpetas vacías y Next.js no crea rutas de carpetas sin `page.tsx`. (Si el guard de borrado lo permite, puedes limpiarla con `Remove-Item -LiteralPath "E:\Refacciones-Fiesco\app\refaccion" -Recurse -Force`, pero es opcional.)

- [ ] **Step 2: Crear `components/site-header.tsx`** — header con logo y buscador (formulario GET, sin JS, ideal para SEO):
```tsx
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-4 p-4">
        <Link href="/" className="text-lg font-bold whitespace-nowrap">
          Refacciones Fiesco
        </Link>
        <form action="/buscar" method="get" className="flex flex-1 gap-2">
          <input
            type="search"
            name="q"
            placeholder="Busca por número de parte, nombre o marca…"
            className="w-full rounded border px-3 py-2"
            aria-label="Buscar refacciones"
          />
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Buscar
          </button>
        </form>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Crear `components/site-footer.tsx`**:
```tsx
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl p-6 text-sm text-gray-500">
        <p>Refacciones Fiesco — Refacciones de electrodomésticos, nuevas y recuperadas.</p>
        <p>Si no la tenemos, te la conseguimos. Envíos a todo México.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Crear `app/(storefront)/layout.tsx`**:
```tsx
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 5: Ajustar la ficha de producto movida** — quitar su `<main>` exterior para no anidar dos `<main>` (el layout ya provee uno). Abrir `app/(storefront)/refaccion/[marca]/[slug]/page.tsx` y cambiar el elemento raíz del componente de `<main className="mx-auto max-w-3xl p-6">…</main>` a `<div className="mx-auto max-w-3xl p-6">…</div>` (solo la etiqueta de apertura y cierre del contenedor raíz; el contenido interno no cambia).

- [ ] **Step 6: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 7: Verificar en runtime** (patrón confiable con `cmd /c`):
```powershell
$p = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) { Start-Sleep -Seconds 2; try { $null = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; $ready = $true; break } catch {} }
  Write-Output "ready=$ready"
  if ($ready) {
    $home = (Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("home tiene buscador: " + ($home -match 'name="q"'))
    Write-Output ("home tiene header: " + ($home -match 'Refacciones Fiesco'))
    $prod = (Invoke-WebRequest "http://localhost:3000/refaccion/mabe/wr55x10942-termostato-refrigerador" -UseBasicParsing -TimeoutSec 25)
    Write-Output ("producto sigue 200 con header: " + ($prod.StatusCode -eq 200 -and $prod.Content -match 'name="q"'))
  }
} finally { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
```
Expected: `ready=True`; home tiene buscador y header `True`; el producto sigue devolviendo 200 y ahora muestra el header `True`.

- [ ] **Step 8: Commit**
```powershell
git add app components
git commit -m "feat: storefront shell (route group, header with search, footer)"
```

---

### Task 2: Lógica de búsqueda (`lib/search.ts`) con TDD

**Files:**
- Create/Test: `tests/search.test.ts` → `lib/search.ts`

- [ ] **Step 1: Escribir el test (debe fallar)** — `tests/search.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildProductWhere } from "@/lib/search";

describe("buildProductWhere", () => {
  it("filtra solo productos publicados y busca en nombre, parte y marca (insensible)", () => {
    const where = buildProductWhere("  Mabe ");
    expect(where.status).toBe("PUBLICADO");
    expect(where.OR).toEqual([
      { name: { contains: "Mabe", mode: "insensitive" } },
      { partNumber: { contains: "Mabe", mode: "insensitive" } },
      { brand: { contains: "Mabe", mode: "insensitive" } },
    ]);
  });

  it("con query vacía no devuelve resultados (OR vacío imposible de cumplir)", () => {
    const where = buildProductWhere("   ");
    expect(where.status).toBe("PUBLICADO");
    expect(where.id).toBe("__no_match__");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**
```powershell
npx vitest run tests/search.test.ts
```
Expected: FAIL — módulo `@/lib/search` no encontrado.

- [ ] **Step 3: Implementar `lib/search.ts`**:
```typescript
import type { Prisma } from "@prisma/client";

export function buildProductWhere(query: string): Prisma.ProductWhereInput {
  const q = query.trim();
  if (q.length === 0) {
    // Query vacía: forzar cero resultados sin reventar el query.
    return { status: "PUBLICADO", id: "__no_match__" };
  }
  return {
    status: "PUBLICADO",
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { partNumber: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
    ],
  };
}
```

- [ ] **Step 4: Verificar que pasa**
```powershell
npx vitest run tests/search.test.ts
```
Expected: PASS.

- [ ] **Step 5: Correr toda la suite**
```powershell
npm test
```
Expected: todos verdes.

- [ ] **Step 6: Commit**
```powershell
git add lib/search.ts tests/search.test.ts
git commit -m "feat: product search query builder with TDD"
```

---

### Task 3: Tarjeta de producto + página de resultados de búsqueda

**Files:**
- Create: `components/product-card.tsx`
- Create: `app/(storefront)/buscar/page.tsx`

- [ ] **Step 1: Crear `components/product-card.tsx`** (presentacional, reutilizable):
```tsx
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
```

- [ ] **Step 2: Crear `app/(storefront)/buscar/page.tsx`** (SSR):
```tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildProductWhere } from "@/lib/search";
import { ProductCard } from "@/components/product-card";

type SearchParams = Promise<{ q?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Resultados para "${q}"` : "Buscar refacciones",
    robots: { index: false }, // las páginas de resultados no se indexan
  };
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const products = query
    ? await prisma.product.findMany({
        where: buildProductWhere(query),
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-semibold">
        {query ? `Resultados para “${query}”` : "Escribe algo para buscar"}
      </h1>
      {query && products.length === 0 && (
        <p className="text-gray-600">
          No encontramos “{query}”. Pero no te preocupes: <strong>te lo conseguimos</strong>.
          Contáctanos y lo buscamos por ti.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Verificar la búsqueda en runtime**:
```powershell
$p = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) { Start-Sleep -Seconds 2; try { $null = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; $ready = $true; break } catch {} }
  Write-Output "ready=$ready"
  if ($ready) {
    $hit = (Invoke-WebRequest "http://localhost:3000/buscar?q=mabe" -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("busqueda 'mabe' encuentra el producto: " + ($hit -match 'Termostato refrigerador'))
    $miss = (Invoke-WebRequest "http://localhost:3000/buscar?q=zzzznoexiste" -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("busqueda sin resultados muestra 'te lo conseguimos': " + ($miss -match 'te lo conseguimos'))
  }
} finally { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
```
Expected: `mabe` encuentra el producto `True`; búsqueda sin resultados muestra el mensaje `True`.

- [ ] **Step 5: Commit**
```powershell
git add app components
git commit -m "feat: search results page + reusable ProductCard"
```

---

### Task 4: Home page

**Files:**
- Modify (reemplazar contenido): `app/(storefront)/page.tsx`

- [ ] **Step 1: Reemplazar `app/(storefront)/page.tsx`** completo por:
```tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Refacciones de electrodomésticos — Refacciones Fiesco",
  description:
    "Refacciones de electrodomésticos nuevas y recuperadas con garantía. Busca por número de parte, nombre o marca. Si no la tenemos, te la conseguimos. Envíos a todo México.",
};

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <section className="py-8">
        <h1 className="text-3xl font-bold">Refacciones de electrodomésticos</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Nuevas y recuperadas con garantía. Si no la tenemos, te la conseguimos.
          Usa el buscador de arriba por número de parte, nombre o marca.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Productos recientes</h2>
        {products.length === 0 ? (
          <p className="text-gray-600">Pronto publicaremos nuestro catálogo.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 3: Verificar la home en runtime**:
```powershell
$p = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) { Start-Sleep -Seconds 2; try { $null = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; $ready = $true; break } catch {} }
  Write-Output "ready=$ready"
  if ($ready) {
    $home = (Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 25).Content
    Write-Output ("home muestra el producto sembrado: " + ($home -match 'Termostato refrigerador'))
    Write-Output ("home muestra el titular: " + ($home -match 'Refacciones de electrodom'))
  }
} finally { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
```
Expected: home muestra el producto `True` y el titular `True`.

- [ ] **Step 4: Correr la suite completa de tests**
```powershell
npm test
```
Expected: todos verdes.

- [ ] **Step 5: Commit**
```powershell
git add app
git commit -m "feat: storefront home page with recent products"
```

---

## Definición de "terminado" (Plan 2)
- La home (`/`) muestra header con buscador, titular y los productos publicados.
- El buscador lleva a `/buscar?q=…` y encuentra productos por nombre / número de parte / marca; sin resultados muestra el mensaje "te lo conseguimos".
- La ficha de producto sigue funcionando (200 + JSON-LD) ahora dentro de la cáscara de la tienda.
- `npx tsc --noEmit` limpio y `npm test` verde (incluye los nuevos tests de búsqueda).

## Próximos planes (no en este documento)
- **Plan 3:** Categorías (modelo + selector en admin + páginas `/categoria/[slug]`) y páginas de equivalencias (imán SEO/GEO).
- **Plan 4:** Cuentas de cliente + carrito + checkout (Mercado Pago) + mis pedidos + envío.
- **Plan 5:** Servicio Técnico.
