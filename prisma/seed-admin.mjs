import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAIL = "issacfiesco66@gmail.com";
try {
  const rows = await prisma.$queryRaw`select id::text, email from auth.users where email = ${ADMIN_EMAIL} limit 1`;
  if (rows.length === 0) {
    console.error("SEED_ADMIN_FAIL: usuario admin no encontrado en auth.users");
    process.exitCode = 1;
  } else {
    const u = rows[0];
    await prisma.profile.upsert({
      where: { id: u.id },
      update: { role: "ADMIN", email: u.email },
      create: { id: u.id, email: u.email, role: "ADMIN" },
    });
    console.log(`SEED_ADMIN_OK ${u.email} -> ADMIN`);
  }
} catch (e) {
  console.error("SEED_ADMIN_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
