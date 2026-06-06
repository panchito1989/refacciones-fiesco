import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-4xl font-bold text-slate-800">404</h1>
      <h2 className="mb-2 text-xl font-semibold text-slate-700">Página no encontrada</h2>
      <p className="mb-6 text-slate-600">
        Lo sentimos, la página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="rounded-md bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
