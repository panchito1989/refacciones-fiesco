# Fase 2 — Imágenes de producto (Plan 10) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que el admin pueda **subir fotos reales** de producto (a Supabase Storage) desde el formulario, y que se muestren en las tarjetas y la ficha (hoy hay un placeholder con ícono).

**Architecture:** Un bucket público `productos` en Supabase Storage. Un cliente admin server-only (`lib/supabase/admin.ts`) con la **service role key** (nunca expuesta al cliente). Un helper `lib/storage.ts` (`resolverFotos`) que sube el archivo del campo `image` del form y devuelve la(s) URL(s) públicas, guardadas en `Product.photos`. Las acciones `crearProducto`/`actualizarProducto` lo usan. `ProductForm` gana un `<input type="file">`. `ProductCard` y la ficha muestran `photos[0]` si existe.

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6, Supabase Storage (@supabase/supabase-js ya instalado).

## Convenciones
- Windows + PowerShell. Dev: `Start-Process cmd -ArgumentList "/c","npm run dev"` + poll; matar node de 3000 al final.
- El bucket y el cliente usan `SUPABASE_SERVICE_ROLE_KEY` (en `.env.local`, server-only — NO `NEXT_PUBLIC_`).
- Cada tarea termina en commit. No `.env*`.

## Contexto ya existente (NO recrear)
- `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- `lib/auth.ts`, `lib/slug.ts`, `lib/prisma.ts`. Modelo `Product` tiene `photos String[]`.
- `app/admin/productos/actions.ts`: `leerCampos(formData)` (helper), `crearProducto`, `actualizarProducto(id, formData)`, etc. (todos `requireAdmin()`).
- `components/admin/product-form.tsx`: `ProductForm` (props action/categories/product?/submitLabel) con inputs de texto.
- `components/product-card.tsx`: `ProductCard` con `type ProductCardData` (name, brand, partNumber, brandSlug, slug, priceCents, condition) y un placeholder con ícono `Package` de lucide en un `<div className="... aspect-square ...">`.
- `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`: ficha (no muestra imagen aún).
- `next.config.ts`: tiene `reactCompiler: true` y `async headers()`.

## Estructura de archivos
```
lib/supabase/admin.ts                     # NUEVO: cliente service-role (server-only)
lib/storage.ts                            # NUEVO: resolverFotos (sube imagen → URL)
scripts/seed-bucket.mjs                   # NUEVO: crea el bucket "productos" (público)
package.json                              # MOD: script storage:init
next.config.ts                            # MOD: bodySizeLimit para server actions
app/admin/productos/actions.ts            # MOD: subir foto en crear/actualizar
components/admin/product-form.tsx         # MOD: input file
components/product-card.tsx               # MOD: mostrar photos[0]
app/(storefront)/refaccion/[marca]/[slug]/page.tsx  # MOD: mostrar imagen
```

---

### Task 1: Bucket + cliente admin + config

**Files:** Create `lib/supabase/admin.ts`, `scripts/seed-bucket.mjs`; Modify `package.json`, `next.config.ts`.

- [ ] **Step 1: Create `lib/supabase/admin.ts`** — EXACTO (cliente server-only con service role):
```typescript
import { createClient } from "@supabase/supabase-js";

// SOLO servidor: usa la service role key. NUNCA importar en componentes cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

- [ ] **Step 2: Create `scripts/seed-bucket.mjs`** — EXACTO (idempotente):
```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

try {
  const { error } = await supabase.storage.createBucket("productos", {
    public: true,
    fileSizeLimit: "6MB",
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log("BUCKET_OK productos (public)");
} catch (e) {
  console.error("BUCKET_FAIL", e.message);
  process.exitCode = 1;
}
```

- [ ] **Step 3: Add script to `package.json`** — en `"scripts"`:
```json
"storage:init": "node --env-file=.env.local scripts/seed-bucket.mjs"
```

- [ ] **Step 4: Run it**
```powershell
npm run storage:init
```
Expected: `BUCKET_OK productos (public)`.

- [ ] **Step 5: Modify `next.config.ts`** — añadir el límite de tamaño para server actions (las fotos pesan más de 1MB por defecto). Agregar la propiedad `serverActions` dentro de `nextConfig` (junto a `reactCompiler` y `headers`):
```typescript
  serverActions: { bodySizeLimit: "6mb" },
```
(Si Next.js indica que va bajo `experimental`, usar `experimental: { serverActions: { bodySizeLimit: "6mb" } }` en su lugar. Verificar que `npm run dev` arranca sin advertencia de config inválida.)

- [ ] **Step 6: Verify** — el bucket existe (lista de buckets vía el script o reintentando `npm run storage:init` → "already exists" tratado como OK). Confirmar que `npx tsc --noEmit` sigue limpio.
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 7: Commit**
```powershell
git add lib/supabase/admin.ts scripts/seed-bucket.mjs package.json next.config.ts
git commit -m "feat: Supabase Storage bucket + admin client + server action body limit"
```

---

### Task 2: Subir imagen al crear/editar

**Files:** Create `lib/storage.ts`; Modify `app/admin/productos/actions.ts`, `components/admin/product-form.tsx`.

- [ ] **Step 1: Create `lib/storage.ts`** — EXACTO:
```typescript
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "productos";

/** Sube el archivo del campo "image" si viene; si no, devuelve las fotos existentes. */
export async function resolverFotos(formData: FormData, existentes: string[]): Promise<string[]> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return existentes;

  const supabase = createAdminClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${randomUUID()}.${ext || "jpg"}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error("No se pudo subir la imagen: " + error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return [data.publicUrl];
}
```

