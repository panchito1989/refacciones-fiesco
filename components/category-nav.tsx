import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function CategoryNav() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  if (categories.length === 0) return null;
  return (
    <nav className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categoria/${c.slug}`}
          className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
