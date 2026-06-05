-- Seguridad: habilitar RLS en la tabla nueva Lead (igual que las demás).
-- Bloquea acceso anónimo vía la Data API de Supabase. Prisma (rol postgres) la ignora.
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
