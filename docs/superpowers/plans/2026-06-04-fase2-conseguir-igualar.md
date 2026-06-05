# Fase 2 — "Te lo consigo" + "Igualar precio" (Plan 9) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Convertir dos promesas del negocio en sistemas reales: **"Te lo consigo"** (el cliente pide una pieza que no está) e **"Igualar precio"** (el cliente reporta un precio más barato). Ambas son solicitudes (leads) que el cliente envía y el admin gestiona.

**Architecture:** Un solo modelo `Lead` con campo `tipo` (CONSEGUIR | IGUALAR_PRECIO) para no duplicar tablas ni pantallas de admin. Dos páginas públicas (`/conseguir`, `/igualar-precio`) con un `<form action={crearLead}>` compartido (server action). Enlaces desde el estado vacío de búsqueda, la ficha de producto y el footer. El admin gestiona en `/admin/cotizaciones` (lista + cambio de estado).

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6.

## Contexto ya existente (NO recrear)
- `lib/prisma.ts`, `lib/auth.ts` (`requireAdmin`).
- `app/(storefront)/buscar/page.tsx`: en el estado sin resultados muestra "No encontramos "{query}". Pero no te preocupes: **te lo conseguimos**. Contáctanos y lo buscamos por ti." (`query` es la variable del término).
- `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`: ya importa `Link`; tiene `product.sku`, `product.name`; al final del bloque hay un Link a `/servicio-tecnico` y luego `{product.description && ...}`.
- `components/site-footer.tsx` (importa `Link`): en la columna "Ayuda" hay `<li>Igualamos precios</li>` (texto plano).
- `app/admin/layout.tsx`: nav con Productos/Pedidos/Solicitudes (se le añade Cotizaciones).

## Estructura de archivos
```
prisma/schema.prisma                          # MOD: modelo Lead + enums LeadTipo/LeadEstado
app/(storefront)/solicitar/actions.ts          # NUEVO: crearLead
app/(storefront)/conseguir/page.tsx            # NUEVO: formulario "te lo consigo"
app/(storefront)/igualar-precio/page.tsx       # NUEVO: formulario "igualar precio"
app/(storefront)/buscar/page.tsx               # MOD: enlace a /conseguir en el estado vacío
app/(storefront)/refaccion/[marca]/[slug]/page.tsx # MOD: enlace "igualamos el precio"
components/site-footer.tsx                      # MOD: enlace "Igualamos precios"
app/admin/layout.tsx                           # MOD: nav + Cotizaciones
app/admin/cotizaciones/page.tsx                # NUEVO: lista admin
app/admin/cotizaciones/actions.ts              # NUEVO: cambiarEstadoLead
```

---

### Task 1: Modelo Lead

**Files:** Modify `prisma/schema.prisma`.

- [ ] **Step 1: Append to `prisma/schema.prisma`:**
```prisma
enum LeadTipo {
  CONSEGUIR
  IGUALAR_PRECIO
}

enum LeadEstado {
  NUEVO
  EN_PROCESO
  RESUELTO
  CERRADO
}

model Lead {
  id          String     @id @default(cuid())
  tipo        LeadTipo
  nombre      String
  telefono    String
  email       String?
  detalle     String
  productoSku String?
  estado      LeadEstado @default(NUEVO)
  createdAt   DateTime   @default(now())

  @@index([tipo])
}
```

- [ ] **Step 2: Migrate**
```powershell
npx prisma migrate dev --name add_lead
```
Expected: migración creada y aplicada.

- [ ] **Step 3: Generate + typecheck**
```powershell
npx prisma generate ; if ($?) { npx tsc --noEmit }
```
Expected: sin errores. (Si error stale de `.next/dev/types`, borrar `.next` y reintentar.)

- [ ] **Step 4: Commit**
```powershell
git add prisma
git commit -m "feat: Lead model (conseguir / igualar precio)"
```

---

### Task 2: Páginas públicas + action + enlaces

**Files:** Create `app/(storefront)/solicitar/actions.ts`, `app/(storefront)/conseguir/page.tsx`, `app/(storefront)/igualar-precio/page.tsx`; Modify `app/(storefront)/buscar/page.tsx`, `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`, `components/site-footer.tsx`.

