import { GuiaForm } from "@/components/admin/guia-form";
import { crearGuia } from "../actions";

export default function NuevaGuiaPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Nueva guía</h1>
      <GuiaForm action={crearGuia} submitLabel="Crear guía" />
    </div>
  );
}
