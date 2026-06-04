import { requireUser } from "@/lib/auth";

export default async function MiCuentaPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <p className="mt-2 text-slate-600">Sesión iniciada como {user.email}.</p>
      <p className="mt-1 text-sm text-slate-500">Pronto verás aquí tus pedidos.</p>
    </div>
  );
}
