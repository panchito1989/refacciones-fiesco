"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="es-MX">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Algo salió mal</h1>
        <p className="mb-6 text-slate-600">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
        >
          Volver a intentar
        </button>
      </body>
    </html>
  );
}
