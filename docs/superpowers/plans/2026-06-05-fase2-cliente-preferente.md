# Fase 2 — Cliente preferente (Plan 12) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Programa de lealtad: tras varias compras pagadas, el cliente se vuelve **preferente** y obtiene un **descuento automático** en el checkout + una sección de beneficios. El admin puede marcar a alguien como preferente manualmente.

**Architecture:** `Profile.preferente` (override manual) + cálculo automático por número de pedidos pagados (umbral configurable). Helper `lib/preferente.ts` con `getClienteEstado(userId)` (preferente + pedidos pagados) y `descuentoPreferente(subtotal)`. El checkout aplica el descuento (5%) y lo guarda en `Order.discountCents`. Se muestra en checkout, confirmación, admin y `/mi-cuenta` (badge + beneficios, o progreso).

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6.

## Contexto ya existente (NO recrear)
- `lib/prisma.ts`, `lib/auth.ts` (`requireUser` devuelve el user de Supabase; `getProfile` upserts y devuelve el Profile; `requireAdmin`), `lib/format.ts` (`formatMXN`), `lib/orders.ts` (`resolveCart()` → `{ lines, subtotalCents, shippingCents, totalCents }`).
- Modelo `Profile` (id, email, role, ...). Modelo `Order` (subtotalCents, shippingCents, totalCents, status [OrderStatus: PENDIENTE_PAGO/PAGADO/ENVIADO/ENTREGADO/CANCELADO], ...).
- `app/(storefront)/checkout/actions.ts` (`crearPedido`), `app/(storefront)/checkout/page.tsx`, `app/(storefront)/pedido/[id]/page.tsx`, `app/(storefront)/mi-cuenta/page.tsx`, `app/admin/pedidos/[id]/page.tsx`.

## Estructura de archivos
```
prisma/schema.prisma                       # MOD: Profile.preferente, Order.discountCents
lib/preferente.ts                          # NUEVO: estado + descuento
app/(storefront)/checkout/actions.ts        # MOD: aplicar descuento
app/(storefront)/checkout/page.tsx          # MOD: mostrar descuento
app/(storefront)/pedido/[id]/page.tsx       # MOD: línea de descuento
app/admin/pedidos/[id]/page.tsx             # MOD: línea de descuento
app/(storefront)/mi-cuenta/page.tsx         # MOD: estado preferente + beneficios
```

---

### Task 1: Esquema + helper de preferente

**Files:** Modify `prisma/schema.prisma`; Create `lib/preferente.ts`.

- [ ] **Step 1: Editar `prisma/schema.prisma`** — (a) en el modelo `Profile`, añadir el campo:
```prisma
  preferente Boolean @default(false)
```
(b) en el modelo `Order`, añadir el campo (junto a los otros `*Cents`):
```prisma
  discountCents Int @default(0)
```

- [ ] **Step 2: Migrar**
```powershell
npx prisma migrate dev --name preferente
```
Expected: migración creada y aplicada (`Profile.preferente` y `Order.discountCents` son aditivos con default, no rompen datos).

- [ ] **Step 3: Create `lib/preferente.ts`** — EXACTO:
```typescript
import { prisma } from "@/lib/prisma";

export const UMBRAL_PREFERENTE = 3; // compras pagadas para volverse preferente
export const DESCUENTO_PREFERENTE = 0.05; // 5%

export function descuentoPreferente(subtotalCents: number): number {
  return Math.round(subtotalCents * DESCUENTO_PREFERENTE);
}

/** Devuelve si el cliente es preferente (flag manual o por # de compras pagadas) y cuántas lleva. */
export async function getClienteEstado(
  userId: string
): Promise<{ preferente: boolean; ordenesPagadas: number }> {
  const [ordenesPagadas, profile] = await Promise.all([
    prisma.order.count({
      where: { customerId: userId, status: { in: ["PAGADO", "ENVIADO", "ENTREGADO"] } },
    }),
    prisma.profile.findUnique({ where: { id: userId }, select: { preferente: true } }),
  ]);
  return {
    preferente: (profile?.preferente ?? false) || ordenesPagadas >= UMBRAL_PREFERENTE,
    ordenesPagadas,
  };
}
```

- [ ] **Step 4: Generate + typecheck**
```powershell
npx prisma generate ; if ($?) { npx tsc --noEmit }
```
Expected: sin errores.

- [ ] **Step 5: Commit**
```powershell
git add prisma lib/preferente.ts
git commit -m "feat: cliente preferente schema + helper (loyalty discount)"
```

---

### Task 2: Aplicar el descuento en el checkout y mostrarlo

**Files:** Modify `app/(storefront)/checkout/actions.ts`, `app/(storefront)/checkout/page.tsx`, `app/(storefront)/pedido/[id]/page.tsx`, `app/admin/pedidos/[id]/page.tsx`.

