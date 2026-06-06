import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "productos";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MAX_SIZE = 6 * 1024 * 1024;

/** Sube el archivo del campo "image" si viene; si no, devuelve las fotos existentes. */
export async function resolverFotos(formData: FormData, existentes: string[]): Promise<string[]> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return existentes;

  // Validate size
  if (file.size > MAX_SIZE) throw new Error("La imagen supera el límite de 6 MB.");

  // Validate type and extension
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) {
    throw new Error("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
  }

  try {
    const supabase = createAdminClient();
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return [data.publicUrl];
  } catch (e) {
    console.error("[storage] fallo al subir imagen:", e);
    return existentes;
  }
}
