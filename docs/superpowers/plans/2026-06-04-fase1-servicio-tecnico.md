# Fase 1 — Servicio Técnico (Plan 6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Sección de **Servicio Técnico**: el cliente solicita instalación a domicilio (formulario público), se guarda como `SolicitudServicio` y el admin la ve. Modelo de `Tecnico` (red por ciudad) con seed. Botón "¿No puedes instalarla?" en la ficha de producto.

**Architecture:** Modelos Prisma `Tecnico` (red de técnicos por ciudad) y `SolicitudServicio` (solicitud de instalación, opcionalmente ligada a un SKU). La landing `/servicio-tecnico` es un Server Component con un `<form action={crearSolicitud}>` (server action) que crea la solicitud y redirige a una confirmación por query param. La ficha de producto enlaza a la landing con el SKU/nombre prellenados. El admin lista las solicitudes en `/admin/solicitudes`.

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6.

## Convenciones
- Windows + PowerShell. Dev: `Start-Process cmd -ArgumentList "/c","npm run dev"` + poll; matar node de 3000 al final.
- Cada tarea termina en commit. No commitear `.env*`. Node 22 (`--env-file=.env`).

## Contexto ya existente (NO recrear)
- `lib/prisma.ts`, `lib/auth.ts` (`requireAdmin`). Storefront en `app/(storefront)/` con layout (header+footer). Admin en `app/admin/` (layout protegido por `requireAdmin`).
- `components/site-footer.tsx` tiene un `<li>Servicio técnico a domicilio</li>` (texto plano) que se convertirá en enlace.
- La ficha de producto `app/(storefront)/refaccion/[marca]/[slug]/page.tsx` muestra precio, condición, stock, `<AddToCart sku=.../>`, equivalencias y descripción.
- lucide-react disponible.

## Estructura de archivos
```
prisma/schema.prisma                              # MOD: Tecnico, SolicitudServicio, enum SolicitudEstado
prisma/seed-tecnicos.mjs                          # NUEVO: siembra técnicos
package.json                                      # MOD: script db:seed:tecnicos
app/(storefront)/servicio-tecnico/page.tsx        # NUEVO: landing + formulario
app/(storefront)/servicio-tecnico/actions.ts      # NUEVO: crearSolicitud
components/site-footer.tsx                         # MOD: enlace a /servicio-tecnico
app/(storefront)/refaccion/[marca]/[slug]/page.tsx # MOD: botón "¿No puedes instalarla?"
app/admin/solicitudes/page.tsx                     # NUEVO: lista admin de solicitudes
```

---

### Task 1: Modelos Tecnico + SolicitudServicio + seed

**Files:** Modify `prisma/schema.prisma`, `package.json`; Create `prisma/seed-tecnicos.mjs`.

- [ ] **Step 1: Añadir a `prisma/schema.prisma`** (al final):
```prisma
enum SolicitudEstado {
  SOLICITADO
  AGENDADO
  EN_PROCESO
  COMPLETADO
  CANCELADO
}

model Tecnico {
  id             String              @id @default(cuid())
  nombre         String
  telefono       String
  ciudades       String[]            @default([])
  especialidades String[]            @default([])
  activo         Boolean             @default(true)
  rating         Float?
  solicitudes    SolicitudServicio[]
  createdAt      DateTime            @default(now())
}

model SolicitudServicio {
  id          String          @id @default(cuid())
  nombre      String
  telefono    String
  ciudad      String
  direccion   String
  descripcion String
  productoSku String?
  estado      SolicitudEstado @default(SOLICITADO)
  tecnicoId   String?
  tecnico     Tecnico?        @relation(fields: [tecnicoId], references: [id])
  createdAt   DateTime        @default(now())

  @@index([estado])
}
```

- [ ] **Step 2: Migrar**
```powershell
npx prisma migrate dev --name add_servicio_tecnico
```
Expected: migración creada y aplicada.

