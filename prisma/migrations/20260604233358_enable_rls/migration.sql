-- Seguridad: habilitar Row Level Security (RLS) en TODAS las tablas.
-- Motivo: Supabase expone el esquema "public" vía su Data API (PostgREST) usando
-- la llave anónima (pública). Sin RLS, cualquiera puede leer/escribir las tablas.
-- La app accede por Prisma con el rol "postgres" (dueño de las tablas), que IGNORA
-- RLS (owner bypass), así que NO se ve afectada. Sin políticas => deny por defecto
-- para anon/authenticated. Esto cierra la fuga de datos y la escalada de privilegios.

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tecnico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SolicitudServicio" ENABLE ROW LEVEL SECURITY;
