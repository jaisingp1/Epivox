---
name: epiroc-doc-publisher
description: Publica y transforma documentos Markdown (.md) en formatos ejecutivos y ofimáticos DOCX (Word) y PDF, aplicando estrictamente la identidad visual oficial de Epiroc (paleta de colores, tipografía Raleway, portada institucional, ficha de metadatos de autoría y revisión, encabezados/pies de página corporativos y tablas estilizadas). Se activa al solicitar exportar, convertir o maquetar manuales de usuario, especificaciones técnicas, planes de QA o informes a Word o PDF.
---

# Epiroc Doc Publisher (Maquetador y Publicador Corporativo)

Esta skill es responsable de transformar cualquier documento técnico, manual de usuario o reporte en formato Markdown (`.md`) en un entregable profesional de grado ejecutivo en **DOCX (Microsoft Word)** o **PDF**, aplicando con máxima fidelidad la **identidad visual oficial de Epiroc**.

---

## When to use this skill

- Convertir manuales de usuario generados por `epiroc-documenter` a formato Word (`.docx`) o PDF para distribución a clientes u operaciones.
- Exportar especificaciones técnicas, planes de pruebas QA (`qa_test_plan.md`) o reportes de arquitectura a formatos imprimibles o compartibles.
- Aplicar la paleta de colores oficial Epiroc, tipografía Raleway, portada corporativa y control de versiones a un documento existente.
- **Trigger keywords**: `exportar docx`, `exportar pdf`, `convertir a word`, `convertir a pdf`, `manual en word`, `formato corporativo`, `plantilla epiroc`, `publicar documento`, `doc publisher`, `generar pdf`, `generar docx`.

---

## Dependencias & Coordinación en el Ecosistema

- **epiroc-documenter**: Es el principal emisor de contenido `.md` (manuales de usuario y especificaciones técnicas).
- **epiroc-ui**: Fuente oficial de tokens de diseño, colores institucionales y directrices tipográficas.
- **epiroc-qa**: Permite exportar planes de aseguramiento de calidad y actas de entrega en formato ejecutivo.
- **epiroc-i18n**: Coordina la terminología multilingüe oficial de Logistech (español, inglés y portugués) para garantizar traducciones precisas y consistentes.
- **epiroc-chrome-devtools**: Puede utilizarse para renderizar el HTML corporativo y generar el PDF final mediante impresión headless con 100% de fidelidad CSS.

---

## 1. Paso Previo Obligatorio: Triage de Idioma (LANGUAGE GATE)

> [!IMPORTANT]
> **PREGUNTA OBLIGATORIA ANTES DE INICIAR LA PUBLICACIÓN**
> Antes de transformar o exportar cualquier documento, la skill **DEBE preguntar obligatoriamente al usuario** en qué idioma requiere el documento final si este no fue declarado explícitamente en el prompt.

Debe formular la siguiente pregunta o activar `ask_question`:

> **"¿En qué idioma debe emitirse el documento final (Word / PDF)?"**
> 1. 🇪🇸 **Español (ES)**: Mantiene o traduce el contenido en español, con membretes y ficha técnica en español.
> 2. 🇬🇧 **Inglés (EN)**: Traduce el contenido íntegro y los elementos estructurales a inglés corporativo (*"Prepared By"*, *"Reviewed By"*, *"Page X of Y"*).
> 3. 🇧🇷 **Portugués (PT)**: Traduce el contenido íntegro y los elementos estructurales a portugués corporativo (*"Elaborado Por"*, *"Data de Emissão"*, *"Página X de Y"*).

### Reglas de Localización por Idioma:
1. **Traducción Integral**: Si el archivo `.md` fuente está en español y el usuario solicita inglés o portugués, la skill traduce el contenido completo manteniendo estrictamente los bloques de código, tablas, fórmulas matemáticas y diagramas.
2. **Terminología Oficial**: Debe emplear los términos estándar de Logistech según `epiroc-i18n` (ej: *Tickets*, *Redistributions/Redistribuições*, *Workspaces*, *SLA*, *Approvals/Aprovações*).
3. **Estructura de Portada y Metadatos**: Las etiquetas fijas de la portada, tabla de revisiones, encabezados y pies de página se adaptan automáticamente al idioma elegido:

| Etiqueta Estructural | Español (ES) | Inglés (EN) | Portugués (PT) |
|---|---|---|---|
| Autor / Elaborador | Elaborado Por | Prepared By | Elaborado Por |
| Revisor / Aprobador | Revisado Por | Reviewed By | Revisado Por |
| Versión | Versión | Version | Versão |
| Fecha | Fecha de Emisión | Issue Date | Data de Emissão |
| Clasificación | Clasificación | Classification | Classificação |
| Historial | Control de Revisiones y Cambios | Revision History & Change Control | Histórico de Revisões e Alterações |
| Paginación | Página X de Y | Page X of Y | Página X de Y |
| Pie Confidencial | Documento de Uso Interno Confidencial | Confidential - Internal Use Only | Documento de Uso Interno Confidencial |

