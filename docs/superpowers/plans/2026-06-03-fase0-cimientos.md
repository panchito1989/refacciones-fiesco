# Fase 0 — Cimientos + Primer Producto en Vivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar el esqueleto de la tienda: app Next.js desplegada en Vercel, base de datos Postgres (Supabase) conectada vía Prisma, un panel de admin protegido que da de alta productos, y una ficha de producto renderizada en servidor con datos estructurados schema.org — la base técnica del SEO/GEO.

**Architecture:** Next.js (App Router, TypeScript, Tailwind) renderizado en servidor en Vercel. Datos en Supabase Postgres, modelados con Prisma. Autenticación de admin con Supabase Auth. La lógica pura (slugs, formato de moneda, regla de envío) se construye con TDD usando Vitest; la infraestructura se verifica corriendo la app y revisando migraciones.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma, Supabase (Postgres + Auth), Vitest, Vercel.

---

## Convenciones

- Sistema operativo del desarrollador: **Windows + PowerShell**. Los comandos son compatibles.
- Gestor de paquetes: **npm**.
- Moneda: los precios se guardan en **centavos (entero)** para evitar errores de punto flotante. `59900` = $599.00 MXN.
- Cada tarea termina en **commit**. Commits frecuentes.

## Estructura de archivos (qué crea/toca este plan)

```
/ (raíz del proyecto)
├── app/
│   ├── layout.tsx                     # layout raíz + metadata base
│   ├── page.tsx                       # home placeholder
│   ├── robots.ts                      # robots.txt (incluye crawlers de IA)
│   ├── sitemap.ts                     # sitemap dinámico
│   ├── refaccion/[marca]/[slug]/page.tsx  # ficha de producto (SSR + JSON-LD)
│   └── admin/
│       ├── layout.tsx                 # guard de sesión admin
│       ├── login/page.tsx             # login admin
│       └── productos/
│           ├── page.tsx               # lista de productos
│           ├── nuevo/page.tsx         # alta de producto
│           └── actions.ts             # server actions (crear/editar)
├── lib/
│   ├── format.ts                      # formatMXN
│   ├── slug.ts                        # slugify, productPath
│   ├── shipping.ts                    # isFreeShipping
│   ├── prisma.ts                      # cliente Prisma singleton
│   └── supabase/
│       ├── server.ts                  # cliente Supabase (server)
│       └── middleware.ts              # refresco de sesión
├── prisma/
│   └── schema.prisma                  # modelos Product, Category
├── public/
│   └── llms.txt                       # guía para crawlers de IA
├── tests/
│   ├── format.test.ts
│   ├── slug.test.ts
│   └── shipping.test.ts
├── middleware.ts                      # conecta refresco de sesión Supabase
├── vitest.config.ts
├── .env.local                         # secretos (NO se commitea)
└── .env.example                       # plantilla de variables
```

---

### Task 1: Scaffold del proyecto Next.js + git

**Files:**
- Create: todo el esqueleto generado por `create-next-app`
- Create: `.gitignore` (lo genera create-next-app; verificar que incluye `.env*`)

- [ ] **Step 1: Generar el proyecto Next.js en una carpeta temporal**

La raíz `E:\Refacciones-Fiesco` NO está vacía (contiene `.claude/` y `docs/`), y `create-next-app`
se niega a correr en una carpeta con archivos que no reconoce. Por eso generamos en una subcarpeta
temporal `_scaffold` **sin instalar dependencias** y luego movemos todo a la raíz.

```powershell
npx create-next-app@latest _scaffold --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --skip-install --yes
```

Expected: crea `_scaffold/` con `app/`, `package.json`, `tsconfig.json`, `next.config.ts`,
`.gitignore`, etc. (sin `node_modules/`).

- [ ] **Step 2: Mover los archivos generados a la raíz y borrar la temporal**

```powershell
Get-ChildItem -Path _scaffold -Force | Move-Item -Destination . -Force
Remove-Item _scaffold -Recurse -Force
```