- [ ] **Step 3: Crear `prisma/seed-tecnicos.mjs`** (idempotente por nombre+ciudad no aplica; usamos upsert por id determinista vía findFirst):
```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TECNICOS = [
  { nombre: "Juan Pérez", telefono: "5551112233", ciudades: ["Ciudad de México", "Estado de México"], especialidades: ["Refrigeración", "Lavado"] },
  { nombre: "María López", telefono: "3331445566", ciudades: ["Guadalajara"], especialidades: ["Cocción", "Climas"] },
  { nombre: "Carlos Ruiz", telefono: "8112778899", ciudades: ["Monterrey"], especialidades: ["Refrigeración", "Climas"] },
];
try {
  for (const t of TECNICOS) {
    const existing = await prisma.tecnico.findFirst({ where: { nombre: t.nombre } });
    if (existing) await prisma.tecnico.update({ where: { id: existing.id }, data: t });
    else await prisma.tecnico.create({ data: t });
  }
  console.log(`SEED_TEC_OK tecnicos=${TECNICOS.length}`);
} catch (e) {
  console.error("SEED_TEC_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
```
Agregar a `package.json` scripts: `"db:seed:tecnicos": "node --env-file=.env prisma/seed-tecnicos.mjs"`, y correr:
```powershell
npm run db:seed:tecnicos
```
Expected: `SEED_TEC_OK tecnicos=3`.

- [ ] **Step 4: Typecheck**
```powershell
npx prisma generate ; if ($?) { npx tsc --noEmit }
```
Expected: sin errores. (Si aparece error stale de `.next/dev/types`, borrar `.next` y reintentar.)

- [ ] **Step 5: Commit**
```powershell
git add prisma package.json package-lock.json
git commit -m "feat: Tecnico + SolicitudServicio models + seed technicians"
```

---

### Task 2: Landing + formulario de solicitud + botón en ficha

**Files:** Create `app/(storefront)/servicio-tecnico/actions.ts`, `app/(storefront)/servicio-tecnico/page.tsx`; Modify `components/site-footer.tsx`, `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`.

- [ ] **Step 1: Crear `app/(storefront)/servicio-tecnico/actions.ts`:**
```typescript
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function crearSolicitud(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const skuRaw = String(formData.get("productoSku") ?? "").trim();
  const productoSku = skuRaw.length > 0 ? skuRaw : null;

  if (!nombre || !telefono || !ciudad || !direccion || !descripcion) {
    throw new Error("Faltan datos para la solicitud.");
  }

  await prisma.solicitudServicio.create({
    data: { nombre, telefono, ciudad, direccion, descripcion, productoSku, estado: "SOLICITADO" },
  });

  redirect("/servicio-tecnico?ok=1");
}
```

- [ ] **Step 2: Crear `app/(storefront)/servicio-tecnico/page.tsx`:**
```tsx
import type { Metadata } from "next";
import { Wrench, MapPin, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { crearSolicitud } from "./actions";

export const metadata: Metadata = {
  title: "Servicio técnico a domicilio",
  description:
    "Instalación y reparación de electrodomésticos a domicilio. Red de técnicos por ciudad. Si compras tu refacción y no puedes instalarla, un técnico lo hace por ti.",
};

type SearchParams = Promise<{ ok?: string; sku?: string; producto?: string }>;

export default async function ServicioTecnicoPage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, sku, producto } = await searchParams;
  const tecnicos = await prisma.tecnico.findMany({ where: { activo: true } });
  const ciudades = [...new Set(tecnicos.flatMap((t) => t.ciudades))].sort();

  const input = "rounded-md border border-slate-300 p-2";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold text-slate-900">Servicio técnico a domicilio</h1>
      <p className="mt-2 text-slate-600">
        ¿Compraste tu refacción pero no puedes instalarla? Nuestra red de técnicos lo hace por ti.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <Wrench className="h-6 w-6 shrink-0 text-blue-700" aria-hidden />
          <p className="text-sm text-slate-600">Técnicos verificados</p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <MapPin className="h-6 w-6 shrink-0 text-blue-700" aria-hidden />
          <p className="text-sm text-slate-600">Cobertura por ciudad</p>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
          <Clock className="h-6 w-6 shrink-0 text-blue-700" aria-hidden />
          <p className="text-sm text-slate-600">Agenda a tu medida</p>
        </div>
      </div>

      {ciudades.length > 0 && (
        <p className="mt-4 text-sm text-slate-500">Cobertura actual: {ciudades.join(" · ")}.</p>
      )}

      {ok === "1" ? (
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          ¡Solicitud recibida! Te contactaremos pronto para agendar tu servicio.
        </div>
      ) : (
        <form action={crearSolicitud} className="mt-8 flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Solicita tu instalación</h2>
          <input name="nombre" placeholder="Nombre completo" className={input} required />
          <input name="telefono" placeholder="Teléfono / WhatsApp" className={input} required />
          <input name="ciudad" placeholder="Ciudad" className={input} required />
          <input name="direccion" placeholder="Dirección" className={input} required />
          <textarea
            name="descripcion"
            placeholder="¿Qué necesitas instalar o reparar?"
            className={input}
            rows={3}
            required
            defaultValue={producto ? `Instalación de: ${producto}` : ""}
          />
          <input type="hidden" name="productoSku" defaultValue={sku ?? ""} />
          <button type="submit" className="mt-1 rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
            Enviar solicitud
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Enlace en el footer** — en `components/site-footer.tsx`, cambiar el `<li>Servicio técnico a domicilio</li>` por:
```tsx
            <li><Link href="/servicio-tecnico" className="hover:text-white">Servicio técnico a domicilio</Link></li>
