-- CreateEnum
CREATE TYPE "SolicitudEstado" AS ENUM ('SOLICITADO', 'AGENDADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Tecnico" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "ciudades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "especialidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudServicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "productoSku" TEXT,
    "estado" "SolicitudEstado" NOT NULL DEFAULT 'SOLICITADO',
    "tecnicoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudServicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudServicio_estado_idx" ON "SolicitudServicio"("estado");

-- AddForeignKey
ALTER TABLE "SolicitudServicio" ADD CONSTRAINT "SolicitudServicio_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
