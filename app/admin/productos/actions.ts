"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

function leerCampos(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const partNumber = String(formData.get("partNumber") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const priceMxn = Number(formData.get("priceMxn") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const condition =
    String(formData.get("condition") ?? "NUEVO") === "RECUPERADO" ? "RECUPERADO" : "NUEVO";
  const status =
    String(formData.get("status") ?? "BORRADOR") === "PUBLICADO" ? "PUBLICADO" : "BORRADOR";
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const categoryId = categoryIdRaw.length > 0 ? categoryIdRaw : null;
  const equivalences = String(formData.get("equivalences") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (!name || !sku || !partNumber || !brand) {
    throw new Error("Faltan campos obligatorios (nombre, SKU, número de parte, marca).");
  }
  return {
    name,
    sku,
    partNumber,
    brand,
    brandSlug: slugify(brand),
    slug: slugify(name),
    priceCents: Math.round(priceMxn * 100),
    stock,
    condition: condition as "NUEVO" | "RECUPERADO",
    status: status as "BORRADOR" | "PUBLICADO",
    categoryId,
    equivalences,
  };
}

export async function crearProducto(formData: FormData) {
  await requireAdmin();
  const data = leerCampos(formData);
  await prisma.product.create({ data });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function actualizarProducto(id: string, formData: FormData) {
  await requireAdmin();
  const data = leerCampos(formData);
  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function eliminarProducto(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/productos");
}

export async function togglePublicado(id: string) {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id }, select: { status: true } });
  if (!p) return;
  await prisma.product.update({
    where: { id },
    data: { status: p.status === "PUBLICADO" ? "BORRADOR" : "PUBLICADO" },
  });
  revalidatePath("/admin/productos");
}
