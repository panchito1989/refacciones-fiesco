"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function crearProducto(formData: FormData) {
  // Seguridad: solo usuarios autenticados
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const partNumber = String(formData.get("partNumber") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const priceMxn = Number(formData.get("priceMxn") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);
  const condition =
    String(formData.get("condition") ?? "NUEVO") === "RECUPERADO"
      ? "RECUPERADO"
      : "NUEVO";

  if (!name || !sku || !partNumber || !brand) {
    throw new Error("Faltan campos obligatorios (nombre, SKU, número de parte, marca).");
  }

  await prisma.product.create({
    data: {
      name,
      sku,
      partNumber,
      brand,
      brandSlug: slugify(brand),
      slug: slugify(name),
      priceCents: Math.round(priceMxn * 100),
      stock,
      condition,
      status: "BORRADOR",
    },
  });

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
