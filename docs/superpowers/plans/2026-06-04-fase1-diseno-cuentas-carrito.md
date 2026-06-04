# Fase 1 — Diseño + Cuentas + Carrito (Plan 4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Darle a la tienda una identidad visual profesional (tema claro, azul de marca + ámbar de acción, alto contraste) aplicada a todas las pantallas; añadir cuentas de cliente con separación de roles (cliente vs admin) que asegura el panel `/admin`; y un carrito de compra con la regla de envío gratis > $599. Deja la tienda lista para el checkout (Plan 5).

**Architecture:** El sistema de diseño se basa en utilidades Tailwind con la paleta de marca (azul `blue-700` + ámbar `amber-500` + neutros `slate`), forzando tema claro en `globals.css`; se reestilizan los componentes compartidos (header, footer, ProductCard, botones) y los contenedores de página. Los roles se modelan con una tabla `Profile` (id = id de usuario de Supabase, role CUSTOMER/ADMIN); helpers de servidor `getProfile`/`requireAdmin` reemplazan el guard "cualquier autenticado". El carrito vive en una cookie httpOnly (líneas SKU+cantidad), leído/escrito por server actions; la página de carrito calcula subtotal y envío con `isFreeShipping`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Prisma 6, Supabase Auth (local), Vitest.

## Convenciones
- Windows + PowerShell. Dev server confiable: `Start-Process cmd -ArgumentList "/c","npm run dev"` + sondeo de readiness. Tras verificar, matar el proceso para liberar el puerto 3000.
- Precios en centavos. Mostrar con `formatMXN`.
- Paleta: marca `blue-700` (#1d4ed8), hover `blue-800`; acción/compra `amber-500` (#f59e0b) texto `slate-900`; texto `slate-900`, tenue `slate-500`, bordes `slate-200`, fondos `white`/`slate-50`.
- Cada tarea termina en commit.

## Contexto ya existente (NO recrear)
- Storefront `app/(storefront)/` con `layout.tsx` (header+footer), `page.tsx` (home), `buscar/`, `categoria/[slug]/`, `equivalencia/[parte]/`, `refaccion/[marca]/[slug]/`.
- `components/site-header.tsx`, `site-footer.tsx`, `product-card.tsx`.
- `lib/format.ts` (`formatMXN`), `lib/slug.ts` (`productPath`), `lib/shipping.ts` (`isFreeShipping`, `FREE_SHIPPING_THRESHOLD_CENTS`), `lib/prisma.ts`.
- Auth: `lib/supabase/server.ts` (`createClient`), `lib/supabase/middleware.ts`, `proxy.ts`, `app/admin/layout.tsx` (guard: actualmente deja pasar a CUALQUIER usuario autenticado — se endurecerá), `app/admin/login/page.tsx`.
- Admin user (Supabase local): `issacfiesco66@gmail.com`. Producto demo publicado (Mabe Termostato).
- `globals.css` (de create-next-app, Tailwind v4) actualmente fuerza modo oscuro por `prefers-color-scheme` — se reemplazará por tema claro.

## Estructura de archivos
```
app/globals.css                              # MOD: tema claro + tokens de marca
components/site-header.tsx                   # MOD: estilo de marca + link a carrito/cuenta
components/site-footer.tsx                   # MOD: estilo
components/product-card.tsx                  # MOD: estilo
components/ui/button.tsx                     # NUEVO: botón con variantes (primary/buy)
lib/auth.ts                                  # NUEVO: getProfile, requireAdmin, requireUser
prisma/schema.prisma                         # MOD: modelo Profile + enum Role
prisma/seed-admin.mjs                        # NUEVO: marca al admin como ADMIN
app/admin/layout.tsx                         # MOD: guard por rol ADMIN
app/(auth)/registro/page.tsx                 # NUEVO: registro de cliente
app/(auth)/ingresar/page.tsx                 # NUEVO: login de cliente
app/(auth)/layout.tsx                        # NUEVO: usa la cáscara de tienda
lib/cart.ts                                  # NUEVO: lectura/escritura del carrito (cookie) + tipos
app/(storefront)/carrito/page.tsx            # NUEVO: página de carrito
app/(storefront)/carrito/actions.ts          # NUEVO: agregar/quitar/vaciar
components/add-to-cart.tsx                    # NUEVO: botón cliente "Agregar al carrito"
supabase/config.toml                          # MOD: desactivar confirmación de correo (dev)
```

---

### Task 1: Sistema de diseño (tema claro + marca, reestilizar componentes)

**Files:** Modify `app/globals.css`, `components/site-header.tsx`, `components/site-footer.tsx`, `components/product-card.tsx`; Create `components/ui/button.tsx`.

- [ ] **Step 1: Leer `app/globals.css`** y reemplazar el bloque que define el tema (las variables `--background`/`--foreground` y el `@media (prefers-color-scheme: dark)`) para FORZAR tema claro. Conservar el `@import "tailwindcss";` (y `@theme inline` si existe). El `body` debe quedar con fondo claro y texto oscuro. Dejar el archivo así (ajustar solo si el import de Tailwind difiere):
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0f172a; /* slate-900 */
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif);
}
```
(Si el original tenía `@theme inline { ... }` mapeando `--color-background`/`--color-foreground`, consérvalo; lo único imprescindible es que NO quede el override de `prefers-color-scheme: dark`.)

- [ ] **Step 2: Crear `components/ui/button.tsx`** (botón con variantes, reutilizable):
```tsx
import Link from "next/link";

