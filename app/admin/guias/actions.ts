"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { parsePasos, parseFaqs } from "@/lib/guias";

function leerGuia(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const resumen = String(formData.get("resumen") ?? "").trim();
  const intro = String(formData.get("intro") ?? "").trim();
  const pasos = parsePasos(String(formData.get("pasos") ?? ""));
  const faqs = parseFaqs(String(formData.get("faqs") ?? ""));
  const status = String(formData.get("status") ?? "BORRADOR") === "PUBLICADO" ? "PUBLICADO" : "BORRADOR";
  if (!titulo || !resumen || !intro) throw new Error("Faltan campos (título, resumen, introducción).");
  return { titulo, slug: slugify(titulo), resumen, intro, pasos, faqs, status: status as "BORRADOR" | "PUBLICADO" };
}

export async function crearGuia(formData: FormData) {
  await requireAdmin();
  await prisma.guia.create({ data: leerGuia(formData) });
  revalidatePath("/admin/guias");
  redirect("/admin/guias");
}

export async function actualizarGuia(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.guia.update({ where: { id }, data: leerGuia(formData) });
  revalidatePath("/admin/guias");
  redirect("/admin/guias");
}

export async function eliminarGuia(id: string) {
  await requireAdmin();
  await prisma.guia.delete({ where: { id } });
  revalidatePath("/admin/guias");
}
