"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimitOk } from "@/lib/rate-limit";

export async function crearSolicitud(formData: FormData) {
  if (!(await rateLimitOk("solicitud"))) {
    redirect("/servicio-tecnico?error=limite");
  }

  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const telefono = String(formData.get("telefono") ?? "").trim().slice(0, 30);
  const ciudad = String(formData.get("ciudad") ?? "").trim().slice(0, 80);
  const direccion = String(formData.get("direccion") ?? "").trim().slice(0, 250);
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 1000);
  const skuRaw = String(formData.get("productoSku") ?? "").trim();
  const productoSku = skuRaw.length > 0 ? skuRaw : null;

  if (!nombre || !telefono || !ciudad || !direccion || !descripcion) {
    throw new Error("Faltan datos para la solicitud.");
  }

  await prisma.solicitudServicio.create({
    data: { nombre, telefono, ciudad, direccion, descripcion, productoSku, estado: "SOLICITADO" },
  });

  redirect("/servicio-tecnico?ok=1");
}