type Variant = "primary" | "buy" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-blue-700 text-white hover:bg-blue-800",
  buy: "bg-amber-500 text-slate-900 hover:bg-amber-600 font-semibold",
  ghost: "border border-slate-300 text-slate-700 hover:bg-slate-50",
};

const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition disabled:opacity-50";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Reestilizar `components/site-header.tsx`** — barra de marca azul, buscador y accesos a carrito/cuenta. EXACTO:
```tsx
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-blue-700 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 p-4">
        <Link href="/" className="text-lg font-bold whitespace-nowrap">
          Refacciones Fiesco
        </Link>
        <form action="/buscar" method="get" className="order-3 flex w-full gap-2 sm:order-2 sm:w-auto sm:flex-1">
          <input
            type="search"
            name="q"
            placeholder="Busca por número de parte, nombre o marca…"
            className="w-full rounded-md border-0 px-3 py-2 text-slate-900 placeholder:text-slate-400"
            aria-label="Buscar refacciones"
          />
          <button type="submit" className="rounded-md bg-amber-500 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-600">
            Buscar
          </button>
        </form>
        <nav className="order-2 ml-auto flex items-center gap-4 text-sm sm:order-3">
          <Link href="/carrito" className="hover:underline">Carrito</Link>
          <Link href="/ingresar" className="hover:underline">Mi cuenta</Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Reestilizar `components/site-footer.tsx`** — EXACTO:
```tsx
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl p-6 text-sm text-slate-500">
        <p className="font-semibold text-slate-700">Refacciones Fiesco</p>
        <p>Refacciones de electrodomésticos, nuevas y recuperadas. Si no la tenemos, te la conseguimos.</p>
        <p>Envíos a todo México. Envío gratis en compras mayores a $599.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Reestilizar `components/product-card.tsx`** — EXACTO (mantiene el tipo `ProductCardData`):
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
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{product.brand}</p>
      <h3 className="mt-1 font-medium text-slate-900">{product.name}</h3>
      <p className="text-xs text-slate-400">Núm. de parte {product.partNumber}</p>
      <p className="mt-3 text-lg font-bold text-slate-900">{formatMXN(product.priceCents)}</p>
      <span className="mt-1 inline-block w-fit rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        {product.condition === "NUEVO" ? "Nuevo" : "Recuperado"}
      </span>
    </Link>
  );
}
```

- [ ] **Step 6: Typecheck + verificación visual** (cmd /c + poll + screenshot/eval). Confirmar tema claro y marca:
```powershell
npx tsc --noEmit
```
Luego arrancar dev (cmd /c), esperar readiness, y comprobar que el `<body>` ya no es oscuro:
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  $h = (Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("header azul presente: " + ($h -match 'bg-blue-700'))
  Write-Output ("link carrito: " + ($h -match '/carrito'))
} finally { Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue }
```
Expected: tsc limpio; header azul y link a carrito presentes. (El link `/carrito` y `/ingresar` aún no tienen página hasta T2/T3 — es esperado.)

