import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-blue-700 text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
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
        <nav className="order-2 ml-auto flex items-center gap-5 text-sm sm:order-3">
          <Link href="/carrito" className="flex items-center gap-1 hover:text-amber-300">
            <ShoppingCart className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Carrito</span>
          </Link>
          <Link href="/ingresar" className="flex items-center gap-1 hover:text-amber-300">
            <User className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Mi cuenta</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
