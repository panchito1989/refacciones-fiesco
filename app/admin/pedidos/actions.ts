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
