import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cron diario (vercel.json) que mantiene la BD de Supabase despierta
// para que NO se pause por inactividad en el plan gratis.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("db error", { status: 500 });
  }
}