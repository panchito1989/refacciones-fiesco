export function formatMXN(cents: number): string {
  const pesos = cents / 100;
  return `$${pesos.toFixed(2)}`;
}
