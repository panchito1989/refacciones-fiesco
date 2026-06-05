# Fase 2 — Motor de contenido GEO: guías (Plan 11) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Guías de reparación renderizadas en servidor con **datos estructurados HowTo + FAQPage** (lo que hace que la IA y Google te citen). El admin crea/edita guías; las guías aparecen en `/guias` y `/guias/[slug]`, en el sitemap y enlazadas desde la home.

**Architecture:** Modelo `Guia` (titulo, slug, resumen, intro, `pasos` Json, `faqs` Json, status). Páginas SSR `/guias` (índice) y `/guias/[slug]` (guía con JSON-LD HowTo + FAQPage). Admin con formulario que parsea pasos/faqs desde textareas (formato `Título | Descripción` por línea). Sitemap y home enlazan a las guías.

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6.

## Convenciones
- Windows + PowerShell. Dev: `Start-Process cmd -ArgumentList "/c","npm run dev"` + poll; matar node de 3000 al final.
- Cada tarea termina en commit. No `.env*`.
- **Seguridad:** la tabla nueva `Guia` debe tener RLS (se añade en la misma migración).

## Contexto ya existente (NO recrear)
- `lib/prisma.ts`, `lib/auth.ts` (`requireAdmin`), `lib/slug.ts` (`slugify`).
- `app/sitemap.ts` (incluye home + categorías + productos + equivalencias; usa `const SITE = ...`).
- `app/admin/layout.tsx` (nav: Productos/Pedidos/Solicitudes/Cotizaciones).
- `app/(storefront)/page.tsx` (home; tiene secciones; al final una banda CTA `<section className="bg-slate-900 ...">`).
- `components/ui/button.tsx` (`ButtonLink`).
- Prisma soporta tipo `Json`.

## Estructura de archivos
```
prisma/schema.prisma                       # MOD: modelo Guia + enum GuiaStatus
prisma/migrations/<ts>_add_guia/            # NUEVO: migración (tabla + RLS)
prisma/seed-guias.mjs                       # NUEVO: una guía de ejemplo
package.json                                # MOD: script db:seed:guias
lib/guias.ts                                # NUEVO: tipos + parse/format de pasos/faqs
app/(storefront)/guias/page.tsx             # NUEVO: índice de guías
app/(storefront)/guias/[slug]/page.tsx      # NUEVO: guía + JSON-LD HowTo/FAQ
app/(storefront)/page.tsx                   # MOD: sección "Guías" en la home
app/sitemap.ts                              # MOD: incluir guías
app/admin/layout.tsx                        # MOD: nav + Guías
app/admin/guias/page.tsx                    # NUEVO: lista admin
app/admin/guias/nuevo/page.tsx              # NUEVO: alta
app/admin/guias/[id]/editar/page.tsx        # NUEVO: edición
app/admin/guias/actions.ts                  # NUEVO: crear/actualizar/eliminar/publicar
components/admin/guia-form.tsx              # NUEVO: formulario compartido
```

---

### Task 1: Modelo Guia (+ RLS) + helpers + seed

**Files:** Modify `prisma/schema.prisma`, `package.json`; Create the migration SQL, `prisma/seed-guias.mjs`, `lib/guias.ts`.

- [ ] **Step 1: Append to `prisma/schema.prisma`:**
```prisma
enum GuiaStatus {
  BORRADOR
  PUBLICADO
}

model Guia {
  id        String     @id @default(cuid())
  titulo    String
  slug      String     @unique
  resumen   String
  intro     String
  pasos     Json       @default("[]")
  faqs      Json       @default("[]")
  status    GuiaStatus @default(BORRADOR)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

- [ ] **Step 2: Crear la migración SOLO de creación (para inyectar RLS):**
```powershell
npx prisma migrate dev --create-only --name add_guia
```
Localizar la carpeta creada `prisma/migrations/<ts>_add_guia/` y, al FINAL de su `migration.sql`, añadir:
```sql

-- Seguridad: RLS en la tabla nueva (bloquea acceso anónimo vía Data API).
ALTER TABLE "Guia" ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Aplicar la migración**
```powershell
npx prisma migrate dev
```
Expected: "Applying migration ..._add_guia" + "in sync".

- [ ] **Step 4: Create `lib/guias.ts`** — EXACTO (tipos + parse/format):
```typescript
export type Paso = { titulo: string; descripcion: string };
export type Faq = { pregunta: string; respuesta: string };

export function parsePasos(raw: string): Paso[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const idx = l.indexOf("|");
      if (idx >= 0) return { titulo: l.slice(0, idx).trim(), descripcion: l.slice(idx + 1).trim() };
      return { titulo: `Paso ${i + 1}`, descripcion: l };
    });
}

export function parseFaqs(raw: string): Faq[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf("|");
      if (idx < 0) return null;
      return { pregunta: l.slice(0, idx).trim(), respuesta: l.slice(idx + 1).trim() };
    })
    .filter((f): f is Faq => f !== null && f.pregunta.length > 0 && f.respuesta.length > 0);
}

export function pasosToText(pasos: Paso[]): string {
  return pasos.map((p) => `${p.titulo} | ${p.descripcion}`).join("\n");
}

export function faqsToText(faqs: Faq[]): string {
  return faqs.map((f) => `${f.pregunta} | ${f.respuesta}`).join("\n");
}
```

