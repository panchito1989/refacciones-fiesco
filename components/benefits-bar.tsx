import { ShieldCheck, Truck, PackageSearch, Wrench } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Garantía", text: "En piezas nuevas y recuperadas" },
  { icon: Truck, title: "Envío gratis", text: "En compras mayores a $599" },
  { icon: PackageSearch, title: "Te lo conseguimos", text: "Si no lo tenemos, lo buscamos" },
  { icon: Wrench, title: "Servicio técnico", text: "Instalación a domicilio" },
];

export function BenefitsBar() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <it.icon className="h-8 w-8 shrink-0 text-blue-700" aria-hidden />
            <div>
              <p className="font-semibold text-slate-900">{it.title}</p>
              <p className="text-sm text-slate-500">{it.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
