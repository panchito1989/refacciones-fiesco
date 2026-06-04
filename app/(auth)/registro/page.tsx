"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="rounded border border-slate-300 p-2" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="rounded border border-slate-300 p-2" type="password" placeholder="Contraseña (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-md bg-blue-700 p-2 text-white hover:bg-blue-800">Registrarme</button>
      </form>
      <p className="mt-3 text-sm text-slate-600">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="text-blue-700 underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
