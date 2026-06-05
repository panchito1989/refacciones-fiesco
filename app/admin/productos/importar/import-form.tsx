"use client";

import { useActionState } from "react";
import { importarProductos, type ImportResult } from "../import-actions";

const initialState: ImportResult | null = null;

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importarProductos, initialState);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="archivo"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Archivo CSV
          </label>
          <input
            id="archivo"
            type="file"
            name="archivo"
            accept=".csv"
            required
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Importando…" : "Importar productos"}
        </button>
      </form>

      {/* Results */}
      {state !== null && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">
              ✅ {state.creados} creados, {state.actualizados} actualizados
              {" "}— {state.total} filas procesadas en total
            </p>
            {state.truncated && (
              <p className="mt-1 text-xs text-green-700">
                El archivo tenía más de 3 000 filas. Solo se procesaron las primeras 3 000.
              </p>
            )}
          </div>

          {state.errores.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-800">
                {state.errores.length} aviso(s) / error(es):
              </p>
              <ul className="list-inside list-disc space-y-1 text-xs text-amber-700">
                {state.errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
