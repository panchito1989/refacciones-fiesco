import type { Guia } from "@prisma/client";
import { pasosToText, faqsToText, type Paso, type Faq } from "@/lib/guias";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function GuiaForm({
  action,
  guia,
  submitLabel = "Guardar",
}: {
  action: (formData: FormData) => void;
  guia?: Guia | null;
  submitLabel?: string;
}) {
  const pasosTxt = guia ? pasosToText((guia.pasos as unknown as Paso[]) ?? []) : "";
  const faqsTxt = guia ? faqsToText((guia.faqs as unknown as Faq[]) ?? []) : "";
  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={action} className="flex flex-col gap-4">
        <div>
          <label htmlFor="titulo" className="mb-1.5 block text-sm font-medium text-slate-700">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            className={inputCls}
            required
            defaultValue={guia?.titulo ?? ""}
          />
        </div>

        <div>
          <label htmlFor="resumen" className="mb-1.5 block text-sm font-medium text-slate-700">
            Resumen
          </label>
          <input
            id="resumen"
            name="resumen"
            placeholder="1 línea"
            className={inputCls}
            required
            defaultValue={guia?.resumen ?? ""}
          />
        </div>

        <div>
          <label htmlFor="intro" className="mb-1.5 block text-sm font-medium text-slate-700">
            Introducción
          </label>
          <textarea
            id="intro"
            name="intro"
            className={inputCls}
            rows={3}
            required
            defaultValue={guia?.intro ?? ""}
          />
        </div>

        <div>
          <label htmlFor="pasos" className="mb-1.5 block text-sm font-medium text-slate-700">
            Pasos <span className="font-normal text-slate-400">(uno por línea: Título | Descripción)</span>
          </label>
          <textarea
            id="pasos"
            name="pasos"
            className={inputCls}
            rows={6}
            defaultValue={pasosTxt}
          />
        </div>

        <div>
          <label htmlFor="faqs" className="mb-1.5 block text-sm font-medium text-slate-700">
            FAQs <span className="font-normal text-slate-400">(una por línea: Pregunta | Respuesta)</span>
          </label>
          <textarea
            id="faqs"
            name="faqs"
            className={inputCls}
            rows={4}
            defaultValue={faqsTxt}
          />
        </div>

        <div>
          <label htmlFor="guia-status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            id="guia-status"
            name="status"
            className={inputCls}
            defaultValue={guia?.status ?? "BORRADOR"}
          >
            <option value="BORRADOR">Borrador</option>
            <option value="PUBLICADO">Publicado</option>
          </select>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
