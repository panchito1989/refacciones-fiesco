import { obtenerPagoMP, marcarPedidoPagado } from "@/lib/mercadopago";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => null);
    const paymentId =
      body?.data?.id ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      null;
    const tipo = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (paymentId && (tipo === "payment" || tipo === null)) {
      const pago = await obtenerPagoMP(String(paymentId));
      if (pago.status === "approved" && pago.external_reference) {
        await marcarPedidoPagado(pago.external_reference);
      }
    }
  } catch {
    // no romper: respondemos 200 para evitar reintentos infinitos
  }
  return new Response("ok", { status: 200 });
}