- [ ] **Step 7: Commit**
```powershell
git add app/globals.css components
git commit -m "feat: design system (light theme, brand colors, restyled components)"
```

---

### Task 2: Roles + cuentas de cliente (asegurar /admin)

**Files:** Modify `prisma/schema.prisma`, `app/admin/layout.tsx`, `supabase/config.toml`; Create `lib/auth.ts`, `prisma/seed-admin.mjs`, `app/(auth)/layout.tsx`, `app/(auth)/registro/page.tsx`, `app/(auth)/ingresar/page.tsx`.

- [ ] **Step 1: Añadir el modelo `Profile` y enum `Role` a `prisma/schema.prisma`** (al final del archivo):
```prisma
enum Role {
  CUSTOMER
  ADMIN
}

model Profile {
  id        String   @id // = auth.users.id de Supabase
  email     String
  role      Role     @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Migración**
```powershell
npx prisma migrate dev --name add_profile
```
Expected: crea la migración y la aplica; "Database schema is up to date!".

- [ ] **Step 3: Crear `lib/auth.ts`** (helpers de sesión + rol):
```typescript
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/** Devuelve el usuario de Supabase o null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Asegura/lee el Profile del usuario actual (lo crea como CUSTOMER si falta). null si no hay sesión. */
export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  return prisma.profile.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? "", role: "CUSTOMER" },
  });
}