Expected: `app/`, `package.json`, `.gitignore`, etc. quedan en la raíz, junto a `docs/` y `.claude/`.
Verificar con `Test-Path package.json` → `True`.

- [ ] **Step 3: Instalar dependencias**

```powershell
npm install
```

Expected: crea `node_modules/` y `package-lock.json`.

- [ ] **Step 4: Verificar que la app corre**

Arrancar el servidor en segundo plano y comprobar que responde, luego detenerlo:

```powershell
$p = Start-Process npm -ArgumentList "run","dev" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 12
try { (Invoke-WebRequest http://localhost:3000 -UseBasicParsing).StatusCode } finally { Stop-Process -Id $p.Id -Force }
```

Expected: imprime `200`. (Si el puerto 3000 está ocupado, Next usa otro; ajustar la URL.)

- [ ] **Step 5: Confirmar que `.gitignore` protege secretos**

Abrir `.gitignore` y verificar que contiene una línea que ignora `.env*` (create-next-app la incluye). Si no está, agregar:

```
# local env files
.env*
!.env.example
```

- [ ] **Step 6: Inicializar git y primer commit**

```powershell
git init
git add -A
git commit -m "chore: scaffold Next.js app (App Router, TS, Tailwind)"
```

Expected: repositorio inicializado, primer commit creado.

---

### Task 2: Configurar Vitest (loop de TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Instalar Vitest**

```powershell
npm install -D vitest
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Escribir un test smoke que falla**

`tests/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("suma", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Agregar script de test en `package.json`**

En la sección `"scripts"` agregar:

```json
"test": "vitest run"
```

- [ ] **Step 5: Correr los tests**

```powershell
npm test
```

Expected: PASS — 1 test pasa. El loop de TDD funciona.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "test: set up Vitest"
```

---

### Task 3: Prisma + conexión a Supabase + esquema base

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `.env.example`
- Modify: `.env.local` (secretos reales — no se commitea)

- [ ] **Step 1: Crear el proyecto en Supabase**

En el dashboard de Supabase (o vía el conector Supabase disponible en esta sesión), crear un proyecto nuevo, región México/US‑East. Obtener:
- `Project URL` y `anon key` (Settings → API)
- `service_role key` (Settings → API)
- Cadenas de conexión a Postgres (Settings → Database):
  - **Connection pooling** (puerto 6543, modo `transaction`) → para `DATABASE_URL`
  - **Direct connection** (puerto 5432) → para `DIRECT_URL`

- [ ] **Step 2: Instalar Prisma**

```powershell
npm install -D prisma
npm install @prisma/client
npx prisma init
```

Expected: crea `prisma/schema.prisma` y agrega `DATABASE_URL` a `.env`. Renombrar/usar `.env.local`.

- [ ] **Step 3: Escribir `.env.local` (secretos reales)**

Sustituir los valores `<...>` por los de tu proyecto Supabase:

```
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

- [ ] **Step 4: Crear `.env.example` (plantilla, sí se commitea)**

```
DATABASE_URL=""
DIRECT_URL=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

- [ ] **Step 5: Definir el esquema base en `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum ProductCondition {
  NUEVO
  RECUPERADO
}

enum ProductStatus {
  BORRADOR
  PUBLICADO
}

model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  parentId  String?
  parent    Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Product {
  id           String           @id @default(cuid())
  sku          String           @unique
  partNumber   String
  name         String
  slug         String
  description  String?
  brand        String
  brandSlug    String
  categoryId   String?
  category     Category?        @relation(fields: [categoryId], references: [id])
  condition    ProductCondition @default(NUEVO)
  warranty     String?
  priceCents   Int
  stock        Int              @default(0)
  photos       String[]         @default([])
  equivalences String[]         @default([])
  status       ProductStatus    @default(BORRADOR)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([brandSlug, slug])
  @@index([partNumber])
}
```

- [ ] **Step 6: Crear cliente Prisma singleton en `lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 7: Crear la primera migración y aplicarla**

```powershell
npx prisma migrate dev --name init
```

Expected: crea `prisma/migrations/<timestamp>_init/`, aplica las tablas en Supabase, genera el cliente. Verificar con:

```powershell
npx prisma migrate status
```

Expected: "Database schema is up to date!"

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "feat: add Prisma + Supabase schema (Product, Category)"
```

---

### Task 4: Lógica pura con TDD (formato, slug, envío)

**Files:**
- Create/Test: `tests/format.test.ts` → `lib/format.ts`
- Create/Test: `tests/slug.test.ts` → `lib/slug.ts`
- Create/Test: `tests/shipping.test.ts` → `lib/shipping.ts`

- [ ] **Step 1: Test de `formatMXN` (falla)**

`tests/format.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatMXN } from "@/lib/format";

