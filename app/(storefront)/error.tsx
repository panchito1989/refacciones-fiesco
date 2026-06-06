"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center p-12 text-center">
      <h1 className="mb-2 text-2xl font-bold text-slate-800">Algo salió mal</h1>
      <p className="mb-6 text-slate-600">
        Ocurrió un error inesperado. Puedes intentar de nuevo o regresar al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
