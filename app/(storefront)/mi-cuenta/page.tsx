import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function MiCuentaPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <p className="mt-2 text-slate-600">Sesión iniciada como {user.email}.</p>
      <Link href="/mis-pedidos" className="mt-4 inline-block rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">
        Ver mis pedidos
      </Link>
    </div>
  );
}
