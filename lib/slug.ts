export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita acentos (marcas diacriticas)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // todo lo no alfanumérico -> guion
    .replace(/^-+|-+$/g, ""); // sin guiones al inicio/fin
}

export function productPath(p: {
  brandSlug: string;
  partNumber: string;
  slug: string;
}): string {
  return `/refaccion/${p.brandSlug}/${slugify(p.partNumber)}-${p.slug}`;
}
