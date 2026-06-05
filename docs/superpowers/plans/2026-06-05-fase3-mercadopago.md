# Fase 3 — Pago con tarjeta: Mercado Pago Checkout Pro (Plan 14) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Aceptar pago con **tarjeta** vía **Mercado Pago Checkout Pro**: el cliente elige "Tarjeta", se crea el pedido + una preferencia de MP, se le redirige a la página segura de Mercado Pago, paga, regresa a la tienda y el pedido se marca **PAGADO** (por la página de retorno y por webhook).

**Architecture:** `lib/mercadopago.ts` (cliente con `MP_ACCESS_TOKEN` server-only; `crearPreferenciaMP`, `obtenerPagoMP`, `marcarPedidoPagado`). El checkout añade la opción "Tarjeta" (solo si MP está configurado). `crearPedido` con método TARJETA crea el pedido (PENDIENTE_PAGO), crea la preferencia (1 ítem = total del pedido, `external_reference = order.id`) y redirige a `init_point`. La página `/checkout/resultado` verifica el pago vía API y marca PAGADO; el route handler `/api/mp/webhook` hace lo mismo desde las notificaciones de MP. `marcarPedidoPagado` es idempotente.

**Tech Stack:** Next.js 16 (App Router, TS), Prisma 6, SDK `mercadopago` (v2).

## Convenciones / límites
- Windows + PowerShell. Dev: `Start-Process cmd -ArgumentList "/c","npm run dev"` + poll; matar node 3000.
- **Local:** la **creación de preferencia** se prueba aquí (server → API de MP). El **webhook** necesita URL pública (no llega a localhost) → se prueba al desplegar. En `http`/local NO se manda `auto_return` (MP lo rechaza sin https); en producción (https) sí.
- `.env.local` ya tiene `MP_ACCESS_TOKEN` (server-only) y `NEXT_PUBLIC_MP_PUBLIC_KEY`. No commitear `.env*`.

## Contexto ya existente (NO recrear)
- `lib/prisma.ts`, `lib/orders.ts` (`resolveCart`), `lib/auth.ts` (`getProfile`), `lib/cart.ts` (`writeCart`), `lib/preferente.ts` (`getClienteEstado`, `descuentoPreferente`).
- `app/(storefront)/checkout/actions.ts` (`crearPedido` — ya crea Order PENDIENTE_PAGO con discountCents/totalCents, vacía carrito, `redirect("/pedido/"+id)`). Lee `paymentMethod` (hoy TRANSFERENCIA/EFECTIVO).
- `app/(storefront)/checkout/page.tsx` (form con radios TRANSFERENCIA/EFECTIVO + nota "tarjeta próximamente").
- Modelo `Order` (status OrderStatus, `external_reference` NO existe — usamos `order.id`).

## Estructura de archivos
```
package.json                                  # MOD: dep mercadopago
.env.example                                  # MOD: MP_ACCESS_TOKEN, NEXT_PUBLIC_MP_PUBLIC_KEY
lib/mercadopago.ts                            # NUEVO: cliente + helpers
app/(storefront)/checkout/page.tsx            # MOD: opción "Tarjeta" (si MP configurado)
app/(storefront)/checkout/actions.ts          # MOD: branch TARJETA → preferencia + redirect
app/(storefront)/checkout/resultado/page.tsx  # NUEVO: retorno de MP (verifica + marca PAGADO)
app/api/mp/webhook/route.ts                   # NUEVO: webhook de MP
```

---

### Task 1: SDK + lib/mercadopago.ts (+ verificación de preferencia)

**Files:** Modify `package.json` (install), `.env.example`; Create `lib/mercadopago.ts`.

- [ ] **Step 1: Instalar el SDK**
```powershell
npm install mercadopago
```

- [ ] **Step 2: Añadir a `.env.example`** (plantilla, valores vacíos):
```
MP_ACCESS_TOKEN=""
NEXT_PUBLIC_MP_PUBLIC_KEY=""
```

- [ ] **Step 3: Create `lib/mercadopago.ts`** — EXACTO:
```typescript
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

export const mpConfigurado = Boolean(process.env.MP_ACCESS_TOKEN);

function client() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
}

/** Crea una preferencia de Checkout Pro con un solo ítem = total del pedido. Devuelve el init_point. */
export async function crearPreferenciaMP(params: {
  orderId: string;
  totalCents: number;
  siteUrl: string;
}): Promise<string> {
  const pref = new Preference(client());
  const isHttps = params.siteUrl.startsWith("https");
  const res = await pref.create({
    body: {
      items: [
        {
          id: params.orderId,
          title: `Pedido Refacciones Fiesco #${params.orderId.slice(-6).toUpperCase()}`,
          quantity: 1,
          unit_price: Math.round(params.totalCents) / 100,
          currency_id: "MXN",
        },
      ],
      external_reference: params.orderId,
      back_urls: {
        success: `${params.siteUrl}/checkout/resultado`,
        failure: `${params.siteUrl}/checkout/resultado`,
        pending: `${params.siteUrl}/checkout/resultado`,
      },
      ...(isHttps ? { auto_return: "approved" } : {}),
      notification_url: `${params.siteUrl}/api/mp/webhook`,
    },
  });
  if (!res.init_point) throw new Error("Mercado Pago no devolvió init_point");
  return res.init_point;
}

