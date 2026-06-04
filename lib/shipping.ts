export const FREE_SHIPPING_THRESHOLD_CENTS = 59900; // $599.00
export const SHIPPING_FLAT_CENTS = 19900; // $199 tarifa fija cuando no aplica envío gratis

export function isFreeShipping(subtotalCents: number): boolean {
  return subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS;
}
