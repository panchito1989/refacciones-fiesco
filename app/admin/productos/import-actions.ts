"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type ImportResult = {
  creados: number;
  actualizados: number;
  errores: string[];
  total: number;
  truncated?: boolean;
};

const MAX_ROWS = 3000;

// Rows expected in the CSV
type CsvRow = {
  sku?: string;
  numero_parte?: string;
  nombre?: string;
  marca?: string;
  categoria?: string;
  condicion?: string;
  precio_mxn?: string;
  stock?: string;
  equivalencias?: string;
  descripcion?: string;
  estado?: string;
};

export async function importarProductos(
  prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  await requireAdmin();

  const file = formData.get("archivo");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { creados: 0, actualizados: 0, errores: ["No se recibió ningún archivo."], total: 0 };
  }

  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  let rows = parsed.data;
  let truncated = false;
  if (rows.length > MAX_ROWS) {
    rows = rows.slice(0, MAX_ROWS);
    truncated = true;
  }

  // --- Batch pre-loads to avoid N+1 queries ---
  // 1. Load all categories once into a slug→id map
  const allCategories = await prisma.category.findMany({ select: { slug: true, id: true } });
  const categoryMap = new Map<string, string>(allCategories.map((c) => [c.slug, c.id]));

  // 2. Collect all SKUs from valid rows, then load existing ones in one query
  const allSkus = rows
    .map((r) => (r.sku ?? "").trim())
    .filter((s) => s.length > 0);
  const existingSkuSet = new Set(
    (
      await prisma.product.findMany({
        where: { sku: { in: allSkus } },
        select: { sku: true },
      })
    ).map((p) => p.sku)
  );
  // --- end batch pre-loads ---

  let creados = 0;
  let actualizados = 0;
  const errores: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // 1-based, +1 for header row
    const row = rows[i];

    // Trim / normalize all string fields
    const sku = (row.sku ?? "").trim();
    const nombre = (row.nombre ?? "").trim();
    const marca = (row.marca ?? "").trim();

    // Required fields
    if (!sku) {
      errores.push(`Fila ${rowNum}: SKU vacío — fila omitida.`);
      continue;
    }
    if (!nombre) {
      errores.push(`Fila ${rowNum} (SKU ${sku}): nombre vacío — fila omitida.`);
      continue;
    }
    if (!marca) {
      errores.push(`Fila ${rowNum} (SKU ${sku}): marca vacía — fila omitida.`);
      continue;
    }

    // Derived fields — mirror crearProducto exactly
    const slug = slugify(nombre);
    const brandSlug = slugify(marca);
    const partNumber = (row.numero_parte ?? "").trim() || sku;

    const priceMxn = parseFloat((row.precio_mxn ?? "").trim()) || 0;
    const priceCents = Math.round(priceMxn * 100);

    const stockVal = parseInt((row.stock ?? "").trim(), 10);
    const stock = isNaN(stockVal) ? 0 : stockVal;

    const condicionRaw = (row.condicion ?? "").trim().toUpperCase();
    const condition: "NUEVO" | "RECUPERADO" =
      condicionRaw === "RECUPERADO" ? "RECUPERADO" : "NUEVO";

    const estadoRaw = (row.estado ?? "").trim().toUpperCase();
    const status: "BORRADOR" | "PUBLICADO" =
      estadoRaw === "PUBLICADO" ? "PUBLICADO" : "BORRADOR";

    // Equivalencias: split by ";", trim, uppercase, drop empties
    const equivalences = (row.equivalencias ?? "")
      .split(";")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    const description = (row.descripcion ?? "").trim() || undefined;

    // Resolve category by slug using the pre-loaded map (no per-row DB query)
    let categoryId: string | null = null;
    const categoriaSlug = (row.categoria ?? "").trim();
    if (categoriaSlug) {
      const catId = categoryMap.get(categoriaSlug);
      if (catId) {
        categoryId = catId;
      } else {
        errores.push(
          `Fila ${rowNum} (SKU ${sku}): categoría "${categoriaSlug}" no encontrada — se importa sin categoría.`
        );
      }
    }

    try {
      // Determine created vs updated using the pre-loaded set (no per-row DB query)
      const existsAlready = existingSkuSet.has(sku);

      await prisma.product.upsert({
        where: { sku },
        update: {
          partNumber,
          name: nombre,
          slug,
          brand: marca,
          brandSlug,
          categoryId,
          condition,
          priceCents,
          stock,
          equivalences,
          status,
          ...(description !== undefined ? { description } : {}),
        },
        create: {
          sku,
          partNumber,
          name: nombre,
          slug,
          brand: marca,
          brandSlug,
          categoryId,
          condition,
          priceCents,
          stock,
          equivalences,
          photos: [],
          status,
          ...(description !== undefined ? { description } : {}),
        },
      });

      if (existsAlready) {
        actualizados++;
      } else {
        creados++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errores.push(`Fila ${rowNum} (SKU ${sku}): ${msg}`);
    }
  }

  revalidatePath("/admin/productos");

  return {
    creados,
    actualizados,
    errores,
    total: rows.length,
    truncated,
  };
}
