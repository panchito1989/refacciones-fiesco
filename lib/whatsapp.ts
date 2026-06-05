export const WHATSAPP_NUMEROS = ["525622042820", "525627003256"] as const;
export const WHATSAPP_PRINCIPAL = WHATSAPP_NUMEROS[0];

/** Construye un enlace wa.me con mensaje opcional prellenado. */
export function waLink(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

/** Formatea un número 52XXXXXXXXXX como "55 XXXX XXXX" para mostrar. */
export function waDisplay(numero: string): string {
  const local = numero.replace(/^52/, "");
  return local.length === 10 ? `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}` : local;
}
