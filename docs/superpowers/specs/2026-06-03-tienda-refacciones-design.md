# Diseño — Tienda de Refacciones de Electrodomésticos (Refacciones Fiesco)

- **Fecha:** 2026-06-03
- **Estado:** Aprobado para escribir plan de implementación (Fase 0 + Fase 1)
- **Autor:** Issac (dueño) + Claude (brainstorming)

---

## 1. Visión

Tienda en línea de refacciones de electrodomésticos con el **mejor SEO‑GEO del país** como
objetivo #1. "SEO‑GEO" = aparecer bien tanto en buscadores tradicionales (Google) como ser
**citado por motores de IA** (ChatGPT, Perplexity, Gemini, Google AI Overviews).

Filosofía central del negocio: **"Nunca decimos que no."** Si no tenemos la pieza, se consigue;
si el cliente no puede instalarla, un técnico lo hace.

---

## 2. Decisiones clave (cerradas en brainstorming)

| Tema | Decisión |
|------|----------|
| **Plataforma** | Construcción **a la medida (custom)**, no Shopify |
| **Stack** | Next.js (App Router) + Supabase (Postgres/Auth/Storage) + Prisma + Vercel |
| **Punto de partida** | **Desde cero**: no hay catálogo previo; se construye con panel de admin + auto‑alta de SKU sobre la marcha |
| **Modelo de pieza** | **Pieza genérica identificada por número de parte / nombre**; compatibilidad (marca+modelo) es secundaria. Las **equivalencias entre números de parte** son activo SEO/GEO |
| **Pagos** | **Mercado Pago** (tarjeta + OXXO efectivo + SPEI transferencia en una sola integración) |
| **Servicio técnico** | **Red de técnicos aliados por ciudad** (directorio por zona + asignación por ubicación) |
| **Idioma / dispositivo** | Español (es‑MX), **mobile‑first** |
| **Inventario** | Un solo almacén al inicio (un stock por SKU) |
| **Roles** | Dueño + empleados (admin); cliente; cliente preferente |

---

## 3. Roadmap por fases (decomposición)

El proyecto son ~13 subsistemas; **no se construye de golpe**. Se diseña a fondo solo Fase 0 y 1.
El modelo de datos deja "huecos" para enchufar fases siguientes sin rehacer.

| Fase | Contenido |
|------|-----------|
| **0 · Cimientos** | Stack, modelo de datos, panel de admin base, carga/auto‑alta de catálogo, base técnica de SEO/GEO |
| **1 · Tienda MVP** | Catálogo + buscador + fichas SEO/GEO + carrito + checkout (Mercado Pago) + registro/login + mis pedidos + reglas de envío + nuevo/recuperado + garantía + **sección Servicio Técnico (solicitud)** |
| **2 · Confianza** | "Te lo consigo" automatizado + igualar precio + garantía/RMA + WhatsApp + **agendado/asignación de técnicos** |
| **3 · B2B** | Catálogo PDF automático para revendedores + cliente preferente (descuentos, capacitaciones, herramienta) + facturación CFDI |
| **4 · IA / diferenciación** | Búsqueda por foto + buscador de compatibilidad con IA + motor de contenido GEO (guías de reparación) |
| **5 · Moonshot (beta)** | Entregas express con drones |

---

## 4. Arquitectura técnica

- **Next.js en Vercel** — renderizado en servidor (SSR/SSG). Es la base de la ventaja SEO/GEO:
  HTML completo en el servidor, metadata dinámica por página, datos estructurados.
- **Supabase**
  - **Postgres** — base de datos principal.
  - **Auth** — registro / login de clientes y admin.
  - **Storage** — fotos de productos y técnicos.
- **Prisma** — modelado de la base de datos y migraciones versionadas.
- **Mercado Pago** — checkout (tarjeta, OXXO, SPEI).
- **Buscador** — **Postgres full‑text search nativo** para v1 (cero costo extra, suficiente para
  número de parte / nombre / marca). Arquitectura abierta a migrar a Meilisearch/Typesense cuando
  el catálogo crezca.

### Unidades / módulos (cada uno con un propósito claro)
1. **Catálogo** — productos, categorías, equivalencias, búsqueda.
2. **Inventario** — stock por SKU, estados publicado/borrador, auto‑alta.
3. **Cuentas** — registro, login, roles, perfil de cliente.
4. **Carrito + Checkout** — carrito, cálculo de envío, pago Mercado Pago, creación de pedido.
5. **Pedidos** — historial del cliente ("mis pedidos") y gestión en admin.
6. **Servicio Técnico** — directorio de técnicos por zona + solicitudes de instalación.
7. **Admin** — panel para catálogo, inventario, pedidos, solicitudes.
8. **SEO/GEO** — metadata, schema.org, sitemap, robots, llms.txt, URLs semánticas.

---

## 5. Modelo de datos (entidades principales)

> En lenguaje de negocio. La forma exacta (Prisma schema) se define en el plan de implementación.

- **Producto / Refacción**
  - SKU, número de parte, nombre, descripción, marca, categoría
  - **condición** (nuevo / recuperado), garantía
  - precio, stock, fotos
  - **equivalencias** (otros números de parte que sirven igual)
  - estado (publicado / borrador)
