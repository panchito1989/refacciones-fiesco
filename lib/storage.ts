import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "productos";

/** Sube el archivo del campo "image" si viene; si no, devuelve las fotos existentes. */
export async function resolverFotos(formData: FormData, existentes: string[]): Promise<string[]> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return existentes;

  const supabase = createAdminClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${randomUUID()}.${ext || "jpg"}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error("No se pudo subir la imagen: " + error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return [data.publicUrl];
}
