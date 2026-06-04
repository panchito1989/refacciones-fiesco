# Fase 1 — Checkout + Pedidos (Plan 5) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Permitir que un cliente con sesión finalice su compra: página de checkout (dirección + método de pago **transferencia/efectivo**), creación de pedido en la BD, vaciado del carrito, página de confirmación con instrucciones de pago, y "Mis pedidos". El pago con **tarjeta (Mercado Pago)** queda como seguimiento (requiere credenciales de MP) — el enum ya lo contempla.

**Architecture:** Modelos Prisma `Order` + `OrderItem` (snapshot de sku/nombre/precio para no depender de cambios futuros), relacionados a `Profile`. El checkout es un Server Component protegido (`requireUser`) que lee el carrito (cookie) y resuelve productos; un server action `crearPedido` valida, calcula totales (subtotal + envío con `isFreeShipping`/`SHIPPING_FLAT_CENTS`), crea el pedido, vacía el carrito y redirige a la confirmación. "Mis pedidos" lista los pedidos del cliente.

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6, Supabase Auth.

## Convenciones
- Windows + PowerShell. Dev server: `Start-Process cmd -ArgumentList "/c","npm run dev"` + sondeo; **matar el node huérfano del puerto 3000 al terminar**.
- Precios en centavos. Cada tarea termina en commit. No commitear `.env*`.

## Contexto ya existente (NO recrear)
- `lib/prisma.ts` (`prisma`), `lib/format.ts` (`formatMXN`), `lib/shipping.ts` (`isFreeShipping`, `FREE_SHIPPING_THRESHOLD_CENTS`=59900), `lib/cart.ts` (`getCart`, `writeCart`, `CartLine`), `lib/auth.ts` (`getProfile`, `requireUser`).
- `Profile` (id = Supabase user id, email, role). `Product` (sku, name, brand, priceCents, ...).
- Carrito en cookie; la página `/carrito` enlaza a `/checkout` (aún 404). `components/ui/button.tsx` (`ButtonLink`).
- `app/(storefront)/mi-cuenta/page.tsx` (cliente con sesión).
- Producto demo: Mabe Termostato, sku `TEST-001`, $599.

## Estructura de archivos
```
prisma/schema.prisma                          # MOD: Order, OrderItem, enums; relación en Profile
lib/shipping.ts                               # MOD: exportar SHIPPING_FLAT_CENTS
lib/orders.ts                                 # NUEVO: helpers (resolver carrito → líneas + totales)
app/(storefront)/checkout/page.tsx            # NUEVO: checkout (protegido)
app/(storefront)/checkout/actions.ts          # NUEVO: crearPedido
app/(storefront)/pedido/[id]/page.tsx         # NUEVO: confirmación
app/(storefront)/mis-pedidos/page.tsx         # NUEVO: lista de pedidos del cliente
app/(storefront)/mi-cuenta/page.tsx           # MOD: enlazar a Mis pedidos
app/(storefront)/carrito/page.tsx             # MOD: usar SHIPPING_FLAT_CENTS de lib/shipping
```

---

### Task 1: Modelos Order + OrderItem

**Files:** Modify `prisma/schema.prisma`, `lib/shipping.ts`.

- [ ] **Step 1: Exportar la tarifa fija de envío** en `lib/shipping.ts` — añadir al archivo (debajo de lo existente):
```typescript
export const SHIPPING_FLAT_CENTS = 19900; // $199 tarifa fija cuando no aplica envío gratis
```

- [ ] **Step 2: Añadir a `prisma/schema.prisma`** (al final): enums y modelos. Y agregar la relación inversa en `Profile` (añadir el campo `orders Order[]` dentro del modelo `Profile` existente).
```prisma
enum OrderStatus {
  PENDIENTE_PAGO
  PAGADO
  ENVIADO
  ENTREGADO
  CANCELADO
}

enum PaymentMethod {
  TRANSFERENCIA
  EFECTIVO
  TARJETA
}

model Order {
  id            String        @id @default(cuid())
  customerId    String
  customer      Profile       @relation(fields: [customerId], references: [id])
  status        OrderStatus   @default(PENDIENTE_PAGO)
  paymentMethod PaymentMethod
  subtotalCents Int
  shippingCents Int
  totalCents    Int
  shipName      String
  shipPhone     String
  shipStreet    String
  shipCity      String
  shipState     String
  shipZip       String
  items         OrderItem[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([customerId])
}

model OrderItem {
  id         String @id @default(cuid())
  orderId    String
  order      Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  sku        String
  name       String
  priceCents Int
  qty        Int
}
```
En el modelo `Profile` existente, agregar esta línea (junto a sus otros campos):
```prisma
  orders    Order[]
```

- [ ] **Step 3: Migrar**
```powershell
npx prisma migrate dev --name add_orders
```
Expected: migración creada y aplicada; "Database schema is up to date!".

- [ ] **Step 4: Typecheck**
```powershell
npx prisma generate ; if ($?) { npx tsc --noEmit }
```
Expected: sin errores.

- [ ] **Step 5: Commit**
```powershell
git add prisma lib/shipping.ts
git commit -m "feat: Order + OrderItem models + shipping flat rate export"
```

