---
name: epiroc_archify
description: Diseña, valida y compila diagramas de arquitectura, flujos de trabajo, secuencias de APIs, canalizaciones de datos (ETL) y ciclos de vida de estado interactivos (HTML/SVG standalone) para Logistech y proyectos Epiroc. Se activa cuando el usuario solicita visualizar la arquitectura del sistema, topologías de infraestructura/cloud, flujos de tickets, aprobaciones multinivel, secuencia de endpoints, o convertir diagramas Mermaid a mapas interactivos pulidos.
license: MIT
metadata:
  version: "2.17"
  author: Epiroc AI Engineering (based on tt-a1i/archify)
---

# Epiroc Archify

Herramienta de compilación y renderizado de especificaciones JSON-IR a mapas de arquitectura y flujos interactivos (HTML/SVG standalone) adaptada al ecosistema y guías de marca de Epiroc y Logistech.

---

## 1. Cuándo usar esta Skill

Activa `epiroc_archify` cuando:
- Se requiera **documentar visualmente la arquitectura de Logistech** o de un subsistema (Frontend React 19, backend Express segun manifests/lockfiles, DuckDB, Databricks).
- Se necesite mapear **flujos de negocio o aprobación** (creación de tickets, ruteo a Pool Líder / Directo Resolutor, escalamiento multinivel).
- Se soliciten **diagramas de secuencia** de autenticación SSO, middleware o sincronización de base de datos.
- El usuario solicite **convertir o embellecer un diagrama Mermaid** existente en un mapa interactivo para presentaciones ejecutivas o revisiones técnicas.
- Palabras clave: *arquitectura*, *diagrama interactivo*, *mapa del sistema*, *archify*, *flujo visual*, *dataflow*, *secuencia*, *lifecycle*.

---

## 2. Tipos de Diagramas Disponibles

| Tipo (`type`) | Caso de uso principal en Logistech | Ejemplos de Entidades |
|---|---|---|
| `architecture` | Estructura general de servicios, frontend, backend, bases de datos y nube. | React 19 SPA, Express (version comprobada en manifests/lockfiles), DuckDB Local, Databricks Lakebase/PostgreSQL, Databricks Apps, Azure SSO. |
| `workflow` | Procesos de negocio, decisiones y compuertas de aprobación. | Ticket Lifecycle, asignación dinámica, Aprobaciones multinivel (Niveles 1 a 3 con límites SEK), reseteo de base de datos. |
| `sequence` | Llamadas entre capas, middleware, pipelines asíncronos y respuestas. | Handshake de SSO (`x-forwarded-*`), llamadas REST `/api/v1/*`, sincronización con Databricks CLI. |
| `dataflow` | Pipelines de datos, gobierno, transformaciones ETL/ELT y linaje. | `schema.sql` + `init_values.sql` → `regen.ts` → DuckDB → `databricks sync` → Lakebase PostgreSQL. |
| `lifecycle` | Máquinas de estado finito, transiciones, reintentos y estados de error. | Estados de ticket (`PENDIENTE_ASIGNACION`, `EN_PROCESO`, `PENDIENTE_APROBACION`, `RESUELTO`, `CERRADO`, `CANCELADO`). |

---

## 3. Guía de Identidad y Colores Epiroc

Al diseñar esquemas y nodos para Logistech, respeta estrictamente la paleta oficial de Epiroc:

- **Epiroc Yellow**: `rgb(255, 199, 44)` (nodos de énfasis, llamadas principales a la acción).
- **Epiroc Grey**: `rgb(66, 85, 99)` (servicios principales, componentes de infraestructura base).
- **Epiroc Dark Blue**: `rgb(0, 30, 50)` (fondos, bordes de alto contraste, seguridad).
- **Epiroc Light Grey**: `rgb(236, 235, 228)` (fondos claros, agrupadores lógicos).
- **Epiroc Medium Grey**: `rgb(180, 180, 170)` (divisiones, flechas secundarias).
- **Epiroc Green**: `rgb(76, 140, 43)` (estados exitosos, aprobados, bases de datos operativas).
- **Epiroc Red**: `rgb(183, 49, 44)` (rechazos, cancelaciones, estados de error).

---

## 4. Flujo de Autoría y Compilación

Para generar un mapa interactivo sigue estos 4 pasos:

### Paso 1: Investigar fuentes y consultar el esquema
Para diagramas de arquitectura existente, inspecciona entry points, rutas, dependencias y configuracion real. Confirma versiones en `package.json` y lockfiles; no copies una version o capa desde una skill desactualizada. Distingue lo observado de lo propuesto. Luego revisa el esquema correspondiente en `.agents/skills/epiroc_archify/schemas/` (`architecture.schema.json`, `workflow.schema.json`, `sequence.schema.json`, `dataflow.schema.json`, `lifecycle.schema.json`) y sus ejemplos JSON en `.agents/skills/epiroc_archify/examples/`.

### Paso 2: Redactar el JSON tipado
Crea el archivo JSON de especificación (`<nombre>.json`) definiendo nodos (`nodes`), relaciones (`edges`/`relationships`), capas (`layers`/`clusters`) y metadatos (`meta`).
- Mantén `meta.quality_profile` en `"showcase"`.
- Utiliza marcas de producto reconocidas (`brand: "react"`, `brand: "nodejs"`, `brand: "postgresql"`, `brand: "azure"`, etc.) cuando aplique. Puedes consultar marcas soportadas ejecutando:
  ```powershell
  node .agents/skills/epiroc_archify/bin/archify.mjs brands "<nombre>" --json
  ```

### Paso 3: Validar la geometría y composición
Ejecuta la validación determinista antes de compilar:
```powershell
node .agents/skills/epiroc_archify/bin/archify.mjs validate <type> <archivo.json> --quality showcase --json
```
Asegúrate de que no existan errores de composición ni superposición de etiquetas.

### Paso 4: Compilar y generar el HTML entregable
Genera el archivo HTML standalone:
```powershell
node .agents/skills/epiroc_archify/bin/archify.mjs deliver <type> <archivo.json> <salida.html> --quality showcase --json
```

---

## 5. Verificación Visual (epiroc-chrome-devtools)

Tras la entrega del HTML:
1. Inspecciona el archivo HTML resultante abriéndolo o navegando a él con el servidor de desarrollo o mediante las herramientas de `epiroc-chrome-devtools`.
2. Verifica que:
   - Los modos Claro y Oscuro funcionen de forma legible.
   - El trazado de rutas (upstream/downstream) mantenga contraste adecuado.
   - No existan desbordamientos de etiquetas en pantallas estándar (1440×900 o 1920×1080).
   - El menú de exportación permita generar PNG / SVG sin artefactos visuales.

---

## 6. Comandos de Diagnóstico y Salud

Para verificar la integridad del motor de renderizado de la skill:
```powershell
node .agents/skills/epiroc_archify/bin/archify.mjs doctor
```
Todos los checks deben reportar `[ok]`.

## Evolution Log

### [2026-09-29] Runtime-Accurate Architecture Maps

- **Issue:** Architecture examples named Express 5 although the server manifest/lockfile resolve Express 4.
- **User Feedback:** Add durable skill/rule changes so architecture findings are not repeated.
- **Fix Applied:** Require diagrams of existing systems to inspect entry points and manifests/lockfiles, and label observed versus proposed architecture.
- **Impact:** Generated architecture documentation follows the checked-out code and installed runtime instead of stale assumptions.
