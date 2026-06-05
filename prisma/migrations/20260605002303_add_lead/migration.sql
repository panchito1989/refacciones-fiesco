-- CreateEnum
CREATE TYPE "LeadTipo" AS ENUM ('CONSEGUIR', 'IGUALAR_PRECIO');

-- CreateEnum
CREATE TYPE "LeadEstado" AS ENUM ('NUEVO', 'EN_PROCESO', 'RESUELTO', 'CERRADO');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tipo" "LeadTipo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "detalle" TEXT NOT NULL,
    "productoSku" TEXT,
    "estado" "LeadEstado" NOT NULL DEFAULT 'NUEVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_tipo_idx" ON "Lead"("tipo");
