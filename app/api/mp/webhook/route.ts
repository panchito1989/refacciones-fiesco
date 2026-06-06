import crypto from "node:crypto";
import { obtenerPagoMP, marcarPedidoPagado } from "@/lib/mercadopago";

let _warnedOnce = false;

export async function POST(req: Request) {
  // ── Optional HMAC signature verification (gated on MP_WEBHOOK_SECRET) ──
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    try {
      const xSignature = req.headers.get("x-signature") ?? "";
      const requestId = req.headers.get("x-request-id") ?? "";
      const url = new URL(req.url);
      const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

      // Parse ts and v1 from "ts=<ts>,v1=<hash>"
      const parts = Object.fromEntries(
        xSignature.split(",").map((p) => p.split("=") as [string, string])
      );
      const ts = parts["ts"] ?? "";
      const v1 = parts["v1"] ?? "";

      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

      const expectedBuf = Buffer.from(expected, "hex");
      const actualBuf = Buffer.from(v1, "hex");

      if (
        expectedBuf.length !== actualBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, actualBuf)
      ) {
        return new Response("invalid signature", { status: 401 });
      }
    } catch (e) {
      console.error("[mp-webhook] error verificando firma:", e);
      return new Response("invalid signature", { status: 401 });
    }
  } else {
    if (!_warnedOnce) {
      console.warn(
        "[mp-webhook] MP_WEBHOOK_SECRET no configurado; firma no verificada"
      );
      _warnedOnce = true;
    }
  }

  // ── Business logic (existing behavior preserved) ──
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
  } catch (e) {
    console.error("[mp-webhook] error:", e);
    // no romper: respondemos 200 para evitar reintentos infinitos
  }
  return new Response("ok", { status: 200 });
}