describe("formatMXN", () => {
  it("formatea centavos a pesos MXN", () => {
    expect(formatMXN(59900)).toBe("$599.00");
    expect(formatMXN(0)).toBe("$0.00");
    expect(formatMXN(1050)).toBe("$10.50");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```powershell
npx vitest run tests/format.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/format'".

> Nota: para que `@/` funcione en Vitest, agregar el alias en `vitest.config.ts`:
> ```typescript
> import { defineConfig } from "vitest/config";
> import path from "node:path";
> export default defineConfig({
>   resolve: { alias: { "@": path.resolve(__dirname, ".") } },
>   test: { environment: "node", include: ["tests/**/*.test.ts"] },
> });
> ```

- [ ] **Step 3: Implementar `lib/format.ts`**

```typescript
export function formatMXN(cents: number): string {
  const pesos = cents / 100;
  return `$${pesos.toFixed(2)}`;
}
```

- [ ] **Step 4: Verificar que pasa**

```powershell
npx vitest run tests/format.test.ts
```

Expected: PASS.

- [ ] **Step 5: Test de `slugify` y `productPath` (falla)**

`tests/slug.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { slugify, productPath } from "@/lib/slug";

describe("slugify", () => {
  it("convierte a kebab-case sin acentos ni símbolos", () => {
    expect(slugify("Termostato Refrigerador")).toBe("termostato-refrigerador");
    expect(slugify("Válvula 1/2\" Níquel")).toBe("valvula-1-2-niquel");
    expect(slugify("  WR55X10942  ")).toBe("wr55x10942");
  });
});

describe("productPath", () => {
  it("arma la URL semántica /refaccion/[marca]/[parte]-[slug]", () => {
    expect(
      productPath({ brandSlug: "mabe", partNumber: "WR55X10942", slug: "termostato" })
    ).toBe("/refaccion/mabe/wr55x10942-termostato");
  });
});
```

- [ ] **Step 6: Correr y verificar que falla**

```powershell
npx vitest run tests/slug.test.ts
```

Expected: FAIL — módulo no encontrado.

- [ ] **Step 7: Implementar `lib/slug.ts`**

```typescript
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita acentos (marcas diacriticas)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // todo lo no alfanumérico → guion
    .replace(/^-+|-+$/g, ""); // sin guiones al inicio/fin
}

export function productPath(p: {
  brandSlug: string;
  partNumber: string;
  slug: string;
}): string {
  return `/refaccion/${p.brandSlug}/${slugify(p.partNumber)}-${p.slug}`;
}
```

- [ ] **Step 8: Verificar que pasa**

```powershell
npx vitest run tests/slug.test.ts
```

Expected: PASS.

- [ ] **Step 9: Test de `isFreeShipping` (regla > $599) (falla)**

`tests/shipping.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isFreeShipping, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

describe("isFreeShipping", () => {
  it("envío gratis cuando el subtotal supera $599", () => {
    expect(FREE_SHIPPING_THRESHOLD_CENTS).toBe(59900);
    expect(isFreeShipping(60000)).toBe(true);
    expect(isFreeShipping(59900)).toBe(false); // "mayores a 599" = estrictamente mayor
    expect(isFreeShipping(0)).toBe(false);
  });
});
```

- [ ] **Step 10: Correr y verificar que falla**

```powershell
npx vitest run tests/shipping.test.ts
```

Expected: FAIL — módulo no encontrado.

- [ ] **Step 11: Implementar `lib/shipping.ts`**

```typescript
export const FREE_SHIPPING_THRESHOLD_CENTS = 59900; // $599.00

export function isFreeShipping(subtotalCents: number): boolean {
  return subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS;
}
```

- [ ] **Step 12: Correr toda la suite**

```powershell
npm test
```

Expected: PASS — todos los tests verdes.

- [ ] **Step 13: Commit**

```powershell
git add -A
git commit -m "feat: add pure helpers (formatMXN, slug, shipping) with TDD"
```

---

### Task 5: Base técnica de SEO/GEO (robots, sitemap, llms.txt, metadata)

**Files:**
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Create: `public/llms.txt`
- Modify: `app/layout.tsx` (metadata base)
- Create: `.env.local` (+ `NEXT_PUBLIC_SITE_URL`)

- [ ] **Step 1: Agregar la URL pública del sitio a `.env.local` y `.env.example`**

En ambos archivos (en `.env.local` con valor real, p.ej. el dominio de Vercel o el final):

```
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

- [ ] **Step 2: Crear `app/robots.ts` (permite crawlers de IA explícitamente)**

```typescript
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Buscadores y crawlers de IA: acceso total al catálogo público
      { userAgent: "*", allow: "/", disallow: ["/admin"] },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
```

- [ ] **Step 3: Crear `app/sitemap.ts` (incluye productos publicados)**

```typescript
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/slug";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLICADO" },
    select: { brandSlug: true, partNumber: true, slug: true, updatedAt: true },
  });

  const productUrls = products.map((p) => ({
    url: `${SITE}${productPath(p)}`,
    lastModified: p.updatedAt,
  }));

  return [{ url: SITE, lastModified: new Date() }, ...productUrls];
}
```

- [ ] **Step 4: Crear `public/llms.txt`**

```
# Refacciones Fiesco

> Tienda en línea de refacciones de electrodomésticos en México. Piezas nuevas y
> recuperadas con garantía, servicio técnico a domicilio y la promesa de conseguir
> cualquier pieza.

## Qué encontrarás aquí
- Catálogo de refacciones por número de parte, nombre y marca.
- Equivalencias entre números de parte de distintas marcas.
- Servicio técnico de instalación a domicilio.

## Contacto
- Sitio: https://www.refaccionesfiesco.com
```

- [ ] **Step 5: Definir metadata base en `app/layout.tsx`**

Reemplazar el objeto `metadata` generado por create-next-app por:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Refacciones Fiesco — Refacciones de electrodomésticos",
    template: "%s | Refacciones Fiesco",
  },
  description:
    "Refacciones de electrodomésticos, nuevas y recuperadas con garantía. Si no la tenemos, te la conseguimos. Envíos a todo México.",
};
```

- [ ] **Step 6: Verificar que las rutas SEO responden**

```powershell
npm run dev
```

Visitar `http://localhost:3000/robots.txt` y `http://localhost:3000/sitemap.xml`.
Expected: `robots.txt` lista los user-agents de IA y el sitemap; `sitemap.xml` devuelve XML válido (con solo la home si aún no hay productos publicados). Detener con Ctrl+C.

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: SEO/GEO base (robots, sitemap, llms.txt, metadata)"
```

---

### Task 6: Autenticación de admin (Supabase Auth) + ruta protegida

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Instalar dependencias de Supabase**

```powershell
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Crear el usuario admin en Supabase**

En el dashboard de Supabase → Authentication → Users → "Add user": crear el correo del dueño (`issacfiesco66@gmail.com`) con contraseña. (En Fase 1 se distinguen roles; por ahora, cualquier usuario autenticado es admin.)

- [ ] **Step 3: Crear cliente Supabase de servidor `lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // llamado desde un Server Component: ignorar (lo refresca el middleware)
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Crear refresco de sesión `lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}
```

- [ ] **Step 5: Crear `middleware.ts` (raíz)**

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 6: Crear el guard `app/admin/layout.tsx`**

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return <div className="mx-auto max-w-5xl p-6">{children}</div>;
}
```

