import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const CFG: Record<string, { windowMs: number; limit: number }> = {
  lead: { windowMs: 60_000, limit: 5 },
  solicitud: { windowMs: 60_000, limit: 5 },
  checkout: { windowMs: 60_000, limit: 10 },
};

/** Returns true if the request is ALLOWED, false if rate-limited. Never throws. */
export async function rateLimitOk(action: keyof typeof CFG): Promise<boolean> {
  try {
    const { windowMs, limit } = CFG[action];
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
    const key = `${action}:${ip}`;
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "windowStart", "count")
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count"`;
    return (rows[0]?.count ?? 1) <= limit;
  } catch {
    return true; // fail-open: never block legit users if the limiter errors
  }
}