export async function obtenerPagoMP(paymentId: string) {
  const pay = new Payment(client());
  return pay.get({ id: paymentId });
}

/** Marca el pedido como PAGADO solo si estaba PENDIENTE_PAGO (idempotente). */
export async function marcarPedidoPagado(orderId: string): Promise<void> {
  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDIENTE_PAGO" },
    data: { status: "PAGADO" },
  });
}
```

- [ ] **Step 4: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores. (Si error stale de `.next/dev/types`, borrar `.next`.)

- [ ] **Step 5: VERIFICAR creación de preferencia** (prueba clave: credenciales + SDK funcionan). Crear `scripts/mp-check.mjs`:
```javascript
import { MercadoPagoConfig, Preference } from "mercadopago";
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
try {
  const res = await new Preference(mp).create({
    body: {
      items: [{ id: "1", title: "Prueba", quantity: 1, unit_price: 100, currency_id: "MXN" }],
      external_reference: "test-order",
      back_urls: {
        success: "http://localhost:3000/checkout/resultado",
        failure: "http://localhost:3000/checkout/resultado",
        pending: "http://localhost:3000/checkout/resultado",
      },
    },
  });
  console.log("MP_OK init_point:", res.init_point ? "OK" : "MISSING");
} catch (e) {
  console.error("MP_FAIL", e.message);
  process.exitCode = 1;
}
```
Correr: `node --env-file=.env.local scripts/mp-check.mjs` → esperado `MP_OK init_point: OK`. Luego borrar el script: `Remove-Item -LiteralPath "E:\Refacciones-Fiesco\scripts\mp-check.mjs" -Force`.

- [ ] **Step 6: Commit** (NO commitear el script temporal)
```powershell
git add package.json package-lock.json .env.example lib/mercadopago.ts
git commit -m "feat: Mercado Pago client + preference/payment helpers"
```
Confirmar `git status` limpio y sin `.env*`.

---

### Task 2: Opción "Tarjeta" en checkout + crear preferencia

**Files:** Modify `app/(storefront)/checkout/page.tsx`, `app/(storefront)/checkout/actions.ts`.

- [ ] **Step 1: `app/(storefront)/checkout/page.tsx`** — mostrar la opción Tarjeta si MP está configurado. Añadir import `import { mpConfigurado } from "@/lib/mercadopago";`. En el bloque de "Método de pago", DESPUÉS del radio de EFECTIVO y ANTES del `<p>` "Pago con tarjeta (Mercado Pago) próximamente.", insertar (y quitar/condicionar esa nota):
```tsx
        {mpConfigurado && (
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="TARJETA" /> Tarjeta (Mercado Pago)
          </label>
        )}
```
Eliminar la línea `<p className="text-xs text-slate-400">Pago con tarjeta (Mercado Pago) próximamente.</p>` (ya no aplica si MP está configurado; si prefieres, déjala dentro de `{!mpConfigurado && (...)}`).

- [ ] **Step 2: `app/(storefront)/checkout/actions.ts`** — manejar TARJETA. (a) imports:
```typescript
import { mpConfigurado, crearPreferenciaMP } from "@/lib/mercadopago";
```
(b) Cambiar el parseo de `paymentMethod` para aceptar TARJETA:
```typescript
  const pmRaw = String(formData.get("paymentMethod") ?? "TRANSFERENCIA");
  const paymentMethod = (["TRANSFERENCIA", "EFECTIVO", "TARJETA"].includes(pmRaw) ? pmRaw : "TRANSFERENCIA") as
    | "TRANSFERENCIA"
    | "EFECTIVO"
    | "TARJETA";
