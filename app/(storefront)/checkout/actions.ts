"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { writeCart } from "@/lib/cart";
import { resolveCart } from "@/lib/orders";

export async function crearPedido(formData: FormData) {
  const profile = await getProfile();
  if (!profile) redirect("/ingresar");

  const { lines, subtotalCents, shippingCents, totalCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");

  const paymentMethod =
    String(formData.get("paymentMethod") ?? "TRANSFERENCIA") === "EFECTIVO" ? "EFECTIVO" : "TRANSFERENCIA";

  const ship = {
    shipName: String(formData.get("shipName") ?? "").trim(),
    shipPhone: String(formData.get("shipPhone") ?? "").trim(),
    shipStreet: String(formData.get("shipStreet") ?? "").trim(),
    shipCity: String(formData.get("shipCity") ?? "").trim(),
    shipState: String(formData.get("shipState") ?? "").trim(),
    shipZip: String(formData.get("shipZip") ?? "").trim(),
  };
  if (!ship.shipName || !ship.shipPhone || !ship.shipStreet || !ship.shipCity || !ship.shipState || !ship.shipZip) {
    throw new Error("Faltan datos de envío.");
  }

  const order = await prisma.order.create({
    data: {
      customerId: profile.id,
      status: "PENDIENTE_PAGO",
      paymentMethod,
      subtotalCents,
      shippingCents,
      totalCents,
      ...ship,
      items: {
        create: lines.map((l) => ({ sku: l.sku, name: l.name, priceCents: l.priceCents, qty: l.qty })),
      },
    },
  });

  await writeCart([]);
  redirect(`/pedido/${order.id}`);
}