- [ ] **Step 5: Create `prisma/seed-guias.mjs`** — EXACTO (una guía de ejemplo, publicada):
```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const guia = {
  titulo: "Cómo cambiar el termostato de tu refrigerador",
  slug: "como-cambiar-termostato-refrigerador",
  resumen: "Guía paso a paso para reemplazar el termostato de un refrigerador doméstico de forma segura.",
  intro: "Si tu refrigerador no enfría bien o no apaga el compresor, el termostato puede ser el culpable. Cambiarlo es sencillo con la pieza correcta. Sigue estos pasos.",
  pasos: [
    { titulo: "Desconecta el refrigerador", descripcion: "Desenchufa el aparato de la corriente antes de cualquier manipulación." },
    { titulo: "Localiza el termostato", descripcion: "Suele estar dentro del refrigerador, junto a la perilla de temperatura." },
    { titulo: "Retira la perilla y la cubierta", descripcion: "Quita la perilla y los tornillos de la cubierta para acceder al termostato." },
    { titulo: "Desconecta el termostato viejo", descripcion: "Anota la posición de los cables y desconéctalos del termostato dañado." },
    { titulo: "Instala el nuevo termostato", descripcion: "Conecta los cables en la misma posición y fija el nuevo termostato." },
    { titulo: "Prueba el funcionamiento", descripcion: "Coloca la cubierta, enchufa y verifica que enfríe correctamente." },
  ],
  faqs: [
    { pregunta: "¿Cómo sé si el termostato está dañado?", respuesta: "Si el refrigerador no enfría, enfría de más, o el compresor no apaga, suele ser el termostato." },
    { pregunta: "¿Necesito un técnico?", respuesta: "Es un cambio sencillo, pero si no te sientes seguro, en Refacciones Fiesco un técnico lo instala a domicilio." },
  ],
  status: "PUBLICADO",
};
try {
  await prisma.guia.upsert({ where: { slug: guia.slug }, update: guia, create: guia });
  console.log("SEED_GUIAS_OK");
} catch (e) {
  console.error("SEED_GUIAS_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
```
Agregar a `package.json` scripts: `"db:seed:guias": "node --env-file=.env prisma/seed-guias.mjs"`, y correr:
```powershell
npm run db:seed:guias
```
Expected: `SEED_GUIAS_OK`.

- [ ] **Step 6: Typecheck**
```powershell
npx prisma generate ; if ($?) { npx tsc --noEmit }
```
Expected: sin errores.

- [ ] **Step 7: Commit**
```powershell
git add prisma package.json lib/guias.ts
git commit -m "feat: Guia model (+RLS) + content helpers + seed guide"
```

---

### Task 2: Páginas públicas de guías + JSON-LD + sitemap + home

**Files:** Create `app/(storefront)/guias/page.tsx`, `app/(storefront)/guias/[slug]/page.tsx`; Modify `app/(storefront)/page.tsx`, `app/sitemap.ts`.

- [ ] **Step 1: Create `app/(storefront)/guias/page.tsx`** (índice):
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Guías de reparación de electrodomésticos",
  description:
    "Guías paso a paso para reparar tus electrodomésticos: refrigeradores, lavadoras y más. Con la refacción correcta, tú puedes.",
};

