"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function crearSolicitud(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
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
