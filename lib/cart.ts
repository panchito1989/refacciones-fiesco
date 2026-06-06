import { cookies } from "next/headers";

const COOKIE = "cart";

export type CartLine = { sku: string; qty: number };

export async function getCart(): Promise<CartLine[]> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => typeof l?.sku === "string" && Number.isInteger(l?.qty) && l.qty > 0);
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export function addLine(lines: CartLine[], sku: string, qty = 1): CartLine[] {
  const next = [...lines];
  const existing = next.find((l) => l.sku === sku);
  if (existing) existing.qty += qty;
  else next.push({ sku, qty });
  return next;
}