---

## 2. Estándar de Identidad Visual Oficial Epiroc

Cualquier documento exportado por esta skill **DEBE** respetar taxativamente la paleta oficial y las directrices corporativas:

### 1.1. Paleta de Colores Epiroc
| Variable / Token | Nombre | Valor RGB / HEX | Uso en Documentación |
|---|---|---|---|
| `--color-epiroc-yellow` | Amarillo Epiroc | `rgb(255, 199, 44)` / `#FFC72C` | Acentos, barras decorativas en títulos, viñetas clave, bordes de avisos importantes. |
| `--color-epiroc-dark-blue` | Azul Oscuro | `rgb(0, 30, 50)` / `#001E32` | Título principal de portada, Títulos Heading 1, pie de página corporativo. |
| `--color-epiroc-grey` | Gris Principal | `rgb(66, 85, 99)` / `#425563` | Subtítulos H2/H3, encabezados de tablas, texto destacado institucional. |
| `--color-epiroc-dark-grey` | Gris Oscuro | `rgb(119, 116, 110)` / `#77746E` | Texto principal de lectura (evita el negro puro para mejorar legibilidad). |
| `--color-epiroc-medium-grey` | Gris Medio | `rgb(180, 180, 170)` / `#B4B4AA` | Líneas divisorias, bordes sutiles de tabla, separadores. |
| `--color-epiroc-light-grey` | Gris Claro | `rgb(236, 235, 228)` / `#ECEBE4` | Fondos de filas alternadas en tablas, fondos de cajas de código o notas. |
| `--color-epiroc-green` | Verde Epiroc | `rgb(76, 140, 43)` / `#4C8C2B` | Cajas de notas de éxito, estados "Aprobado", pasos completados. |
| `--color-epiroc-red` | Rojo Epiroc | `rgb(183, 49, 44)` / `#B7312C` | Cajas de advertencia o peligro, estados "Rechazado", llamadas de atención críticas. |

### 2.2. Tipografía Corporativa
- **Fuente Principal**: **Raleway** (pesos: Regular 400, Medium 500, Semi-Bold 600, Bold 700).
- **Fallback para Entornos Ofimáticos sin Raleway instalada**: Arial o Calibri.
- **Código y Bloques Técnicos**: JetBrains Mono, Fira Code o Consolas.

### 2.3. Logotipos Oficiales de la Empresa (`client/public/`)
Para documentos oficiales, portadas, membretes y exportaciones HTML/PDF, la skill **debe utilizar exclusivamente** los logotipos vectoriales oficiales ubicados en `client/public/`:

1. 🟡 **Logo Epiroc Amarillo** (`client/public/1. 1 Logo Epiroc amarillo.svg`):
   - **Color de relleno**: `#FFC72C` (Amarillo Epiroc oficial).
   - **Uso obligatorio**: Fondos oscuros (ej. bloques en `Epiroc Dark Blue` `#001E32`, franjas nocturnas o portadas oscuras).
2. ⚪ **Logo Epiroc Gris** (`client/public/1.2 Logo Epiroc Gris.svg`):
   - **Color de relleno**: `rgb(66, 85, 99)` / `#425563` (Gris Epiroc oficial).
   - **Uso obligatorio**: Fondos claros, cabeceras estándar de portada, membretes superiores de páginas interiores y documentos impresos.

> [!TIP]
> **Incrustación Vectorial Autónoma**: Al generar HTML para PDF o Word, la skill debe incrustar directamente el contenido vectorial del `<svg>` (o Data URI), asegurando que el documento final sea 100% autónomo y los logos se rendericen con nitidez matemática sin depender de rutas rotas o conexión a red.

---

## 3. Requisito de Entrada: Frontmatter YAML

Para que el publicador pueda construir automáticamente la portada, los encabezados, la ficha técnica y la tabla de revisiones, el archivo Markdown **debe** incluir al inicio un bloque de metadatos estandarizado:

```yaml
---
title: "Manual de Usuario: Gestión de Tickets"
subtitle: "Guía Operativa Paso a Paso para Creación, Despacho y Aprobación"
system: "Logistech"
module: "Tickets"
workspace_id: 1
doc_type: "manual_usuario" # opciones: manual_usuario | especificacion_tecnica | plan_qa | reporte
version: "1.0"
author: "Jaising Pasten"
author_email: "jaising.pasten@epiroc.com"
reviewer: "Eduardo Acuña"
reviewer_email: "eduardo.acuna@epiroc.com"
date: "2026-10-02"
classification: "Uso Interno Epiroc"
history:
  - version: "1.0"
    date: "2026-10-02"
    author: "Jaising Pasten"
    changes: "Emisión inicial tras auditoría de código y UI"
---
```