```
(c) Tras crear el `order` y `await writeCart([])`, ANTES del `redirect(\`/pedido/${order.id}\`)`, insertar:
```typescript
  if (paymentMethod === "TARJETA" && mpConfigurado) {
    const initPoint = await crearPreferenciaMP({
      orderId: order.id,
      totalCents,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    });
    redirect(initPoint);
  }
```
(El `redirect(\`/pedido/${order.id}\`)` queda como fallback para transferencia/efectivo.)

- [ ] **Step 3: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Verificar** — checkout sin sesión redirige a `/ingresar`; con MP configurado el radio "Tarjeta" aparece en el HTML. (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  try { Invoke-WebRequest http://localhost:3000/checkout -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 | Out-Null; Write-Output "checkout sin sesion: NO redirige" } catch { Write-Output ("checkout redirige a: " + $_.Exception.Response.Headers.Location) }
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: redirige a `/ingresar`.

- [ ] **Step 5: Commit**
```powershell
git add "app/(storefront)/checkout"
git commit -m "feat: Tarjeta (Mercado Pago) option in checkout + preference redirect"
```

---

### Task 3: Retorno + webhook (marcar PAGADO)

**Files:** Create `app/(storefront)/checkout/resultado/page.tsx`, `app/api/mp/webhook/route.ts`.

- [ ] **Step 1: Create `app/(storefront)/checkout/resultado/page.tsx`** — EXACTO:
```tsx
import Link from "next/link";
import { obtenerPagoMP, marcarPedidoPagado } from "@/lib/mercadopago";

type SP = Promise<{ payment_id?: string; status?: string; external_reference?: string }>;

export default async function ResultadoPage({ searchParams }: { searchParams: SP }) {
  const { payment_id, status, external_reference } = await searchParams;

  let aprobado = false;
  let orderId = external_reference ?? null;

  if (payment_id) {
    try {
      const pago = await obtenerPagoMP(payment_id);
      if (pago.status === "approved" && pago.external_reference) {
        orderId = pago.external_reference;
        await marcarPedidoPagado(orderId);
        aprobado = true;
      }
    } catch {
      // si falla la verificación, mostramos estado según el query
    }
  }
  if (!aprobado && status === "approved") aprobado = true;

  return (
    <div className="mx-auto max-w-xl p-6 text-center">
      {aprobado ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800">
          <h1 className="text-2xl font-bold">¡Pago aprobado! 🎉</h1>
          <p className="mt-2">Tu pedido fue pagado y está en proceso.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h1 className="text-2xl font-bold">Pago pendiente o no completado</h1>
          <p className="mt-2">Si ya pagaste, lo confirmaremos en breve. Si no, intenta de nuevo.</p>
        </div>
      )}
      <div className="mt-6 flex justify-center gap-4">
        {orderId && (
          <Link href={`/pedido/${orderId}`} className="rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
            Ver mi pedido
          </Link>
        )}
        <Link href="/" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/api/mp/webhook/route.ts`** — EXACTO:
```typescript
import { obtenerPagoMP, marcarPedidoPagado } from "@/lib/mercadopago";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => null);
    // MP puede mandar { type, data:{id} } en el cuerpo, o ?topic=payment&id= / ?type=payment&data.id=
    const paymentId =
      body?.data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      null;
    const tipo = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (paymentId && (tipo === "payment" || tipo === null)) {
      const pago = await obtenerPagoMP(String(paymentId));
      if (pago.status === "approved" && pago.external_reference) {
        await marcarPedidoPagado(pago.external_reference);
      }
    }
  } catch {
    // no romper: MP reintenta; respondemos 200 igual para evitar reintentos infinitos en errores no recuperables
  }
  return new Response("ok", { status: 200 });
}
```

- [ ] **Step 3: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Verificar** — `/checkout/resultado` carga (200) sin params (muestra "pendiente"); el webhook responde 200 a un POST vacío. (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  Write-Output ("resultado 200: " + ((Invoke-WebRequest http://localhost:3000/checkout/resultado -UseBasicParsing -TimeoutSec 25).StatusCode))
  Write-Output ("webhook 200: " + ((Invoke-WebRequest http://localhost:3000/api/mp/webhook -Method Post -Body '{}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec 25).StatusCode))
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: resultado 200; webhook 200.

- [ ] **Step 5: Commit**
```powershell
git add "app/(storefront)/checkout/resultado" app/api
git commit -m "feat: MP return page + webhook (mark order paid)"
```

---

## Definición de "terminado" (Plan 14)
- La creación de preferencia funciona con el token de prueba (verificado).
- El checkout ofrece "Tarjeta (Mercado Pago)"; al elegirla, crea el pedido y redirige a Mercado Pago.
- El retorno (`/checkout/resultado`) y el webhook (`/api/mp/webhook`) marcan el pedido PAGADO (idempotente).
- `npx tsc --noEmit` limpio y `npm test` verde.

## Pendiente para producción
- El **flujo completo de pago** (redirección real + webhook) requiere **URL pública** → probar tras el deploy (o con un túnel tipo cloudflared). En https se activa `auto_return`.
- Usar credenciales de **producción** (regeneradas) solo en el entorno de producción.
