"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimitOk } from "@/lib/rate-limit";

export async function crearLead(formData: FormData) {
  const tipo =
    String(formData.get("tipo") ?? "CONSEGUIR") === "IGUALAR_PRECIO" ? "IGUALAR_PRECIO" : "CONSEGUIR";

  if (!(await rateLimitOk("lead"))) {
    redirect(tipo === "IGUALAR_PRECIO" ? "/igualar-precio?error=limite" : "/conseguir?error=limite");
  }

  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const telefono = String(formData.get("telefono") ?? "").trim().slice(0, 30);
  const emailRaw = String(formData.get("email") ?? "").trim();
  const detalle = String(formData.get("detalle") ?? "").trim().slice(0, 1000);
  const skuRaw = String(formData.get("productoSku") ?? "").trim();

  if (!nombre || !telefono || !detalle) {
    throw new Error("Faltan datos (nombre, teléfono y detalle).");
  }

  await prisma.lead.create({
    data: {
      tipo,
      nombre,
      telefono,
      email: emailRaw.length > 0 ? emailRaw : null,
      detalle,
      productoSku: skuRaw.length > 0 ? skuRaw : null,
      estado: "NUEVO",
    },
  });

  redirect(tipo === "IGUALAR_PRECIO" ? "/igualar-precio?ok=1" : "/conseguir?ok=1");
}
