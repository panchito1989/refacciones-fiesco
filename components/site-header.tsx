import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-blue-700 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 p-4">
        <Link href="/" className="text-lg font-bold whitespace-nowrap">
          Refacciones Fiesco
        </Link>
        <form action="/buscar" method="get" className="order-3 flex w-full gap-2 sm:order-2 sm:w-auto sm:flex-1">
          <input
            type="search"
            name="q"
            placeholder="Busca por número de parte, nombre o marca…"
            className="w-full rounded-md border-0 px-3 py-2 text-slate-900 placeholder:text-slate-400"
            aria-label="Buscar refacciones"
          />
          <button type="submit" className="rounded-md bg-amber-500 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-600">
            Buscar
          </button>
        </form>
        <nav className="order-2 ml-auto flex items-center gap-4 text-sm sm:order-3">
          <Link href="/carrito" className="hover:underline">Carrito</Link>
          <Link href="/ingresar" className="hover:underline">Mi cuenta</Link>
        </nav>
      </div>
    </header>
  );
}