- [ ] **Step 2: Modify `app/admin/productos/actions.ts`** — añadir el import y usar `resolverFotos` en `crearProducto` y `actualizarProducto`. (a) Add import:
```typescript
import { resolverFotos } from "@/lib/storage";
```
(b) Replace `crearProducto` body so it sets photos:
```typescript
export async function crearProducto(formData: FormData) {
  await requireAdmin();
  const data = leerCampos(formData);
  const photos = await resolverFotos(formData, []);
  await prisma.product.create({ data: { ...data, photos } });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
```
(c) Replace `actualizarProducto` body so it preserves/updates photos:
```typescript
export async function actualizarProducto(id: string, formData: FormData) {
  await requireAdmin();
  const data = leerCampos(formData);
  const existing = await prisma.product.findUnique({ where: { id }, select: { photos: true } });
  const photos = await resolverFotos(formData, existing?.photos ?? []);
  await prisma.product.update({ where: { id }, data: { ...data, photos } });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
```

- [ ] **Step 3: Modify `components/admin/product-form.tsx`** — añadir, justo ANTES del `<select name="status" ...>`, el campo de imagen (con vista previa si ya hay foto):
```tsx
      {product?.photos?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.photos[0]} alt="" className="h-32 w-32 rounded border object-cover" />
      )}
      <input name="image" type="file" accept="image/*" className={input} />
      <p className="-mt-1 text-xs text-slate-400">Foto del producto (opcional, máx ~6 MB).</p>
```

- [ ] **Step 4: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 5: Verificar la subida (controlador/subagente con script).** Como la subida requiere sesión admin + multipart, verificar al menos: (a) tsc limpio; (b) que un POST directo a Storage con la service role key sube un archivo (prueba de que el bucket + cliente funcionan). Script rápido:
```powershell
$svcLine = (Get-Content .env.local | Select-String 'SUPABASE_SERVICE_ROLE_KEY=').ToString()
$svc = $svcLine.Split('=',2)[1].Trim('"')
$h = @{ apikey = $svc; Authorization = "Bearer $svc" }
# subir un archivo de prueba (texto) a storage
$tmp = New-TemporaryFile; "hola" | Out-File $tmp.FullName
try {
  $r = Invoke-WebRequest "http://127.0.0.1:54321/storage/v1/object/productos/test-$(Get-Random).txt" -Method Post -Headers $h -InFile $tmp.FullName -ContentType "text/plain" -UseBasicParsing -TimeoutSec 10
  Write-Output ("upload storage -> HTTP " + $r.StatusCode + " (200/OK = bucket funciona)")
} catch { Write-Output ("upload storage -> HTTP " + [int]$_.Exception.Response.StatusCode) }
Remove-Item -LiteralPath $tmp.FullName -Force
```
Expected: HTTP 200 (la subida con service role funciona).

- [ ] **Step 6: Commit**
```powershell
git add lib/storage.ts app/admin/productos/actions.ts components/admin/product-form.tsx
git commit -m "feat: product image upload to Supabase Storage"
```

---

### Task 3: Mostrar las imágenes

**Files:** Modify `components/product-card.tsx`, `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`.

- [ ] **Step 1: Replace `components/product-card.tsx`** — EXACTO (añade `photos` al tipo y muestra `photos[0]`):
```tsx
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
```

- [ ] **Step 2: Modify the product page** `app/(storefront)/refaccion/[marca]/[slug]/page.tsx` — insertar, justo DESPUÉS de la apertura `<div className="mx-auto max-w-3xl p-6">` y del `<script ...JSON-LD.../>` (es decir, antes del `<h1>`), la imagen si existe:
```tsx
      {product.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.photos[0]}
          alt={product.name}
          className="mb-4 max-h-80 w-full rounded-lg border border-slate-200 object-contain"
        />
      )}
```

- [ ] **Step 3: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores. (`ProductCard` recibe el `Product` completo de Prisma en home/búsqueda/categoría/equivalencia, que incluye `photos`, así que es compatible.)

- [ ] **Step 4: Verificar (runtime)** — la home carga y la tarjeta del producto sembrado (sin foto) muestra el placeholder; la ficha carga (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  Write-Output ("home 200: " + ((Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 25).StatusCode))
  Write-Output ("ficha 200: " + ((Invoke-WebRequest "http://localhost:3000/refaccion/mabe/wr55x10942-termostato-refrigerador" -UseBasicParsing -TimeoutSec 25).StatusCode))
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: ambas 200.

- [ ] **Step 5: Run unit tests** (sanity)
```powershell
npm test
```
Expected: 9 verdes.

- [ ] **Step 6: Commit**
```powershell
git add components/product-card.tsx app/(storefront)/refaccion
git commit -m "feat: show product images in cards and detail"
```

---

## Definición de "terminado" (Plan 10)
- Existe el bucket público `productos`; el admin puede **subir una foto** al crear/editar un producto.
- Las tarjetas y la ficha muestran la foto (`photos[0]`) o el placeholder si no hay.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Notas
- Se guarda la **URL pública completa** en `photos` (acoplada al entorno). En producción, las fotos nuevas tendrán URL de la nube; suficiente por ahora.
- Se usa `<img>` (no `next/image`) para no configurar `remotePatterns`. Mejora futura: migrar a `next/image` con el host de Storage.

## Próximo plan
- **Plan 11:** Motor de contenido GEO (guías de reparación con HowTo/FAQ schema).
