import Link from "next/link";
import { Refrigerator, WashingMachine, Flame, Wind, Zap, Package, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  refrigeracion: Refrigerator,
  lavado: WashingMachine,
  coccion: Flame,
  climas: Wind,
  "pequenos-electrodomesticos": Zap,
};

type Cat = { id: string; name: string; slug: string };

export function CategoryGrid({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => {
        const Icon = ICONS[c.slug] ?? Package;
        return (
          <Link
            key={c.id}
            href={`/categoria/${c.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-center transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
              <Icon className="h-7 w-7" aria-hidden />
            </span>
            <span className="text-sm font-medium text-slate-800">{c.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
