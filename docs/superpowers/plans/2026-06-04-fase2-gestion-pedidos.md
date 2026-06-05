# Fase 2 — Gestión de pedidos y solicitudes (Plan 8) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que el admin pueda **operar el negocio**: navegación del panel, ver y **cambiar el estado de los pedidos** (pendiente→pagado→enviado→entregado/cancelado) y de las **solicitudes de servicio técnico**.

**Architecture:** Se añade una barra de navegación al `app/admin/layout.tsx`. Páginas `/admin/pedidos` (lista) y `/admin/pedidos/[id]` (detalle con cambio de estado). Server actions `cambiarEstadoPedido` y `cambiarEstadoSolicitud`, protegidos con `requireAdmin()`. La página `/admin/solicitudes` gana un selector de estado por fila.

**Tech Stack:** Next.js 16 (App Router, TS, Tailwind), Prisma 6.

## Contexto ya existente (NO recrear)
- `app/admin/layout.tsx`: guard con `requireAdmin()`; salta el guard si `x-pathname === "/admin/login"`; envuelve en `<div className="mx-auto max-w-5xl p-6">{children}</div>`.
- `lib/auth.ts` (`requireAdmin`), `lib/format.ts` (`formatMXN`), `lib/prisma.ts`.
- Modelo `Order` (id, customerId, customer→Profile, status [OrderStatus: PENDIENTE_PAGO/PAGADO/ENVIADO/ENTREGADO/CANCELADO], paymentMethod, subtotalCents, shippingCents, totalCents, shipName/Phone/Street/City/State/Zip, items→OrderItem, createdAt). `Profile` (email). `OrderItem` (name, priceCents, qty).
- Modelo `SolicitudServicio` (id, nombre, telefono, ciudad, direccion, descripcion, estado [SolicitudEstado: SOLICITADO/AGENDADO/EN_PROCESO/COMPLETADO/CANCELADO], createdAt).
- `app/admin/solicitudes/page.tsx` lista solicitudes (read-only).
- `app/admin/productos/page.tsx` existe.

## Estructura de archivos
```
app/admin/layout.tsx                  # MOD: barra de navegación
app/admin/pedidos/page.tsx            # NUEVO: lista de pedidos
app/admin/pedidos/[id]/page.tsx       # NUEVO: detalle + cambiar estado
app/admin/pedidos/actions.ts          # NUEVO: cambiarEstadoPedido
app/admin/solicitudes/actions.ts      # NUEVO: cambiarEstadoSolicitud
app/admin/solicitudes/page.tsx        # MOD: selector de estado por fila
```

---

### Task 1: Navegación del admin + pedidos (lista, detalle, cambio de estado)

**Files:** Modify `app/admin/layout.tsx`; Create `app/admin/pedidos/page.tsx`, `app/admin/pedidos/[id]/page.tsx`, `app/admin/pedidos/actions.ts`.

- [ ] **Step 1: Replace `app/admin/layout.tsx`** — EXACTO (añade nav):
```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <nav className="mb-6 flex gap-4 border-b pb-3 text-sm font-medium">
        <Link href="/admin/productos" className="text-blue-700 hover:underline">Productos</Link>
        <Link href="/admin/pedidos" className="text-blue-700 hover:underline">Pedidos</Link>
        <Link href="/admin/solicitudes" className="text-blue-700 hover:underline">Solicitudes</Link>
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/pedidos/actions.ts`**:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ESTADOS = ["PENDIENTE_PAGO", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"] as const;

export async function cambiarEstadoPedido(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "");
  if (!ESTADOS.includes(status as (typeof ESTADOS)[number])) return;
  await prisma.order.update({ where: { id }, data: { status: status as (typeof ESTADOS)[number] } });
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
}
```

- [ ] **Step 3: Create `app/admin/pedidos/page.tsx`**:
```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-slate-500">Aún no hay pedidos.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Pedido</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2">#{o.id.slice(-6).toUpperCase()}</td>
                <td>{o.customer.email}</td>
                <td>{formatMXN(o.totalCents)}</td>
                <td>{o.paymentMethod}</td>
                <td>{STATUS_LABEL[o.status] ?? o.status}</td>
                <td>
                  <Link href={`/admin/pedidos/${o.id}`} className="text-blue-700 hover:underline">
                    Ver
                  </Link>
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