- [ ] **Step 1: `app/(storefront)/checkout/actions.ts`** — aplicar descuento. Añadir imports:
```typescript
import { getClienteEstado, descuentoPreferente } from "@/lib/preferente";
```
Dentro de `crearPedido`, tras obtener `profile` y `{ lines, subtotalCents, shippingCents }` de `resolveCart()` (ignora el `totalCents` que devuelve resolveCart), calcular:
```typescript
  const { preferente } = await getClienteEstado(profile.id);
  const discountCents = preferente ? descuentoPreferente(subtotalCents) : 0;
  const totalCents = subtotalCents - discountCents + shippingCents;
```
y en `prisma.order.create({ data: { ... } })` incluir `discountCents` y usar este `totalCents` (junto a `subtotalCents`, `shippingCents`). (El resto del action — paymentMethod, ship, items, writeCart, redirect — igual.)

- [ ] **Step 2: `app/(storefront)/checkout/page.tsx`** — mostrar el descuento. Tras `await requireUser()` (capturar el user) y `resolveCart()`, calcular el estado y el total con descuento:
```typescript
  const user = await requireUser();
  const { lines, subtotalCents, shippingCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");
  const { preferente } = await getClienteEstado(user.id);
  const discountCents = preferente ? descuentoPreferente(subtotalCents) : 0;
  const totalCents = subtotalCents - discountCents + shippingCents;
```
Añadir imports `import { getClienteEstado, descuentoPreferente } from "@/lib/preferente";`. En el resumen (`<aside>`), entre la línea de Envío y la de Total, insertar:
```tsx
            {preferente && (
              <div className="flex justify-between text-green-700">
                <span>Descuento cliente preferente (5%)</span><span>-{formatMXN(discountCents)}</span>
              </div>
            )}
```
y asegurar que la línea de Total use el `totalCents` con descuento.

- [ ] **Step 3: `app/(storefront)/pedido/[id]/page.tsx`** — mostrar el descuento si `order.discountCents > 0`. Entre la línea de Envío y la de Total del resumen, insertar:
```tsx
        {order.discountCents > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Descuento cliente preferente</span><span>-{formatMXN(order.discountCents)}</span>
          </div>
        )}
```

- [ ] **Step 4: `app/admin/pedidos/[id]/page.tsx`** — igual, entre Envío y Total:
```tsx
        {order.discountCents > 0 && (
          <div className="flex justify-between text-green-700"><span>Descuento preferente</span><span>-{formatMXN(order.discountCents)}</span></div>
        )}
```

- [ ] **Step 5: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Verificación funcional (controlador, script Prisma).** Tras esta tarea, el controlador probará en BD: marcar un perfil como preferente (o crear 3 pedidos pagados) y verificar que `getClienteEstado` da preferente y que el descuento se calcula. Para la tarea: tsc limpio + `/checkout` sin sesión redirige a `/ingresar` (cmd /c + poll; matar node 3000).

- [ ] **Step 7: Commit**
```powershell
git add "app/(storefront)/checkout" "app/(storefront)/pedido" app/admin/pedidos
git commit -m "feat: apply preferente discount in checkout + show in order views"
```

---

### Task 3: Estado preferente en Mi cuenta

**Files:** Modify `app/(storefront)/mi-cuenta/page.tsx`.

- [ ] **Step 1: Replace `app/(storefront)/mi-cuenta/page.tsx`** — EXACTO:
```tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getClienteEstado, UMBRAL_PREFERENTE } from "@/lib/preferente";

export default async function MiCuentaPage() {
  const user = await requireUser();
  const { preferente, ordenesPagadas } = await getClienteEstado(user.id);
  const faltan = Math.max(0, UMBRAL_PREFERENTE - ordenesPagadas);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <p className="mt-2 text-slate-600">Sesión iniciada como {user.email}.</p>

      {preferente ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800">⭐ Eres Cliente Preferente</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900">
            <li>5% de descuento automático en todas tus compras.</li>
            <li>Acceso a capacitaciones para revendedores y técnicos.</li>
            <li>Préstamo de herramienta especializada.</li>
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Conviértete en Cliente Preferente</p>
          <p className="mt-1">
            Llevas {ordenesPagadas} compra(s). Te {faltan === 1 ? "falta" : "faltan"} {faltan} para
            desbloquear 5% de descuento, capacitaciones y préstamo de herramienta.
          </p>
        </div>
      )}

      <Link href="/mis-pedidos" className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
        Ver mis pedidos
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 3: Verificar** — `/mi-cuenta` sin sesión redirige a `/ingresar` (cmd /c + poll; matar node 3000).

- [ ] **Step 4: Commit**
```powershell
git add "app/(storefront)/mi-cuenta"
git commit -m "feat: preferente status + benefits + progress in mi-cuenta"
```

---

## Definición de "terminado" (Plan 12)
- Tras 3 compras pagadas (o flag manual `Profile.preferente`), el cliente es preferente.
- El checkout aplica **5% de descuento** automático (guardado en `Order.discountCents`) y se muestra en checkout, confirmación y admin.
- `/mi-cuenta` muestra el estado preferente con beneficios, o el progreso hacia él.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Próximo
- WhatsApp (botón/links), CFDI (requiere PAC), Mercado Pago (requiere credenciales), deploy (requiere Supabase cloud), búsqueda por foto, drones.
