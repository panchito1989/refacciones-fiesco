"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { writeCart } from "@/lib/cart";
import { resolveCart } from "@/lib/orders";
import { getClienteEstado, descuentoPreferente } from "@/lib/preferente";
import { mpConfigurado, crearPreferenciaMP } from "@/lib/mercadopago";

export async function crearPedido(formData: FormData) {
  const profile = await getProfile();
  if (!profile) redirect("/ingresar");

  const { lines, subtotalCents, shippingCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");

  const { preferente } = await getClienteEstado(profile.id);
  const discountCents = preferente ? descuentoPreferente(subtotalCents) : 0;
  const totalCents = subtotalCents - discountCents + shippingCents;

  const pmRaw = String(formData.get("paymentMethod") ?? "TRANSFERENCIA");
  const paymentMethod = (["TRANSFERENCIA", "EFECTIVO", "TARJETA"].includes(pmRaw) ? pmRaw : "TRANSFERENCIA") as
    | "TRANSFERENCIA"
    | "EFECTIVO"
    | "TARJETA";

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
      discountCents,
      shippingCents,
      totalCents,
      ...ship,
      items: {
        create: lines.map((l) => ({ sku: l.sku, name: l.name, priceCents: l.priceCents, qty: l.qty })),
      },
    },
  });

  await writeCart([]);

  if (paymentMethod === "TARJETA" && mpConfigurado) {
    const initPoint = await crearPreferenciaMP({
      orderId: order.id,
      totalCents,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    });
    redirect(initPoint);
  }

  redirect(`/pedido/${order.id}`);
}