---

## 4. Estructura del Documento Publicado

Todo documento DOCX o PDF generado consta de 4 secciones estructuradas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PORTADA CORPORATIVA (Página 1)                                            │
│    - Barra superior decorativa en Amarillo Epiroc (#FFC72C)                  │
│    - Nombre del Sistema ("Logistech — Enterprise Logistics Suite")           │
│    - Título del Documento (H1 en Azul Oscuro #001E32)                       │
│    - Subtítulo explicativo                                                  │
│    - Ficha de Metadatos de Control (Autor, Revisor, Fecha, Versión)          │
│    - Franja institucional inferior con logo y clasificación de seguridad    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. CONTROL DE VERSIONES Y TABLA DE CONTENIDO (Página 2)                     │
│    - Tabla de Control de Revisiones (Versión, Fecha, Autor, Resumen)        │
│    - Índice / Tabla de Contenido interactiva                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. CUERPO DEL DOCUMENTO (Páginas 3 en adelante)                             │
│    - Encabezado: Logo Epiroc a la derecha, título del documento a la izq.   │
│    - Pie de página: Clasificación de confidencialidad + "Página X de Y"     │
│    - Títulos estilizados con acentos Epiroc                                  │
│    - Tablas con formato corporativo (cabecera gris #425563, texto blanco)    │
│    - Cajas de aviso ("Alerts") estilizadas con bordes de color temático      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. CONTRAPORTADA DE CIERRE (Última Página)                                  │
│    - Datos de contacto y soporte del sistema                                │
│    - Sello institucional Epiroc                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Pipeline de Publicación a PDF (Máxima Fidelidad Web)

Para generar archivos PDF con la misma calidad visual que la aplicación web:

1. **Compilación de Markdown a HTML Corporativo**:
   - Se utiliza el script `resources/epiroc_doc_theme.css` que inyecta la fuente Raleway, los colores oficiales de Epiroc, el layout de portada y las reglas de salto de página (`@page`).
2. **Generación del PDF**:
   - Se procesa el HTML mediante headless print en Chrome (usando Chrome DevTools MCP o script con Puppeteer):
     ```bash
     # Genera el PDF conservando márgenes, paginación y cabeceras
     npx tsx .agents/skills/epiroc-doc-publisher/scripts/export_doc.ts <archivo.md> --format=pdf
     ```

---

## 6. Pipeline de Publicación a DOCX (Microsoft Word)

Para generar documentos Word totalmente editables:

1. **Mapeo de Estilos OpenXML / DOCX**:
   - El script genera un archivo `.docx` aplicando las propiedades XML de estilo nativo de Word:
     * Color de fuente para H1: `001E32` (Azul Oscuro).
     * Color de fuente para H2: `425563` (Gris Epiroc).
     * Borde inferior en H1: 18pt color `FFC72C` (Amarillo Epiroc).
     * Tabla: Fondo de encabezado `425563`, texto `FFFFFF`, bordes `B4B4AA`.
2. **Construcción de Portada y Encabezados Nativos**:
   - Primera página con salto de sección desvinculada (`differentFirstPageHeaderFooter = true`).
   - Encabezado con logo y título en páginas subsiguientes.
   - Pie de página con campos dinámicos de Word `PAGE` y `NUMPAGES` (*"Página X de Y"*).

---

## 7. Procedimiento Paso a Paso para el Agente

Cuando el usuario solicite: *"exporta este manual a Word / PDF"* o *"conviértelo al formato corporativo de Epiroc"*:

1. **Triage de Idioma (Gate Obligatorio)**:
   - Preguntar al usuario en qué idioma debe emitirse el documento: **Español (ES)**, **Inglés (EN)** o **Portugués (PT)**.
   - Si se solicita inglés o portugués y el archivo fuente está en español, proceder con la traducción y adaptación terminológica (`epiroc-i18n`).
2. **Lectura y Validación de Metadatos**:
   - Abrir el archivo `.md` fuente.
   - Verificar si cuenta con el bloque `frontmatter` YAML. Si falta el autor o revisor, consultar al usuario o completar con los datos de sesión activa (`jaising.pasten@epiroc.com`, etc.).
3. **Ejecución del Conversor**:
   - Ejecutar el script exportador indicando el formato y el idioma deseado (`--lang=es|en|pt` y `--format=pdf|docx|both`).
   - El artefacto final se guardará en la carpeta `docs/exports/` manteniendo el nombre base:
     * `docs/exports/<nombre_documento>_[idioma].pdf`
     * `docs/exports/<nombre_documento>_[idioma].docx`
4. **Verificación de Calidad**:
   - Confirmar que la portada contenga todos los metadatos en el idioma seleccionado.
   - Confirmar que los colores aplicados pertenezcan estrictamente a la paleta oficial (Regla 5).
   - Informar al usuario la ruta del archivo generado con un enlace clicable.
