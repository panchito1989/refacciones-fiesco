import type { Prisma } from "@prisma/client";

export function buildProductWhere(query: string): Prisma.ProductWhereInput {
  const q = query.trim();
  if (q.length === 0) {
    // Query vacía: forzar cero resultados sin reventar el query.
    return { status: "PUBLICADO", id: "__no_match__" };
  }
  return {
    status: "PUBLICADO",
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { partNumber: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { equivalences: { has: q.toUpperCase() } },
    ],
  };
}
