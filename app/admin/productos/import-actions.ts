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

    // Resolve category by slug (soft warning — don't abort if not found)
    let categoryId: string | null = null;
    const categoriaSlug = (row.categoria ?? "").trim();
    if (categoriaSlug) {
      try {
        const cat = await prisma.category.findUnique({ where: { slug: categoriaSlug } });
        if (cat) {
          categoryId = cat.id;
        } else {
          errores.push(
            `Fila ${rowNum} (SKU ${sku}): categoría "${categoriaSlug}" no encontrada — se importa sin categoría.`
          );
        }
      } catch {
        // Non-fatal: still import the product without a category
        errores.push(
          `Fila ${rowNum} (SKU ${sku}): error buscando categoría "${categoriaSlug}" — se importa sin categoría.`
        );
      }
    }

    try {
      // Determine created vs updated BEFORE the upsert
      const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } });

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

      if (existing) {
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
