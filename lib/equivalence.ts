import type { Prisma } from "@prisma/client";

export function normalizePart(part: string): string {
  return part.trim().toUpperCase();
}

export function buildEquivalenceWhere(part: string): Prisma.ProductWhereInput {
  const p = normalizePart(part);
  return {
    status: "PUBLICADO",
    OR: [
      { partNumber: { equals: p, mode: "insensitive" } },
      { equivalences: { has: p } },
    ],
  };
}
