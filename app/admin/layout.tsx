import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import {
  Package,
  ShoppingCart,
  Wrench,
  FileText,
  BookOpen,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { logoutAction } from "./logout-action";

const NAV_ITEMS = [
  { href: "/admin/productos", label: "Productos", Icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", Icon: ShoppingCart },
  { href: "/admin/solicitudes", label: "Solicitudes", Icon: Wrench },
  { href: "/admin/cotizaciones", label: "Cotizaciones", Icon: FileText },
  { href: "/admin/guias", label: "Guías", Icon: BookOpen },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white">
        {/* Brand block */}
        <div className="flex items-center gap-3 border-b border-slate-200 p-5">
          <div className="flex items-center justify-center rounded-lg bg-blue-700 p-2 text-white">
            <Wrench size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">Refacciones Fiesco</span>
            <span className="text-xs text-slate-500">Panel de administración</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm " +
                  (active
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-slate-200 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <ExternalLink size={16} />
            Ver tienda
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Right column: mobile top bar + main content ─────────────── */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Mobile top bar (hidden on md+) */}
        <header className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-blue-700 p-1.5 text-white">
              <Wrench size={14} />
            </div>
            <span className="text-sm font-bold text-slate-900">Refacciones Fiesco</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs " +
                    (active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                >
                  <Icon size={13} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-6xl p-6 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
