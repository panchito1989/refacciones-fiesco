import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CATS = [
  { name: "Refrigeración", slug: "refrigeracion" },
  { name: "Lavado", slug: "lavado" },
  { name: "Cocción", slug: "coccion" },
  { name: "Climas", slug: "climas" },
  { name: "Pequeños electrodomésticos", slug: "pequenos-electrodomesticos" },
];
try {
  for (const c of CATS) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
  }
  const refri = await prisma.category.findUnique({ where: { slug: "refrigeracion" } });
  await prisma.product.updateMany({
    where: { sku: "TEST-001" },
    data: { categoryId: refri.id, equivalences: ["WR55X10942", "AP6010191", "PS11743421"] },
  });
  console.log(`SEED_CAT_OK categorias=${CATS.length}`);
} catch (e) {
  console.error("SEED_CAT_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
