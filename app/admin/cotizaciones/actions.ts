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