```
(El footer ya importa `Link` de next/link.)

- [ ] **Step 4: Botón en la ficha de producto** `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`: importar `import Link from "next/link";` si no está ya, e insertar DESPUÉS del bloque de equivalencias (antes de `{product.description && ...}`):
```tsx
      <Link
        href={`/servicio-tecnico?sku=${encodeURIComponent(product.sku)}&producto=${encodeURIComponent(product.name)}`}
        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        ¿No puedes instalarla? Que un técnico lo haga →
      </Link>
```
(Nota: `Link` ya está importado en esa página por el bloque de equivalencias; si por alguna razón no, agrégalo.)

- [ ] **Step 5: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Verificar (runtime)** (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  $s = (Invoke-WebRequest http://localhost:3000/servicio-tecnico -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("landing carga: " + ($s -match 'Servicio t' -and $s -match 'Solicita tu instalaci'))
  Write-Output ("muestra cobertura: " + ($s -match 'Guadalajara'))
  $ok = (Invoke-WebRequest "http://localhost:3000/servicio-tecnico?ok=1" -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("confirmacion ok=1: " + ($ok -match 'Solicitud recibida'))
  $p = (Invoke-WebRequest "http://localhost:3000/refaccion/mabe/wr55x10942-termostato-refrigerador" -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("ficha tiene boton tecnico: " + ($p -match 'No puedes instalarla'))
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: las cuatro líneas True.

- [ ] **Step 7: Commit**
```powershell
git add app components
git commit -m "feat: servicio tecnico landing + request form + product link"
```

---

### Task 3: Admin — lista de solicitudes

**Files:** Create `app/admin/solicitudes/page.tsx`.

- [ ] **Step 1: Crear `app/admin/solicitudes/page.tsx`** (protegida por el layout admin):
```tsx
import { prisma } from "@/lib/prisma";

const ESTADO_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  AGENDADO: "Agendado",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
};

export default async function SolicitudesPage() {
  const solicitudes = await prisma.solicitudServicio.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Solicitudes de servicio técnico</h1>
      {solicitudes.length === 0 ? (
        <p className="text-slate-500">Aún no hay solicitudes.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Cliente</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Necesidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-b align-top">
                <td className="py-2">{s.nombre}</td>
                <td>{s.telefono}</td>
                <td>{s.ciudad}</td>
                <td className="max-w-xs">{s.descripcion}</td>
                <td>{ESTADO_LABEL[s.estado] ?? s.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 3: Verificar** — `/admin/solicitudes` sin sesión redirige a `/admin/login` (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  try { Invoke-WebRequest http://localhost:3000/admin/solicitudes -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 | Out-Null; Write-Output "admin/solicitudes: NO redirige (revisar)" } catch { Write-Output ("admin/solicitudes redirige a: " + $_.Exception.Response.Headers.Location) }
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: redirige a `/admin/login`.

- [ ] **Step 4: Commit**
```powershell
git add app/admin/solicitudes
git commit -m "feat: admin service requests list"
```

---

## Definición de "terminado" (Plan 6)
- 3 técnicos sembrados; existen modelos `Tecnico` y `SolicitudServicio`.
- `/servicio-tecnico` muestra la landing con cobertura por ciudad y un formulario; al enviar crea una `SolicitudServicio` y muestra confirmación.
- La ficha de producto enlaza a la landing con el producto prellenado; el footer enlaza a la sección.
- `/admin/solicitudes` lista las solicitudes (protegida por rol ADMIN).
- `npx tsc --noEmit` limpio y `npm test` verde.

## Seguimiento (no en este plan)
- Asignación automática de técnico por ciudad/zona; agendado con fecha; cambio de estado desde el admin; cotización/costo.
