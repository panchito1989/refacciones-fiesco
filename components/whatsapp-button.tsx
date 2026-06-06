import { MessageCircle } from "lucide-react";
import { WHATSAPP_PRINCIPAL, waLink } from "@/lib/whatsapp";

export function WhatsAppButton() {
  return (
    <a
      href={waLink(WHATSAPP_PRINCIPAL, "Hola, vengo de Refacciones Fiesco. Necesito ayuda con una refacción.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
    </a>
  );
}
