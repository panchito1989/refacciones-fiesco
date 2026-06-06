"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProfile } from "@/lib/auth";
import { writeCart } from "@/lib/cart";
import { resolveCart } from "@/lib/orders";
import { getClienteEstado, descuentoPreferente } from "@/lib/preferente";
import { mpConfigurado, crearPreferenciaMP } from "@/lib/mercadopago";
import { rateLimitOk } from "@/lib/rate-limit";

export async function crearPedido(formData: FormData) {
  const profile = await getProfile();
  if (!profile) redirect("/ingresar");

  const { lines, subtotalCents, shippingCents } = await resolveCart();
  if (lines.length === 0) redirect("/carrito");

  if (!(await rateLimitOk("checkout"))) {
    redirect("/carrito?error=limite");
  }

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

  // Redirect back to form if shipping data is missing (fields are HTML-required; this is an edge case)
  if (!ship.shipName || !ship.shipPhone || !ship.shipStreet || !ship.shipCity || !ship.shipState || !ship.shipZip) {
    redirect("/checkout");
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
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

    // Decrement stock atomically, only when sufficient stock exists
    for (const l of lines) {
      await tx.product.updateMany({
        where: { sku: l.sku, stock: { gte: l.qty } },
        data: { stock: { decrement: l.qty } },
      });
    }

    return created;
  });

  await writeCart([]);

  if (paymentMethod === "TARJETA" && mpConfigurado) {
    let initPoint: string | null = null;
    try {
      initPoint = await crearPreferenciaMP({
        orderId: order.id,
        totalCents,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      });
    } catch (err) {
      console.error("[checkout] crearPreferenciaMP falló:", err);
    }
    if (initPoint) redirect(initPoint);
    // MP failed: fall through to order page
    redirect(`/pedido/${order.id}`);
  }

  redirect(`/pedido/${order.id}`);
}
