import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

export const mpConfigurado = Boolean(process.env.MP_ACCESS_TOKEN);

function client() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
}

/** Crea una preferencia de Checkout Pro con un solo ítem = total del pedido. Devuelve el init_point. */
export async function crearPreferenciaMP(params: {
  orderId: string;
  totalCents: number;
  siteUrl: string;
}): Promise<string> {
  const pref = new Preference(client());
  const isHttps = params.siteUrl.startsWith("https");
  const res = await pref.create({
    body: {
      items: [
        {
          id: params.orderId,
          title: `Pedido Refacciones Fiesco #${params.orderId.slice(-6).toUpperCase()}`,
          quantity: 1,
          unit_price: Math.round(params.totalCents) / 100,
          currency_id: "MXN",
        },
      ],
      external_reference: params.orderId,
      back_urls: {
        success: `${params.siteUrl}/checkout/resultado`,
        failure: `${params.siteUrl}/checkout/resultado`,
        pending: `${params.siteUrl}/checkout/resultado`,
      },
      ...(isHttps ? { auto_return: "approved" as const } : {}),
      notification_url: `${params.siteUrl}/api/mp/webhook`,
    },
  });
  if (!res.init_point) throw new Error("Mercado Pago no devolvió init_point");
  return res.init_point;
}

export async function obtenerPagoMP(paymentId: string) {
  const pay = new Payment(client());
  return pay.get({ id: paymentId });
}

/** Marca el pedido como PAGADO solo si estaba PENDIENTE_PAGO (idempotente). */
export async function marcarPedidoPagado(orderId: string): Promise<void> {
  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDIENTE_PAGO" },
    data: { status: "PAGADO" },
  });
}
