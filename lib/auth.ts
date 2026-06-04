import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  return prisma.profile.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? "", role: "CUSTOMER" },
  });
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/ingresar");
  return user;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "ADMIN") redirect("/");
  return profile;
}
