import Link from "next/link";
import { WHATSAPP_NUMEROS, waLink, waDisplay } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-bold text-white">Refacciones Fiesco</p>
          <p className="mt-2 text-sm">Refacciones de electrodomésticos, nuevas y recuperadas con garantía.</p>
          <p className="mt-2 text-sm font-medium text-amber-400">Si no la tenemos, te la conseguimos.</p>
          <p className="mt-3 text-sm">
            WhatsApp:{" "}
            {WHATSAPP_NUMEROS.map((n, i) => (
              <span key={n}>
                {i > 0 && " · "}
                <a href={waLink(n)} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300">
                  {waDisplay(n)}
                </a>
              </span>
            ))}
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Categorías</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/categoria/refrigeracion" className="hover:text-white">Refrigeración</Link></li>
            <li><Link href="/categoria/lavado" className="hover:text-white">Lavado</Link></li>
            <li><Link href="/categoria/coccion" className="hover:text-white">Cocción</Link></li>
            <li><Link href="/categoria/climas" className="hover:text-white">Climas</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Ayuda</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link href="/servicio-tecnico" className="hover:text-white">Servicio técnico a domicilio</Link></li>
            <li>Envíos y entregas</li>
            <li>Garantías</li>
            <li><Link href="/igualar-precio" className="hover:text-white">Igualamos precios</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Compra segura</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>Tarjeta, OXXO y transferencia</li>
            <li>Envío gratis en compras +$599</li>
            <li>Envíos a todo México</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © 2026 Refacciones Fiesco. Todos los derechos reservados.
      </div>
    </footer>
  );
}