- [ ] **Step 4: Create `app/admin/pedidos/[id]/page.tsx`**:
```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMXN } from "@/lib/format";
import { cambiarEstadoPedido } from "../actions";

const ESTADOS = ["PENDIENTE_PAGO", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"];
const STATUS_LABEL: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default async function AdminPedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) notFound();

  const action = cambiarEstadoPedido.bind(null, order.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Pedido #{order.id.slice(-6).toUpperCase()}</h1>
      <p className="mt-1 text-sm text-slate-500">{order.customer.email} · {order.paymentMethod}</p>

      <ul className="mt-4 divide-y divide-slate-200 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between py-2">
            <span>{it.qty} × {it.name}</span>
            <span>{formatMXN(it.priceCents * it.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMXN(order.subtotalCents)}</span></div>
        <div className="flex justify-between"><span>Envío</span><span>{order.shippingCents === 0 ? "Gratis" : formatMXN(order.shippingCents)}</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>{formatMXN(order.totalCents)}</span></div>
      </div>

      <div className="mt-4 rounded border border-slate-200 p-3 text-sm">
        <p className="font-semibold">Envío</p>
        <p>{order.shipName} · {order.shipPhone}</p>
        <p>{order.shipStreet}, {order.shipCity}, {order.shipState}, CP {order.shipZip}</p>
      </div>

      <form action={action} className="mt-6 flex items-center gap-2">
        <label className="text-sm font-medium">Estado:</label>
        <select name="status" defaultValue={order.status} className="rounded border border-slate-300 p-2 text-sm">
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{STATUS_LABEL[e]}</option>
          ))}
        </select>
        <button className="rounded bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800">Actualizar</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores. (Si error stale de `.next/dev/types`, borrar `.next` y reintentar.)

- [ ] **Step 6: Verificar** — `/admin/pedidos` sin sesión redirige a `/admin/login` (cmd /c + poll; matar node 3000):
```powershell
$d = Start-Process cmd -ArgumentList "/c","npm run dev" -PassThru -WindowStyle Hidden
try {
  for ($i=0;$i -lt 45;$i++){Start-Sleep 2; try{$null=Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 3; break}catch{}}
  try { Invoke-WebRequest http://localhost:3000/admin/pedidos -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 | Out-Null; Write-Output "pedidos sin sesion: NO redirige" } catch { Write-Output ("pedidos redirige a: " + $_.Exception.Response.Headers.Location) }
} finally {
  Stop-Process -Id $d.Id -Force -ErrorAction SilentlyContinue
  $c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($c) { $c.OwningProcess | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
```
Expected: redirige a `/admin/login`.

- [ ] **Step 7: Commit**
```powershell
git add app/admin/layout.tsx app/admin/pedidos
git commit -m "feat: admin nav + order management (list, detail, status change)"
```

---

### Task 2: Cambio de estado de solicitudes de servicio

**Files:** Create `app/admin/solicitudes/actions.ts`; Modify `app/admin/solicitudes/page.tsx`.

- [ ] **Step 1: Create `app/admin/solicitudes/actions.ts`**:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ESTADOS = ["SOLICITADO", "AGENDADO", "EN_PROCESO", "COMPLETADO", "CANCELADO"] as const;

export async function cambiarEstadoSolicitud(id: string, formData: FormData) {
  await requireAdmin();
  const estado = String(formData.get("estado") ?? "");
  if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) return;
  await prisma.solicitudServicio.update({ where: { id }, data: { estado: estado as (typeof ESTADOS)[number] } });
  revalidatePath("/admin/solicitudes");
}
```

- [ ] **Step 2: Replace `app/admin/solicitudes/page.tsx`** — EXACTO (selector de estado por fila):
```tsx
import { prisma } from "@/lib/prisma";
import { cambiarEstadoSolicitud } from "./actions";

const ESTADOS = ["SOLICITADO", "AGENDADO", "EN_PROCESO", "COMPLETADO", "CANCELADO"];
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
                <td>
                  <form action={cambiarEstadoSolicitud.bind(null, s.id)} className="flex items-center gap-1">
                    <select name="estado" defaultValue={s.estado} className="rounded border border-slate-300 p-1 text-xs">
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

- [ ] **Step 3: Typecheck**
```powershell
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 4: Commit**
```powershell
git add app/admin/solicitudes
git commit -m "feat: admin service request status change"
```

---

## Definición de "terminado" (Plan 8)
- El panel admin tiene navegación (Productos / Pedidos / Solicitudes).
- `/admin/pedidos` lista pedidos; `/admin/pedidos/[id]` muestra el detalle y permite cambiar el estado.
- `/admin/solicitudes` permite cambiar el estado de cada solicitud.
- `npx tsc --noEmit` limpio y `npm test` verde.

## Próximo plan
- **Plan 9:** "Te lo consigo" (backorder) + igualar precio (como sistemas de solicitud).
