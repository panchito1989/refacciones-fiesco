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