- [ ] **Step 1: Create `app/(storefront)/solicitar/actions.ts`:**
```typescript
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function crearLead(formData: FormData) {
  const tipo =
    String(formData.get("tipo") ?? "CONSEGUIR") === "IGUALAR_PRECIO" ? "IGUALAR_PRECIO" : "CONSEGUIR";
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const detalle = String(formData.get("detalle") ?? "").trim();
  const skuRaw = String(formData.get("productoSku") ?? "").trim();

  if (!nombre || !telefono || !detalle) {
    throw new Error("Faltan datos (nombre, teléfono y detalle).");
  }

  await prisma.lead.create({
    data: {
      tipo,
      nombre,
      telefono,
      email: emailRaw.length > 0 ? emailRaw : null,
      detalle,
      productoSku: skuRaw.length > 0 ? skuRaw : null,
      estado: "NUEVO",
    },
  });

  redirect(tipo === "IGUALAR_PRECIO" ? "/igualar-precio?ok=1" : "/conseguir?ok=1");
}
```

- [ ] **Step 2: Create `app/(storefront)/conseguir/page.tsx`:**
```tsx
import type { Metadata } from "next";
import { crearLead } from "../solicitar/actions";

export const metadata: Metadata = {
  title: "Te conseguimos la pieza que necesitas",
  description:
    "¿No encuentras tu refacción? Dinos qué necesitas y la conseguimos por ti. Nunca decimos que no.",
};

type SearchParams = Promise<{ ok?: string; q?: string }>;

export default async function ConseguirPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, q } = await searchParams;
  const input = "rounded-md border border-slate-300 p-2";

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Te lo conseguimos</h1>
      <p className="mt-2 text-slate-600">
        Si no la tenemos en el catálogo, la buscamos por ti. Dinos qué necesitas.
      </p>
      {ok === "1" ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          ¡Recibido! Te contactamos pronto con la cotización de tu pieza.
        </div>
      ) : (
        <form action={crearLead} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="tipo" value="CONSEGUIR" />
          <input name="nombre" placeholder="Nombre" className={input} required />
          <input name="telefono" placeholder="Teléfono / WhatsApp" className={input} required />
          <input name="email" type="email" placeholder="Correo (opcional)" className={input} />
          <textarea
            name="detalle"
            placeholder="¿Qué pieza buscas? Incluye marca y modelo del aparato si lo sabes."
            className={input}
            rows={3}
            required
            defaultValue={q ? `Busco: ${q}` : ""}
          />
          <button type="submit" className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Conséguemela
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(storefront)/igualar-precio/page.tsx`:**
```tsx
import type { Metadata } from "next";
import { crearLead } from "../solicitar/actions";

export const metadata: Metadata = {
  title: "Igualamos el precio",
  description: "¿Viste tu refacción más barata en otro lado? La igualamos. Envíanos el dato.",
};

type SearchParams = Promise<{ ok?: string; sku?: string; producto?: string }>;

export default async function IgualarPrecioPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, sku, producto } = await searchParams;
  const input = "rounded-md border border-slate-300 p-2";

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Igualamos el precio</h1>
      <p className="mt-2 text-slate-600">
        ¿La viste más barata en otro lado? Mándanos el dato y te igualamos el precio.
      </p>
      {ok === "1" ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          ¡Gracias! Revisamos tu solicitud y te contactamos para igualarte el precio.
        </div>
      ) : (
        <form action={crearLead} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="tipo" value="IGUALAR_PRECIO" />
          <input type="hidden" name="productoSku" defaultValue={sku ?? ""} />
          <input name="nombre" placeholder="Nombre" className={input} required />
          <input name="telefono" placeholder="Teléfono / WhatsApp" className={input} required />
          <input name="email" type="email" placeholder="Correo (opcional)" className={input} />
          <textarea
            name="detalle"
            placeholder="¿Dónde la viste más barata? Pega el enlace y el precio."
            className={input}
            rows={3}
            required
            defaultValue={producto ? `Producto: ${producto}. ` : ""}
          />
          <button type="submit" className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Solicitar igualación
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Enlace desde el estado vacío de búsqueda** — en `app/(storefront)/buscar/page.tsx`, dentro del bloque `{query && products.length === 0 && (...)}`, reemplazar el párrafo por uno con enlace:
```tsx
        <p className="text-gray-600">
          No encontramos “{query}”. Pero no te preocupes:{" "}
          <a href={`/conseguir?q=${encodeURIComponent(query)}`} className="font-semibold text-blue-700 underline">
            te lo conseguimos
          </a>.
        </p>
```

- [ ] **Step 5: Enlace en la ficha de producto** — en `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`, justo DESPUÉS del Link de `/servicio-tecnico` (y antes de `{product.description && ...}`), insertar:
```tsx
      <Link
        href={`/igualar-precio?sku=${encodeURIComponent(product.sku)}&producto=${encodeURIComponent(product.name)}`}
        className="mt-2 block text-sm font-medium text-blue-700 hover:underline"
      >
        ¿Lo viste más barato? Igualamos el precio →
      </Link>
