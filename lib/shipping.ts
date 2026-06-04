export const FREE_SHIPPING_THRESHOLD_CENTS = 59900; // $599.00

export function isFreeShipping(subtotalCents: number): boolean {
  return subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS;
}