/** Redirige a /ingresar si no hay sesión; devuelve el usuario. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/ingresar");
  return user;
}

/** Redirige a /admin/login si no hay sesión, o a / si no es ADMIN. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "ADMIN") redirect("/");
  return profile;
}
```

- [ ] **Step 4: Endurecer `app/admin/layout.tsx`** — usar `requireAdmin()` en lugar del check "cualquier autenticado". EXACTO:
```tsx
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // La página de login vive bajo este layout: no la protejas.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  await requireAdmin(); // redirige si no hay sesión o no es ADMIN

  return <div className="mx-auto max-w-5xl p-6">{children}</div>;
}
```

- [ ] **Step 5: Crear `prisma/seed-admin.mjs`** (marca al dueño como ADMIN; idempotente). Lee el id del usuario admin desde la tabla auth de Supabase vía SQL crudo:
```javascript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "issacfiesco66@gmail.com";
try {
  const rows = await prisma.$queryRaw`select id::text, email from auth.users where email = ${ADMIN_EMAIL} limit 1`;
  if (rows.length === 0) {
    console.error("SEED_ADMIN_FAIL: usuario admin no encontrado en auth.users");
    process.exitCode = 1;
  } else {
    const u = rows[0];
    await prisma.profile.upsert({
      where: { id: u.id },
      update: { role: "ADMIN", email: u.email },
      create: { id: u.id, email: u.email, role: "ADMIN" },
    });
    console.log(`SEED_ADMIN_OK ${u.email} -> ADMIN`);
  }
} catch (e) {
  console.error("SEED_ADMIN_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
```
Agregar a `package.json` scripts: `"db:seed:admin": "node --env-file=.env prisma/seed-admin.mjs"`, y correrlo:
```powershell
npm run db:seed:admin
```
Expected: `SEED_ADMIN_OK issacfiesco66@gmail.com -> ADMIN`.

- [ ] **Step 6: Desactivar confirmación de correo para dev** en `supabase/config.toml`: localizar la sección `[auth.email]` y poner `enable_confirmations = false` (si ya está en false, no cambiar). Esto permite que un cliente registrado entre de inmediato en local. Luego reiniciar Supabase para aplicar:
```powershell
npx supabase stop ; npx supabase start
```
(Si `enable_confirmations` ya era false, omite el reinicio.)

- [ ] **Step 7: Crear `app/(auth)/layout.tsx`** (reusa la cáscara de tienda para header/footer):
```tsx
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 8: Crear `app/(auth)/ingresar/page.tsx`** (login de cliente):
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function IngresarPage() {
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
    if (error) return setError(error.message);
    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="rounded border border-slate-300 p-2" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded border border-slate-300 p-2" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-md bg-blue-700 p-2 text-white hover:bg-blue-800">Entrar</button>
      </form>
      <p className="mt-3 text-sm text-slate-600">
        ¿No tienes cuenta? <Link href="/registro" className="text-blue-700 underline">Regístrate</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 9: Crear `app/(auth)/registro/page.tsx`** (registro de cliente):
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function RegistroPage() {
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
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="rounded border border-slate-300 p-2" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded border border-slate-300 p-2" type="password" placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-md bg-blue-700 p-2 text-white hover:bg-blue-800">Registrarme</button>
      </form>
      <p className="mt-3 text-sm text-slate-600">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="text-blue-700 underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 10: Crear `app/(storefront)/mi-cuenta/page.tsx`** (página simple protegida; confirma sesión de cliente):
```tsx
import { requireUser } from "@/lib/auth";

export default async function MiCuentaPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <p className="mt-2 text-slate-600">Sesión iniciada como {user.email}.</p>
      <p className="mt-1 text-sm text-slate-500">Pronto verás aquí tus pedidos.</p>
    </div>
  );
}
```

- [ ] **Step 11: Typecheck + tests + verificación**
```powershell
npx tsc --noEmit ; if ($?) { npm test }
```
Expected: sin errores; 9 tests verdes. Verificar (cmd /c) que `/registro` e `/ingresar` cargan (200) y que `/admin/productos` SIN sesión sigue redirigiendo a `/admin/login` (rol). Usar el patrón de readiness; matar el server al final.

- [ ] **Step 12: Commit**
```powershell
git add prisma app lib package.json package-lock.json supabase/config.toml
git commit -m "feat: role-based auth (Profile) + customer accounts; secure admin"
```

---

### Task 3: Carrito de compra + regla de envío

**Files:** Create `lib/cart.ts`, `app/(storefront)/carrito/page.tsx`, `app/(storefront)/carrito/actions.ts`, `components/add-to-cart.tsx`; Modify `app/(storefront)/refaccion/[marca]/[slug]/page.tsx` (botón agregar).

- [ ] **Step 1: Crear `lib/cart.ts`** (carrito en cookie; tipos + helpers de servidor):
```typescript
import { cookies } from "next/headers";

const COOKIE = "cart";

export type CartLine = { sku: string; qty: number };

export async function getCart(): Promise<CartLine[]> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => typeof l?.sku === "string" && Number.isInteger(l?.qty) && l.qty > 0);
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function addLine(lines: CartLine[], sku: string, qty = 1): CartLine[] {
  const next = [...lines];
  const existing = next.find((l) => l.sku === sku);
  if (existing) existing.qty += qty;
  else next.push({ sku, qty });
  return next;
}
```

- [ ] **Step 2: Crear `app/(storefront)/carrito/actions.ts`** (server actions):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getCart, writeCart, addLine } from "@/lib/cart";

export async function agregarAlCarrito(sku: string) {
  const lines = await getCart();
  await writeCart(addLine(lines, sku, 1));
  revalidatePath("/carrito");
}

export async function quitarDelCarrito(sku: string) {
  const lines = await getCart();
  await writeCart(lines.filter((l) => l.sku !== sku));
  revalidatePath("/carrito");
}

export async function vaciarCarrito() {
  await writeCart([]);
  revalidatePath("/carrito");
}
```

- [ ] **Step 3: Crear `components/add-to-cart.tsx`** (botón cliente que invoca el action):
```tsx
"use client";

import { useTransition } from "react";
import { agregarAlCarrito } from "@/app/(storefront)/carrito/actions";

export function AddToCart({ sku }: { sku: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => agregarAlCarrito(sku))}
      disabled={pending}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-amber-500 px-5 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-600 disabled:opacity-50"
    >
      {pending ? "Agregando…" : "Agregar al carrito"}
    </button>
  );
}
```

- [ ] **Step 4: Añadir el botón a la ficha de producto** `app/(storefront)/refaccion/[marca]/[slug]/page.tsx`: importar `import { AddToCart } from "@/components/add-to-cart";` y, justo después del `<p>` del stock ("En existencia"/"Bajo pedido"), insertar `<AddToCart sku={product.sku} />`.

- [ ] **Step 5: Crear `app/(storefront)/carrito/page.tsx`** (resuelve líneas contra la BD, subtotal, envío):
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { formatMXN } from "@/lib/format";
import { isFreeShipping, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { ButtonLink } from "@/components/ui/button";
import { quitarDelCarrito, vaciarCarrito } from "./actions";

export const metadata: Metadata = { title: "Tu carrito", robots: { index: false } };

const SHIPPING_FLAT_CENTS = 19900; // $199 tarifa fija si no aplica envío gratis

export default async function CarritoPage() {
  const lines = await getCart();
  const products = lines.length
    ? await prisma.product.findMany({ where: { sku: { in: lines.map((l) => l.sku) } } })
    : [];

  const items = lines
    .map((l) => {
      const p = products.find((pr) => pr.sku === l.sku);
      return p ? { ...l, product: p, lineTotal: p.priceCents * l.qty } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const envioGratis = isFreeShipping(subtotal);
  const envio = items.length === 0 || envioGratis ? 0 : SHIPPING_FLAT_CENTS;
  const total = subtotal + envio;
  const faltante = FREE_SHIPPING_THRESHOLD_CENTS - subtotal;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Tu carrito</h1>
      {items.length === 0 ? (
        <p className="text-slate-600">
          Tu carrito está vacío. <Link href="/" className="text-blue-700 underline">Ver productos</Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {items.map((i) => (
              <li key={i.sku} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{i.product.name}</p>
                  <p className="text-sm text-slate-500">{i.product.brand} · {i.qty} × {formatMXN(i.product.priceCents)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatMXN(i.lineTotal)}</span>
                  <form action={quitarDelCarrito.bind(null, i.sku)}>
                    <button className="text-sm text-red-600 hover:underline">Quitar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{envioGratis ? "Gratis" : formatMXN(envio)}</span>
            </div>
            {!envioGratis && faltante > 0 && (
              <p className="text-blue-700">Te faltan {formatMXN(faltante)} para envío gratis.</p>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Total</span><span>{formatMXN(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <form action={vaciarCarrito}>
              <button className="text-sm text-slate-500 hover:underline">Vaciar carrito</button>
            </form>
            <ButtonLink variant="buy" href="/checkout" className="px-6 py-3">
              Continuar al pago
            </ButtonLink>
          </div>
          <p className="mt-2 text-right text-xs text-slate-400">El pago (Mercado Pago) se habilita en el siguiente plan.</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 7: Verificar el carrito en runtime** (cmd /c + poll). Como agregar usa cookies vía un client action, verificar al menos que `/carrito` carga (200, "Tu carrito") y que la ficha muestra el botón "Agregar al carrito":
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  $c = (Invoke-WebRequest http://localhost:3000/carrito -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("carrito carga: " + ($c -match 'Tu carrito'))
  $p = (Invoke-WebRequest "http://localhost:3000/refaccion/mabe/wr55x10942-termostato-refrigerador" -UseBasicParsing -TimeoutSec 25).Content
  Write-Output ("ficha tiene boton agregar: " + ($p -match 'Agregar al carrito'))
} finally { Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue }
```
Expected: ambas True.

- [ ] **Step 8: Commit**
```powershell
git add lib/cart.ts app components
git commit -m "feat: cookie cart + add-to-cart + cart page with free-shipping rule"
```

---

## Definición de "terminado" (Plan 4)
- Tema claro de marca (azul + ámbar, alto contraste) aplicado a header, footer, tarjetas y botones en todas las pantallas.
- Existe `Profile` con rol; `/admin` solo accesible para ADMIN; clientes pueden registrarse e iniciar sesión (`/registro`, `/ingresar`, `/mi-cuenta`).
- Carrito funcional (agregar desde la ficha, ver en `/carrito`, quitar/vaciar) con subtotal y regla de envío gratis > $599.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Próximo plan
- **Plan 5:** Checkout con **Mercado Pago** (sandbox — requiere tus credenciales de prueba) + creación de pedidos + "mis pedidos" + confirmación. (Reusa este diseño; no se rehacen pantallas.)
