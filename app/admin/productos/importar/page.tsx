import Link from "next/link";
import { ImportForm } from "./import-form";

export default function ImportarProductosPage() {
  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Importar productos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Agrega o actualiza cientos de productos a la vez con un archivo CSV.
        </p>
      </div>

      {/* Instructions card */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-800">Instrucciones</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
          <li>
            <strong>Descarga la plantilla</strong> (botón de abajo) y ábrela en Excel o Google
            Sheets.
          </li>
          <li>
            Llena una fila por producto. Las columnas <code className="rounded bg-slate-100 px-1 text-xs">sku</code>,{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">nombre</code> y{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">marca</code> son obligatorias.
          </li>
          <li>
            En la columna <code className="rounded bg-slate-100 px-1 text-xs">equivalencias</code>{" "}
            escribe los números de parte compatibles separados por punto y coma (;). Por ejemplo:{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">WPW10303150;W10303150</code>. Si una
            refacción es compatible con varias marcas, ponla como <em>un solo producto</em> con
            todas las equivalencias en esa celda.
          </li>
          <li>
            En <code className="rounded bg-slate-100 px-1 text-xs">categoria</code> usa uno de estos
            slugs:{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">
              refrigeracion | lavado | coccion | climas | pequenos-electrodomesticos
            </code>
            . Déjala en blanco si no aplica.
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1 text-xs">condicion</code>:{" "}
            <strong>NUEVO</strong> o <strong>RECUPERADO</strong> (por defecto NUEVO).{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">estado</code>:{" "}
            <strong>BORRADOR</strong> o <strong>PUBLICADO</strong> (por defecto BORRADOR).
          </li>
          <li>
            Guarda el archivo como <strong>CSV (delimitado por comas)</strong> y súbelo aquí.
          </li>
          <li>
            Si un SKU ya existe en la tienda, el producto se <strong>actualiza</strong>. Si es
            nuevo, se <strong>crea</strong>.
          </li>
        </ol>

        <a
          href="/plantilla-productos.csv"
          download
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Descargar plantilla CSV
        </a>
      </div>

      {/* Upload form */}
      <ImportForm />

      {/* Back link */}
      <div className="mt-4">
        <Link
          href="/admin/productos"
          className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