---

### Task 2: Checkout (dirección + método de pago) + crear pedido

**Files:** Create `lib/orders.ts`, `app/(storefront)/checkout/actions.ts`, `app/(storefront)/checkout/page.tsx`; Modify `app/(storefront)/carrito/page.tsx`.

- [ ] **Step 1: Crear `lib/orders.ts`** (resuelve el carrito a líneas + totales; reutilizable):
```typescript
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { isFreeShipping, SHIPPING_FLAT_CENTS } from "@/lib/shipping";

export type ResolvedLine = { sku: string; name: string; priceCents: number; qty: number; lineTotal: number };

export async function resolveCart(): Promise<{
  lines: ResolvedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}> {
  const cart = await getCart();
  const products = cart.length
    ? await prisma.product.findMany({ where: { sku: { in: cart.map((l) => l.sku) } } })
    : [];

  const lines: ResolvedLine[] = cart
    .map((l) => {
      const p = products.find((pr) => pr.sku === l.sku);
      if (!p) return null;
      return { sku: p.sku, name: p.name, priceCents: p.priceCents, qty: l.qty, lineTotal: p.priceCents * l.qty };
    })
    .filter((x): x is ResolvedLine => x !== null);

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingCents = lines.length === 0 || isFreeShipping(subtotalCents) ? 0 : SHIPPING_FLAT_CENTS;
  return { lines, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}
```

- [ ] **Step 2: Crear `app/(storefront)/checkout/actions.ts`**:
```typescript
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { writeCart } from "@/lib/cart";
import { resolveCart } from "@/lib/orders";

export async function crearPedido(formData: FormData) {
  const profile = await getProfile();
  if (!profile) redirect("/ingresar");

  const { lines, subtotalCents, shippingCents, totalCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");

  const paymentMethod =
    String(formData.get("paymentMethod") ?? "TRANSFERENCIA") === "EFECTIVO" ? "EFECTIVO" : "TRANSFERENCIA";

  const ship = {
    shipName: String(formData.get("shipName") ?? "").trim(),
    shipPhone: String(formData.get("shipPhone") ?? "").trim(),
    shipStreet: String(formData.get("shipStreet") ?? "").trim(),
    shipCity: String(formData.get("shipCity") ?? "").trim(),
    shipState: String(formData.get("shipState") ?? "").trim(),
    shipZip: String(formData.get("shipZip") ?? "").trim(),
  };
  if (!ship.shipName || !ship.shipPhone || !ship.shipStreet || !ship.shipCity || !ship.shipState || !ship.shipZip) {
    throw new Error("Faltan datos de envío.");
  }

  const order = await prisma.order.create({
    data: {
      customerId: profile.id,
      status: "PENDIENTE_PAGO",
      paymentMethod,
      subtotalCents,
      shippingCents,
      totalCents,
      ...ship,
      items: {
        create: lines.map((l) => ({ sku: l.sku, name: l.name, priceCents: l.priceCents, qty: l.qty })),
      },
    },
  });

  await writeCart([]); // vaciar carrito
  redirect(`/pedido/${order.id}`);
}
```

