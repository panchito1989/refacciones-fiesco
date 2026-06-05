import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";

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
    <div className="mx-auto max-w-5xl p-6">
      <nav className="mb-6 flex gap-4 border-b pb-3 text-sm font-medium">
        <Link href="/admin/productos" className="text-blue-700 hover:underline">Productos</Link>
        <Link href="/admin/pedidos" className="text-blue-700 hover:underline">Pedidos</Link>
        <Link href="/admin/solicitudes" className="text-blue-700 hover:underline">Solicitudes</Link>
      </nav>
      {children}
    </div>
  );
}