- [ ] **Step 7: Crear `app/admin/login/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin/productos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-20 flex max-w-sm flex-col gap-3">
      <h1 className="text-xl font-semibold">Acceso administrador</h1>
      <input
        className="rounded border p-2"
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="rounded border p-2"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black p-2 text-white" type="submit">
        Entrar
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Verificar el guard**

```powershell
npm run dev
```

Visitar `http://localhost:3000/admin/productos` sin sesión → Expected: redirige a `/admin/login`. Iniciar sesión con el usuario creado → Expected: llega a `/admin/productos` (aún 404/vacío, se crea en Task 7). Detener con Ctrl+C.

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "feat: admin auth with Supabase + protected route"
```

---

### Task 7: Admin — alta y listado de productos

**Files:**
- Create: `app/admin/productos/actions.ts`
- Create: `app/admin/productos/page.tsx`
- Create: `app/admin/productos/nuevo/page.tsx`

- [ ] **Step 1: Crear server action de alta `app/admin/productos/actions.ts`**

```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function crearProducto(formData: FormData) {
  // Seguridad: solo usuarios autenticados
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
    String(formData.get("condition") ?? "NUEVO") === "RECUPERADO"
      ? "RECUPERADO"
      : "NUEVO";

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
      status: "BORRADOR",
    },
  });

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
```

- [ ] **Step 2: Crear la lista `app/admin/productos/page.tsx`**

```typescript
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

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
              <td>{p.status}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-gray-500">
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

