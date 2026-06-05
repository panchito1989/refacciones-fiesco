import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const guia = {
  titulo: "Cómo cambiar el termostato de tu refrigerador",
  slug: "como-cambiar-termostato-refrigerador",
  resumen: "Guía paso a paso para reemplazar el termostato de un refrigerador doméstico de forma segura.",
  intro: "Si tu refrigerador no enfría bien o no apaga el compresor, el termostato puede ser el culpable. Cambiarlo es sencillo con la pieza correcta. Sigue estos pasos.",
  pasos: [
    { titulo: "Desconecta el refrigerador", descripcion: "Desenchufa el aparato de la corriente antes de cualquier manipulación." },
    { titulo: "Localiza el termostato", descripcion: "Suele estar dentro del refrigerador, junto a la perilla de temperatura." },
    { titulo: "Retira la perilla y la cubierta", descripcion: "Quita la perilla y los tornillos de la cubierta para acceder al termostato." },
    { titulo: "Desconecta el termostato viejo", descripcion: "Anota la posición de los cables y desconéctalos del termostato dañado." },
    { titulo: "Instala el nuevo termostato", descripcion: "Conecta los cables en la misma posición y fija el nuevo termostato." },
    { titulo: "Prueba el funcionamiento", descripcion: "Coloca la cubierta, enchufa y verifica que enfríe correctamente." },
  ],
  faqs: [
    { pregunta: "¿Cómo sé si el termostato está dañado?", respuesta: "Si el refrigerador no enfría, enfría de más, o el compresor no apaga, suele ser el termostato." },
    { pregunta: "¿Necesito un técnico?", respuesta: "Es un cambio sencillo, pero si no te sientes seguro, en Refacciones Fiesco un técnico lo instala a domicilio." },
  ],
  status: "PUBLICADO",
};
try {
  await prisma.guia.upsert({ where: { slug: guia.slug }, update: guia, create: guia });
  console.log("SEED_GUIAS_OK");
} catch (e) {
  console.error("SEED_GUIAS_FAIL", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
