import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GuiaForm } from "@/components/admin/guia-form";
import { actualizarGuia } from "../../actions";

export default async function EditarGuiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guia = await prisma.guia.findUnique({ where: { id } });
  if (!guia) notFound();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Editar guía</h1>
      <GuiaForm action={actualizarGuia.bind(null, guia.id)} guia={guia} submitLabel="Guardar cambios" />
    </div>
  );
}
