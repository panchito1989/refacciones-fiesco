import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-4 p-4">
        <Link href="/" className="text-lg font-bold whitespace-nowrap">
          Refacciones Fiesco
        </Link>
        <form action="/buscar" method="get" className="flex flex-1 gap-2">
          <input
            type="search"
            name="q"
            placeholder="Busca por número de parte, nombre o marca…"
            className="w-full rounded border px-3 py-2"
            aria-label="Buscar refacciones"
          />
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Buscar
          </button>
        </form>
      </div>
    </header>
  );
}