- [ ] **Step 3: Crear el formulario `app/admin/productos/nuevo/page.tsx`**

```typescript
import { crearProducto } from "../actions";

export default function NuevoProductoPage() {
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
      <button type="submit" className="rounded bg-black p-2 text-white">
        Guardar
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Verificar el flujo de alta**

```powershell
npm run dev
```

Con sesión iniciada: ir a `/admin/productos/nuevo`, crear un producto (ej. SKU `TEST-001`, nombre "Termostato", número de parte `WR55X10942`, marca "Mabe", precio `599`, stock `5`). Expected: redirige a la lista y el producto aparece con precio `$599.00`. Detener con Ctrl+C.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: admin product create + list"
```

---

### Task 8: Ficha de producto pública (SSR + JSON-LD schema.org)

**Files:**
- Create: `app/refaccion/[marca]/[slug]/page.tsx`

- [ ] **Step 1: Crear la página de producto con datos estructurados**

`app/refaccion/[marca]/[slug]/page.tsx`. La ruta `[slug]` recibe `<numero-parte>-<slug-nombre>`; resolvemos el producto por `brandSlug` + el `partNumber` contenido en el slug.

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { slugify } from "@/lib/slug";

type Params = { marca: string; slug: string };

async function getProduct(marca: string, slug: string) {
  // slug = "<numero-parte-slug>-<nombre-slug>"; el partNumber slug es el prefijo
  const products = await prisma.product.findMany({
    where: { brandSlug: marca, status: "PUBLICADO" },
  });
  return (
    products.find((p) => slug === `${slugify(p.partNumber)}-${p.slug}`) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { marca, slug } = await params;
  const product = await getProduct(marca, slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: `${product.name} ${product.partNumber} — ${product.brand}`,
    description:
      product.description ??
      `${product.name} para ${product.brand}. Refacción ${product.condition.toLowerCase()} con garantía. Envíos a todo México.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { marca, slug } = await params;
  const product = await getProduct(marca, slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.partNumber,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition:
        product.condition === "NUEVO"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/RefurbishedCondition",
    },
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-600">
        {product.brand} · Núm. de parte {product.partNumber}
      </p>
      <p className="mt-4 text-3xl font-semibold">{formatMXN(product.priceCents)}</p>
      <p className="mt-1 text-sm">
        {product.condition === "NUEVO" ? "Nuevo" : "Recuperado"}
        {product.warranty ? ` · Garantía: ${product.warranty}` : ""}
      </p>
      <p className="mt-1 text-sm">
        {product.stock > 0 ? "En existencia" : "Bajo pedido — te lo conseguimos"}
      </p>
      {product.description && <p className="mt-4">{product.description}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Publicar el producto de prueba y verificar el render**

En Supabase (dashboard → Table editor → `Product`) o ampliando el admin, cambiar el `status` del producto de prueba a `PUBLICADO`. Luego:

```powershell
npm run dev
```

Visitar `http://localhost:3000/refaccion/mabe/wr55x10942-termostato`.
Expected: la ficha renderiza nombre, precio `$599.00`, condición, y el `<script type="application/ld+json">` con el Product schema está presente en el HTML (Ver código fuente de la página). Detener con Ctrl+C.

- [ ] **Step 3: Verificar el sitemap incluye el producto**

Visitar `http://localhost:3000/sitemap.xml` → Expected: aparece la URL `/refaccion/mabe/wr55x10942-termostato`.

- [ ] **Step 4: Correr toda la suite de tests**

```powershell
npm test
```

Expected: PASS — todos verdes.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: public product page (SSR + Product JSON-LD)"
```

---

### Task 9: Despliegue a Vercel

**Files:**
- Modify: `package.json` (script de build con `prisma generate`)

- [ ] **Step 1: Asegurar que el build genera el cliente Prisma**

En `package.json`, cambiar el script `build` para que Vercel genere el cliente Prisma:

```json
"build": "prisma generate && next build"
```

- [ ] **Step 2: Subir el repo a GitHub**

Crear un repositorio remoto y subir:

```powershell
gh repo create refacciones-fiesco --private --source=. --remote=origin --push
```

(O crear el repo en GitHub manualmente y `git remote add origin ...; git push -u origin main`.)

- [ ] **Step 3: Conectar el proyecto en Vercel**

En Vercel: "Add New Project" → importar el repo. Configurar las **Environment Variables** (las mismas de `.env.local`: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, y `NEXT_PUBLIC_SITE_URL` con la URL final de Vercel).

> Nota: el conector de Vercel disponible en esta sesión puede usarse para automatizar el despliegue y configurar variables.

- [ ] **Step 4: Desplegar y verificar**

Lanzar el deploy. Expected: build verde. Visitar la URL de producción:
- `/<dominio>/robots.txt` → lista crawlers de IA.
- `/<dominio>/admin/login` → carga el login.
- La ficha del producto publicado renderiza con su JSON-LD.

- [ ] **Step 5: Commit final**

```powershell
git add -A
git commit -m "chore: configure Vercel build (prisma generate)"
git push
```

---

## Definición de "terminado" (Fase 0)

- App desplegada en Vercel, con base de datos Supabase conectada.
- Admin puede iniciar sesión y dar de alta/listar productos.
- Una ficha de producto se renderiza en servidor con `Product` JSON-LD y aparece en el sitemap.
- `robots.txt`, `sitemap.xml` y `llms.txt` presentes y correctos (crawlers de IA permitidos).
- Suite de Vitest verde (`formatMXN`, `slugify`/`productPath`, `isFreeShipping`).

## Próximos planes (no en este documento)

1. **Catálogo + búsqueda** (home, categorías, buscador por número de parte/nombre/marca, autocompletado, páginas de equivalencias).
2. **Cuentas de cliente + carrito + checkout (Mercado Pago)** + "mis pedidos" + reglas de envío en el carrito.
3. **Servicio Técnico** (modelo de Técnico + sección + formulario de solicitud).

Cada uno se escribirá con la skill `writing-plans` cuando lleguemos a él.