- [ ] **Step 3: Crear `app/(storefront)/checkout/page.tsx`** (protegido; resumen + dirección + método):
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { resolveCart } from "@/lib/orders";
import { formatMXN } from "@/lib/format";
import { crearPedido } from "./actions";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  await requireUser();
  const { lines, subtotalCents, shippingCents, totalCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");

  const input = "rounded-md border border-slate-300 p-2";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-2">
      <form action={crearPedido} className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Datos de envío</h1>
        <input name="shipName" placeholder="Nombre completo" className={input} required />
        <input name="shipPhone" placeholder="Teléfono" className={input} required />
        <input name="shipStreet" placeholder="Calle y número" className={input} required />
        <div className="grid grid-cols-2 gap-3">
          <input name="shipCity" placeholder="Ciudad" className={input} required />
          <input name="shipState" placeholder="Estado" className={input} required />
        </div>
        <input name="shipZip" placeholder="Código postal" className={input} required />

        <h2 className="mt-2 font-semibold">Método de pago</h2>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="TRANSFERENCIA" defaultChecked /> Transferencia (SPEI)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="EFECTIVO" /> Efectivo / OXXO
        </label>
        <p className="text-xs text-slate-400">Pago con tarjeta (Mercado Pago) próximamente.</p>

        <button type="submit" className="mt-2 rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-600">
          Confirmar pedido
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Tu pedido</h2>
        <ul className="divide-y divide-slate-200 text-sm">
          {lines.map((l) => (
            <li key={l.sku} className="flex justify-between py-2">
              <span>{l.qty} × {l.name}</span>
              <span>{formatMXN(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(subtotalCents)}</span></div>
          <div className="flex justify-between"><span>Envío</span><span>{shippingCents === 0 ? "Gratis" : formatMXN(shippingCents)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-2 font-bold"><span>Total</span><span>{formatMXN(totalCents)}</span></div>
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: DRY en el carrito** — en `app/(storefront)/carrito/page.tsx`, eliminar la constante local `SHIPPING_FLAT_CENTS` e importarla de shipping: cambiar el import de shipping a `import { isFreeShipping, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/shipping";` y borrar la línea `const SHIPPING_FLAT_CENTS = 19900;`.

- [ ] **Step 5: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Verificar (runtime)** — checkout requiere sesión; sin sesión debe redirigir a `/ingresar`. (cmd /c + poll; matar node de 3000 al final.)
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  try { Invoke-WebRequest http://localhost:3000/checkout -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 | Out-Null; Write-Output "checkout sin sesion: NO redirige (revisar)" } catch { Write-Output ("checkout sin sesion redirige a: " + $_.Exception.Response.Headers.Location) }
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: redirige a `/ingresar` (o `/checkout` sin sesión → `/ingresar`). (Sin items además redirige a `/carrito`; el guard de sesión corre primero.)

- [ ] **Step 7: Commit**
```powershell
git add lib/orders.ts app/(storefront)/checkout app/(storefront)/carrito/page.tsx
git commit -m "feat: checkout page + create order (transfer/cash)"
```

---

### Task 3: Confirmación de pedido + Mis pedidos

**Files:** Create `app/(storefront)/pedido/[id]/page.tsx`, `app/(storefront)/mis-pedidos/page.tsx`; Modify `app/(storefront)/mi-cuenta/page.tsx`.

- [ ] **Step 1: Crear `app/(storefront)/pedido/[id]/page.tsx`** (confirmación; solo el dueño puede verlo):
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.customerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        ¡Gracias! Tu pedido <strong>#{order.id.slice(-6).toUpperCase()}</strong> fue registrado.
      </div>

      <h1 className="mt-6 text-xl font-bold">Resumen</h1>
      <ul className="mt-3 divide-y divide-slate-200 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between py-2">
            <span>{it.qty} × {it.name}</span>
            <span>{formatMXN(it.priceCents * it.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(order.subtotalCents)}</span></div>
        <div className="flex justify-between"><span>Envío</span><span>{order.shippingCents === 0 ? "Gratis" : formatMXN(order.shippingCents)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Total</span><span>{formatMXN(order.totalCents)}</span></div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold">Instrucciones de pago</p>
        {order.paymentMethod === "TRANSFERENCIA" ? (
          <p className="mt-1 text-slate-600">
            Realiza una transferencia SPEI por {formatMXN(order.totalCents)} a la cuenta que te
            compartiremos por WhatsApp/correo y envía tu comprobante. Apartamos tu pedido en cuanto lo recibamos.
          </p>
        ) : (
          <p className="mt-1 text-slate-600">
            Pago en efectivo: te contactaremos para coordinar el pago contra entrega o en punto OXXO.
          </p>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500">Enviaremos a: {order.shipName}, {order.shipStreet}, {order.shipCity}, {order.shipState}, CP {order.shipZip}.</p>
    </div>
  );
}
```

- [ ] **Step 2: Crear `app/(storefront)/mis-pedidos/page.tsx`**:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default async function MisPedidosPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-slate-600">Aún no tienes pedidos. <Link href="/" className="text-blue-700 underline">Explora el catálogo</Link>.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/pedido/${o.id}`} className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Pedido #{o.id.slice(-6).toUpperCase()}</span>
                  <span className="font-semibold">{formatMXN(o.totalCents)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {o.items.length} artículo(s) · {STATUS_LABEL[o.status] ?? o.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Enlazar desde `app/(storefront)/mi-cuenta/page.tsx`** — reemplazar la línea `<p className="mt-1 text-sm text-slate-500">Pronto verás aquí tus pedidos.</p>` por:
```tsx
      <Link href="/mis-pedidos" className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
        Ver mis pedidos
      </Link>
```
y agregar `import Link from "next/link";` al inicio del archivo.

- [ ] **Step 4: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 5: Verificación end-to-end (manual, con sesión).** El revisor/controlador hará el flujo real en navegador (login → agregar al carrito → checkout → confirmar → ver en mis-pedidos). Para esta tarea, verificar al menos que `/mis-pedidos` y `/pedido/<algo>` redirigen a `/ingresar` sin sesión (cmd /c + poll; matar node 3000 al final).

- [ ] **Step 6: Commit**
```powershell
git add app/(storefront)/pedido app/(storefront)/mis-pedidos app/(storefront)/mi-cuenta/page.tsx
git commit -m "feat: order confirmation + my orders pages"
```

---

## Definición de "terminado" (Plan 5)
- Un cliente con sesión puede ir del carrito a `/checkout`, ingresar dirección, elegir transferencia/efectivo y **confirmar**, creándose un `Order` con sus `OrderItem`; el carrito se vacía y se muestra la confirmación con instrucciones de pago.
- `/mis-pedidos` lista los pedidos del cliente; `/pedido/[id]` solo lo ve su dueño.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Seguimiento (no en este plan)
- **Tarjeta con Mercado Pago:** cuando el usuario entregue credenciales de PRUEBA (Access Token + Public Key), añadir el método TARJETA: crear preferencia, redirigir a MP, webhook que marca el `Order` como PAGADO.
