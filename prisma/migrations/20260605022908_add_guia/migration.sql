-- This is an empty migration.

-- Seguridad: RLS en la tabla nueva (bloquea acceso anónimo vía Data API).
ALTER TABLE "Guia" ENABLE ROW LEVEL SECURITY;