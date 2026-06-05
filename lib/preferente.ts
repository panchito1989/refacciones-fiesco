import { prisma } from "@/lib/prisma";

export const UMBRAL_PREFERENTE = 3; // compras pagadas para volverse preferente
export const DESCUENTO_PREFERENTE = 0.05; // 5%

export function descuentoPreferente(subtotalCents: number): number {
  return Math.round(subtotalCents * DESCUENTO_PREFERENTE);
}

/** Devuelve si el cliente es preferente (flag manual o por # de compras pagadas) y cuántas lleva. */
export async function getClienteEstado(
  userId: string
): Promise<{ preferente: boolean; ordenesPagadas: number }> {
  const [ordenesPagadas, profile] = await Promise.all([
    prisma.order.count({
      where: { customerId: userId, status: { in: ["PAGADO", "ENVIADO", "ENTREGADO"] } },
    }),
    prisma.profile.findUnique({ where: { id: userId }, select: { preferente: true } }),
  ]);
  return {
    preferente: (profile?.preferente ?? false) || ordenesPagadas >= UMBRAL_PREFERENTE,
    ordenesPagadas,
  };
}