export default async function GuiasPage() {
  const guias = await prisma.guia.findMany({
    where: { status: "PUBLICADO" },
    orderBy: { createdAt: "desc" },
    select: { slug: true, titulo: true, resumen: true },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold text-slate-900">Guías de reparación</h1>
      <p className="mt-2 text-slate-600">Aprende a reparar tus electrodomésticos paso a paso.</p>
      {guias.length === 0 ? (
        <p className="mt-6 text-slate-500">Pronto publicaremos guías.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {guias.map((g) => (
            <li key={g.slug}>
              <Link href={`/guias/${g.slug}`} className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm">
                <h2 className="font-semibold text-slate-900">{g.titulo}</h2>
                <p className="mt-1 text-sm text-slate-600">{g.resumen}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(storefront)/guias/[slug]/page.tsx`** (guía + JSON-LD HowTo + FAQPage):
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Paso, Faq } from "@/lib/guias";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guia = await prisma.guia.findUnique({ where: { slug } });
  if (!guia || guia.status !== "PUBLICADO") return { title: "Guía no encontrada" };
  return { title: guia.titulo, description: guia.resumen };
}

export default async function GuiaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const guia = await prisma.guia.findUnique({ where: { slug } });
  if (!guia || guia.status !== "PUBLICADO") notFound();

  const pasos = (guia.pasos as unknown as Paso[]) ?? [];
  const faqs = (guia.faqs as unknown as Faq[]) ?? [];

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guia.titulo,
    description: guia.resumen,
    step: pasos.map((p, i) => ({ "@type": "HowToStep", position: i + 1, name: p.titulo, text: p.descripcion })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: { "@type": "Answer", text: f.respuesta },
    })),
  };
  const escape = (o: unknown) =>
    JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

  return (
    <article className="mx-auto max-w-2xl p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escape(howTo) }} />
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escape(faqLd) }} />
      )}

      <h1 className="text-3xl font-bold text-slate-900">{guia.titulo}</h1>
      <p className="mt-3 text-slate-700">{guia.intro}</p>

      {pasos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Paso a paso</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5">
            {pasos.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.titulo}.</span> {p.descripcion}
              </li>
            ))}
          </ol>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
          <dl className="mt-3 space-y-4">
            {faqs.map((f, i) => (
              <div key={i}>
                <dt className="font-medium text-slate-900">{f.pregunta}</dt>
                <dd className="mt-1 text-slate-600">{f.respuesta}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Añadir sección "Guías" a la home** `app/(storefront)/page.tsx`: importar `Link` (si no está) y, JUSTO ANTES de la banda CTA `<section className="bg-slate-900 ...">`, insertar:
```tsx
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Guías de reparación</h2>
          <p className="mt-1 text-slate-600">Aprende a reparar tus electrodomésticos paso a paso.</p>
          <Link href="/guias" className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline">
            Ver guías →
          </Link>
        </div>
      </section>
```

- [ ] **Step 4: Ampliar `app/sitemap.ts`** — incluir las guías publicadas. Añadir a la consulta `Promise.all` una query de guías y sus URLs. Tras los `categoryUrls`/`equivalenceUrls`, agregar:
```typescript
  const guias = await prisma.guia.findMany({ where: { status: "PUBLICADO" }, select: { slug: true, updatedAt: true } });
  const guiaUrls = guias.map((g) => ({ url: `${SITE}/guias/${g.slug}`, lastModified: g.updatedAt }));
```
e incluir `{ url: `${SITE}/guias`, lastModified: new Date() }` y `...guiaUrls` en el arreglo retornado.

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
  $idx = (Invoke-WebRequest http://localhost:3000/guias -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("indice guias: " + ($idx -match 'termostato'))
  $g = (Invoke-WebRequest http://localhost:3000/guias/como-cambiar-termostato-refrigerador -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("guia HowTo: " + ($g -match '"@type":"HowTo"'))
  Write-Output ("guia FAQPage: " + ($g -match '"@type":"FAQPage"'))
  $sm = (Invoke-WebRequest http://localhost:3000/sitemap.xml -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("sitemap guia: " + ($sm -match 'guias/como-cambiar-termostato'))
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: las cuatro líneas True.

- [ ] **Step 7: Commit**
```powershell
git add app
git commit -m "feat: GEO content guides (HowTo + FAQ schema) + sitemap + home link"
```

---

### Task 3: Admin de guías (CRUD)

**Files:** Modify `app/admin/layout.tsx`; Create `components/admin/guia-form.tsx`, `app/admin/guias/actions.ts`, `app/admin/guias/page.tsx`, `app/admin/guias/nuevo/page.tsx`, `app/admin/guias/[id]/editar/page.tsx`.

- [ ] **Step 1: Nav** — en `app/admin/layout.tsx`, dentro del `<nav>`, agregar tras "Cotizaciones":
```tsx
        <Link href="/admin/guias" className="text-blue-700 hover:underline">Guías</Link>
```

- [ ] **Step 2: Create `components/admin/guia-form.tsx`:**
```tsx
import type { Guia } from "@prisma/client";
import { pasosToText, faqsToText, type Paso, type Faq } from "@/lib/guias";

export function GuiaForm({
  action,
  guia,
  submitLabel = "Guardar",
}: {
  action: (formData: FormData) => void;
  guia?: Guia | null;
  submitLabel?: string;
}) {
  const input = "rounded border border-slate-300 p-2";
  const pasosTxt = guia ? pasosToText((guia.pasos as unknown as Paso[]) ?? []) : "";
  const faqsTxt = guia ? faqsToText((guia.faqs as unknown as Faq[]) ?? []) : "";
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3">
      <input name="titulo" placeholder="Título" className={input} required defaultValue={guia?.titulo ?? ""} />
      <input name="resumen" placeholder="Resumen (1 línea)" className={input} required defaultValue={guia?.resumen ?? ""} />
      <textarea name="intro" placeholder="Introducción" className={input} rows={3} required defaultValue={guia?.intro ?? ""} />
      <label className="text-sm text-slate-500">Pasos (uno por línea, formato: Título | Descripción)</label>
      <textarea name="pasos" className={input} rows={6} defaultValue={pasosTxt} />
      <label className="text-sm text-slate-500">FAQs (una por línea, formato: Pregunta | Respuesta)</label>
      <textarea name="faqs" className={input} rows={4} defaultValue={faqsTxt} />
      <select name="status" className={input} defaultValue={guia?.status ?? "BORRADOR"}>
        <option value="BORRADOR">Borrador</option>
        <option value="PUBLICADO">Publicado</option>
      </select>
      <button type="submit" className="rounded bg-black p-2 text-white">{submitLabel}</button>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/admin/guias/actions.ts`:**
```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { parsePasos, parseFaqs } from "@/lib/guias";

function leerGuia(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const resumen = String(formData.get("resumen") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const pasos = parsePasos(String(formData.get("pasos") ?? ""));
  const faqs = parseFaqs(String(formData.get("faqs") ?? ""));
  const status = String(formData.get("status") ?? "BORRADOR") === "PUBLICADO" ? "PUBLICADO" : "BORRADOR";
  if (!titulo || !resumen || !intro) throw new Error("Faltan campos (título, resumen, introducción).");
  return { titulo, slug: slugify(titulo), resumen, intro, pasos, faqs, status: status as "BORRADOR" | "PUBLICADO" };
}

export async function crearGuia(formData: FormData) {
  await requireAdmin();
  await prisma.guia.create({ data: leerGuia(formData) });
  revalidatePath("/admin/guias");
  redirect("/admin/guias");
}

export async function actualizarGuia(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.guia.update({ where: { id }, data: leerGuia(formData) });
  revalidatePath("/admin/guias");
  redirect("/admin/guias");
}

export async function eliminarGuia(id: string) {
  await requireAdmin();
  await prisma.guia.delete({ where: { id } });
  revalidatePath("/admin/guias");
}
```

- [ ] **Step 4: Create `app/admin/guias/page.tsx`:**
```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { eliminarGuia } from "./actions";

export default async function AdminGuiasPage() {
  const guias = await prisma.guia.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Guías</h1>
        <Link href="/admin/guias/nuevo" className="rounded bg-black px-3 py-2 text-white">Nueva guía</Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b"><th className="py-2">Título</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {guias.map((g) => (
            <tr key={g.id} className="border-b">
              <td className="py-2">{g.titulo}</td>
              <td>{g.status === "PUBLICADO" ? "Publicado" : "Borrador"}</td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/guias/${g.id}/editar`} className="text-blue-700 hover:underline">Editar</Link>
                <form action={eliminarGuia.bind(null, g.id)}>
                  <button className="text-red-600 hover:underline">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
          {guias.length === 0 && (
            <tr><td colSpan={3} className="py-6 text-center text-gray-500">Aún no hay guías.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Create `app/admin/guias/nuevo/page.tsx`:**
```tsx
import { GuiaForm } from "@/components/admin/guia-form";
import { crearGuia } from "../actions";

export default function NuevaGuiaPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Nueva guía</h1>
      <GuiaForm action={crearGuia} submitLabel="Crear guía" />
    </div>
  );
}
```

- [ ] **Step 6: Create `app/admin/guias/[id]/editar/page.tsx`:**
```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GuiaForm } from "@/components/admin/guia-form";
import { actualizarGuia } from "../../actions";

export default async function EditarGuiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guia = await prisma.guia.findUnique({ where: { id } });
  if (!guia) notFound();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar guía</h1>
      <GuiaForm action={actualizarGuia.bind(null, guia.id)} guia={guia} submitLabel="Guardar cambios" />
    </div>
  );
}
```

- [ ] **Step 7: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 8: Verificar** — `/admin/guias` sin sesión redirige a `/admin/login` (cmd /c + poll; matar node 3000).

- [ ] **Step 9: Commit**
```powershell
git add app/admin components/admin/guia-form.tsx
git commit -m "feat: admin guides CRUD (GEO content management)"
```

---

## Definición de "terminado" (Plan 11)
- Existe el modelo `Guia` (con RLS); hay una guía de ejemplo publicada.
- `/guias` y `/guias/[slug]` renderizan en servidor con **HowTo + FAQPage JSON-LD** (lo que la IA cita); la home enlaza a guías; el sitemap las incluye.
- El admin gestiona guías (crear/editar/eliminar/publicar) en `/admin/guias`.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Próximo plan
- **Plan 12:** Mercado Pago (tarjeta — requiere credenciales), CFDI, cliente preferente, WhatsApp, búsqueda por foto, deploy, drones.