- **Categoría** — taxonomía de tipos (refrigeración, lavado, cocción, etc.); jerárquica.
- **Compatibilidad** *(secundaria)* — relación ligera marca+modelo de aparato ↔ pieza.
- **Cliente** — datos, **rol** (cliente / preferente / admin), direcciones, historial.
- **Pedido** — items, subtotal, envío, total, estado de pago, estado de envío, dirección.
- **Solicitud "Te lo consigo"** *(hueco listo; flujo completo en Fase 2)* — pieza buscada,
  contacto, estado (cotizando / conseguido / avísame‑cuando‑llegue).
- **Técnico** — nombre, contacto, **zonas de cobertura** (ciudades / códigos postales),
  especialidades, estado (activo), rating.
- **Solicitud de Servicio Técnico** — pieza/pedido relacionado, cliente, dirección, fecha deseada,
  estado (solicitado / agendado / en proceso / completado), técnico asignado, costo.

---

## 6. Fase 0 — Cimientos (detalle)

- Proyecto Next.js + Vercel + Supabase + Prisma inicializado.
- Esquema de base de datos para las entidades de arriba (con los "huecos" de fases futuras).
- **Panel de admin base**: alta/edición de productos, control de inventario, gestión de categorías.
- **Auto‑alta de SKU**: el catálogo crece solo — un producto se puede crear rápido desde el panel,
  y la arquitectura permite generar fichas mínimas cuando se busca/pide una pieza que aún no existe.
- Cimientos técnicos de SEO/GEO (ver sección 8) instalados desde el inicio.

---

## 7. Fase 1 — Tienda MVP (detalle)

Tienda lanzable. Incluye:

- **Catálogo** navegable por categoría y marca.
- **Fichas de producto** optimizadas para buscadores e IA (sección 8).
- **Buscador** por número de parte / nombre / marca, con autocompletado.
- **Carrito + Checkout** con Mercado Pago (tarjeta / OXXO / SPEI).
- **Registro / login / "mis pedidos".**
- **Reglas de envío:** gratis en compras > $599 MXN; por debajo, **tarifa fija por zona** al inicio
  (luego se conecta paquetería real con cotización dinámica).
- **Etiqueta visible: nuevo vs recuperado + garantía** (recordar: sin garantía en piezas eléctricas).
- **Sección "Servicio Técnico":** landing informativa + **formulario de solicitud de instalación**
  + botón *"¿No puedes instalarla? Que un técnico lo haga"* en la ficha de producto y en el checkout.
  (La asignación/agendado automático de técnicos es Fase 2; aquí se captura la solicitud y los datos
  del técnico.)

---

## 8. Capa SEO/GEO (diferenciador #1, integrada desde el día 1)

- Renderizado en servidor + **metadata única** por producto y categoría.
- **Datos estructurados schema.org**: Product, Offer, AggregateRating, FAQPage, BreadcrumbList.
- **`llms.txt` + sitemap.xml + robots.txt** afinados para crawlers de IA
  (GPTBot, ClaudeBot, PerplexityBot, Google‑Extended) además de los buscadores tradicionales.
- **URLs limpias y semánticas:** `/refaccion/[marca]/[numero-parte]-[nombre]`.
- **Páginas de "equivalencias"** y de **categoría** como imanes de tráfico desde el inicio
  ("equivalente del [número de parte]", "[tipo de pieza] para [marca]").
- Base lista para el **motor de contenido (guías de reparación)** de Fase 4.

---

## 9. Reglas de negocio a definir (focos amarillos)

Compromisos que tocan margen u operación; necesitan candados antes de activarse:

1. **Cobro de comisión de tarjeta al cliente:** en México, las reglas de Visa/Mastercard y Profeco
   normalmente **prohíben** cobrar extra por pagar con tarjeta. Alternativa legal y común:
   **descuento por efectivo/transferencia**. → A revisar al implementar pagos.
2. **Igualar precio:** definir condiciones (competidor válido, mismo producto/condición, vigencia,
   prueba requerida) para que no se abuse.
3. **"Te lo consigo":** definir tiempos/expectativas y proceso de cotización.
4. **Garantías:** clara distinción nuevo vs recuperado; **excepción explícita: piezas eléctricas sin
   garantía**. Flujo de RMA en Fase 2.
5. **Servicio técnico:** responsabilidad/garantía de la instalación, y cómo se cobra (fijo, por tipo
   de pieza, o cotizado).

---

## 10. Supuestos

- Idioma es‑MX, mobile‑first.
- Un solo almacén/inventario al inicio.
- Roles: dueño + empleados (admin), cliente, cliente preferente.
- Moneda MXN.

---

## 11. Fuera de alcance de Fase 1

"Te lo consigo" automatizado · igualar precio (flujo) · WhatsApp · catálogo PDF · cliente preferente
(lealtad/capacitaciones) · búsqueda por foto/IA · compatibilidad con IA · facturación CFDI ·
agendado/asignación automática de técnicos · entregas con drones.
(Todo contemplado en el roadmap; el modelo de datos ya deja espacio.)

---

## 12. Criterios de éxito (Fase 1)

- Un cliente puede **buscar una pieza, agregarla al carrito y pagar** con Mercado Pago de principio a fin.
- El dueño puede **dar de alta y editar productos** y **ver pedidos** desde el panel.
- Cada ficha de producto sale **renderizada en servidor con datos estructurados** (verificable con
  herramientas de prueba de schema y con sitemap/robots/llms.txt presentes).
- Un cliente puede **solicitar servicio técnico** desde la ficha o la sección dedicada.
- Reglas de envío (gratis > $599) aplicadas correctamente en el carrito.
