import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TECNICOS = [
  { nombre: "Juan Pérez", telefono: "5551112233", ciudades: ["Ciudad de México", "Estado de México"], especialidades: ["Refrigeración", "Lavado"] },
  { nombre: "María López", telefono: "3331445566", ciudades: ["Guadalajara"], especialidades: ["Cocción", "Climas"] },
  { nombre: "Carlos Ruiz", telefono: "8112778899", ciudades: ["Monterrey"], especialidades: ["Refrigeración", "Climas"] },
];
try {
  for (const t of TECNICOS) {
    const existing = await prisma.tecnico.findFirst({ where: { nombre: t.nombre } });
    if (existing) await prisma.tecnico.update({ where: { id: existing.id }, data: t });
    else await prisma.tecnico.create({ data: t });
  }
  console.log(`SEED_TEC_OK tecnicos=${TECNICOS.length}`);
} catch (e) {
  console.error("SEED_TEC_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
