import type { Guia } from "@prisma/client";
import { pasosToText, faqsToText, type Paso, type Faq } from "@/lib/guias";

export function GuiaForm({
  action,
  guia,
  submitLabel = "Guardar",
}: {
  action: (formData: FormData) => void;
  guia?: Guia | null;
  submitLabel?: string;
}) {
  const input = "rounded border border-slate-300 p-2";
  const pasosTxt = guia ? pasosToText((guia.pasos as unknown as Paso[]) ?? []) : "";
  const faqsTxt = guia ? faqsToText((guia.faqs as unknown as Faq[]) ?? []) : "";
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3">
      <input name="titulo" placeholder="Título" className={input} required defaultValue={guia?.titulo ?? ""} />
      <input name="resumen" placeholder="Resumen (1 línea)" className={input} required defaultValue={guia?.resumen ?? ""} />
      <textarea name="intro" placeholder="Introducción" className={input} rows={3} required defaultValue={guia?.intro ?? ""} />
      <label className="text-sm text-slate-500">Pasos (uno por línea, formato: Título | Descripción)</label>
      <textarea name="pasos" className={input} rows={6} defaultValue={pasosTxt} />
      <label className="text-sm text-slate-500">FAQs (una por línea, formato: Pregunta | Respuesta)</label>
      <textarea name="faqs" className={input} rows={4} defaultValue={faqsTxt} />
      <select name="status" className={input} defaultValue={guia?.status ?? "BORRADOR"}>
        <option value="BORRADOR">Borrador</option>
        <option value="PUBLICADO">Publicado</option>
      </select>
      <button type="submit" className="rounded bg-black p-2 text-white">{submitLabel}</button>
    </form>
  );
}