```

- [ ] **Step 6: Enlace en el footer** — en `components/site-footer.tsx`, cambiar `<li>Igualamos precios</li>` por:
```tsx
            <li><Link href="/igualar-precio" className="hover:text-white">Igualamos precios</Link></li>
```

- [ ] **Step 7: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 8: Verificar (runtime)** (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  Write-Output ("conseguir: " + ((Invoke-WebRequest http://localhost:3000/conseguir -UseBasicParsing -TimeoutSec 25).Content -match 'Te lo conseguimos'))
  Write-Output ("conseguir ok: " + ((Invoke-WebRequest "http://localhost:3000/conseguir?ok=1" -UseBasicParsing -TimeoutSec 25).Content -match 'Recibido'))
  Write-Output ("igualar: " + ((Invoke-WebRequest http://localhost:3000/igualar-precio -UseBasicParsing -TimeoutSec 25).Content -match 'Igualamos el precio'))
  Write-Output ("ficha enlace igualar: " + ((Invoke-WebRequest "http://localhost:3000/refaccion/mabe/wr55x10942-termostato-refrigerador" -UseBasicParsing -TimeoutSec 25).Content -match 'Igualamos el precio'))
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: las cuatro líneas True.

- [ ] **Step 9: Commit**
```powershell
git add app components
git commit -m "feat: te lo consigo + igualar precio (public lead forms + links)"
```

---

### Task 3: Admin de cotizaciones

**Files:** Modify `app/admin/layout.tsx`; Create `app/admin/cotizaciones/page.tsx`, `app/admin/cotizaciones/actions.ts`.

- [ ] **Step 1: Añadir el enlace a la nav** — en `app/admin/layout.tsx`, dentro del `<nav>`, agregar tras el link de Solicitudes:
```tsx
        <Link href="/admin/cotizaciones" className="text-blue-700 hover:underline">Cotizaciones</Link>
```

- [ ] **Step 2: Create `app/admin/cotizaciones/actions.ts`:**
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ESTADOS = ["NUEVO", "EN_PROCESO", "RESUELTO", "CERRADO"] as const;

export async function cambiarEstadoLead(id: string, formData: FormData) {
  await requireAdmin();
  const estado = String(formData.get("estado") ?? "");
  if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) return;
  await prisma.lead.update({ where: { id }, data: { estado: estado as (typeof ESTADOS)[number] } });
  revalidatePath("/admin/cotizaciones");
}
```

- [ ] **Step 3: Create `app/admin/cotizaciones/page.tsx`:**
```tsx
import { prisma } from "@/lib/prisma";
import { cambiarEstadoLead } from "./actions";

const ESTADOS = ["NUEVO", "EN_PROCESO", "RESUELTO", "CERRADO"];
const ESTADO_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  EN_PROCESO: "En proceso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};
const TIPO_LABEL: Record<string, string> = {
  CONSEGUIR: "Conseguir pieza",
  IGUALAR_PRECIO: "Igualar precio",
};

export default async function CotizacionesPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Cotizaciones (conseguir / igualar precio)</h1>
      {leads.length === 0 ? (
        <p className="text-slate-500">Aún no hay solicitudes.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Tipo</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Detalle</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b align-top">
                <td className="py-2">{TIPO_LABEL[l.tipo] ?? l.tipo}</td>
                <td>{l.nombre}</td>
                <td>{l.telefono}</td>
                <td className="max-w-xs">{l.detalle}</td>
                <td>
                  <form action={cambiarEstadoLead.bind(null, l.id)} className="flex items-center gap-1">
                    <select name="estado" defaultValue={l.estado} className="rounded border border-slate-300 p-1 text-xs">
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
                      ))}
                    </select>
                    <button className="text-xs text-blue-700 hover:underline">OK</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 5: Verificar** — `/admin/cotizaciones` sin sesión redirige a `/admin/login` (cmd /c + poll; matar node 3000).

- [ ] **Step 6: Commit**
```powershell
git add app/admin
git commit -m "feat: admin cotizaciones (leads) management"
```

---

## Definición de "terminado" (Plan 9)
- El cliente puede enviar **"te lo consigo"** (`/conseguir`, enlazado desde búsquedas sin resultados) e **"igualar precio"** (`/igualar-precio`, enlazado desde la ficha y el footer); ambos crean un `Lead`.
- El admin ve y gestiona los leads en `/admin/cotizaciones`.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Próximo plan
- **Plan 10:** Imágenes de producto (Supabase Storage).
