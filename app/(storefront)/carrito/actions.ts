"use server";

import { revalidatePath } from "next/cache";
import { getCart, writeCart, addLine } from "@/lib/cart";

export async function agregarAlCarrito(sku: string) {
  const lines = await getCart();
  await writeCart(addLine(lines, sku, 1));
  revalidatePath("/carrito");
}

export async function quitarDelCarrito(sku: string) {
  const lines = await getCart();
  await writeCart(lines.filter((l) => l.sku !== sku));
  revalidatePath("/carrito");
}

export async function vaciarCarrito() {
  await writeCart([]);
  revalidatePath("/carrito");
}
