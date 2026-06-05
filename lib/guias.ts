export type Paso = { titulo: string; descripcion: string };
export type Faq = { pregunta: string; respuesta: string };

export function parsePasos(raw: string): Paso[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const idx = l.indexOf("|");
      if (idx >= 0) return { titulo: l.slice(0, idx).trim(), descripcion: l.slice(idx + 1).trim() };
      return { titulo: `Paso ${i + 1}`, descripcion: l };
    });
}

export function parseFaqs(raw: string): Faq[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf("|");
      if (idx < 0) return null;
      return { pregunta: l.slice(0, idx).trim(), respuesta: l.slice(idx + 1).trim() };
    })
    .filter((f): f is Faq => f !== null && f.pregunta.length > 0 && f.respuesta.length > 0);
}

export function pasosToText(pasos: Paso[]): string {
  return pasos.map((p) => `${p.titulo} | ${p.descripcion}`).join("\n");
}

export function faqsToText(faqs: Faq[]): string {
  return faqs.map((f) => `${f.pregunta} | ${f.respuesta}`).join("\n");
}
