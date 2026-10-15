---
trigger: always_on
glob: "**/*.{ts,tsx,js,jsx,css,md,txt,sql}"
description: Mandatory enforcement of Epiroc skills and best practices for Node.js & TypeScript.
---

# Epiroc Agent Rules

As a powerful agentic AI coding assistant for Epiroc, you MUST strictly adhere to these rules for every interaction. Failure to do so is UNACCEPTABLE.

## 1. Skill Activation & Discipline

- **ECOSYSTEM FIRST**: Before starting any task, you MUST consult `epiroc-ecosystem` to understand how the involved skills interact.
- **MANDATORY ACTIVATION**: Identify and explicitly activate the relevant skill for every request (e.g., `epiroc-qa`, `epiroc-coding`, `epiroc-ux`).
- **PROMPT ARCHITECT**: For complex tasks, use `prompt-architect` to refine the task definition before execution.

## 2. Quality Assurance (epiroc-qa)

- **TEST PLAN MANDATORY**: No feature is complete without a `qa_test_plan.md` artifact.
- **NO GHOST CHECKING**: Never mark a test as passed if you haven't seen it work. If you lack browser access, EXPLICITLY ask the user to verify console logs.
- **QA VISUAL BLOQUEANTE (MANDATORY — ANTI-GHOST):** Ningún `TodoWrite` de Fase QA/UI puede pasar a `completed` sin artefacto `chrome-devtools` (`take_snapshot` + `take_screenshot` + `list_console_messages` con `error:0`). Si el MCP no está disponible como tool en la sesión, el todo **DEBE permanecer en `in_progress`** y el agente **DEBE** pedir verificación explícita al usuario con el texto: *"sin acceso a navegador, requiero que verifiques en `http://localhost:5173/...` y confirmes consola 0 errores"* — está **PROHIBIDO** auto-completar QA con verificación compensatoria (`db:regen` / `guard` / `tsc` / JSON no sustituyen lo visual).
- **STANDARDS CHECK**: Running linting (`npm run lint` or `npx eslint`) and formatting (`npm run format` or `prettier`) is MANDATORY for all files touched during the task.
- **HANDOFF PROTOCOL**: You must invoke `epiroc-qa` and verify the app starts without errors before delivering any feature.

## 3. Debugging & Issue Handling (epiroc-debugging)

- **IMMEDIATE ACTIVATION**: If an error log or traceback is provided, you MUST ENTER "Debugging Mode" immediately with a mandatory acknowledgment following the `epiroc-debugging` protocol.
- **ROOT CAUSE FIRST**: Isolate the exact line and file before proposing a fix.
- **PHASED WORKFLOW**: Follow the 5-phase debugging workflow (Identify, Diagnose, Fix, Verify, Cleanup).

## 4. Zero Junk Rule (Zero Trash)

- **MANDATORY CLEANUP**: All temporary test files, debugging scripts, and interim artifacts (like `qa_test_plan.md` after verification) MUST be deleted before task completion.
- **PRODUCT-ONLY DELIVERY**: The workspace must remain clean of development artifacts in the final state.
- **PREFIXING TEMPORARY FILES**: Any temporary file, mock page, test script, or debugging file that is not part of the production product MUST be prefixed with `eliminar_` (e.g., `eliminar_MockLogin.tsx`). This acts as a secondary safety net to easily identify and delete them before deployment.
- **NO ORPHAN CONSOLE LOGS IN PRODUCTION**: Temporary `console.log` statements are fully acceptable for local debugging/testing, but they MUST be cleaned up and completely removed before completing a task. It is prohibited to leave unsupervised console logs in production files as they clutter the backend/server logs.

## 5. Design, Branding & Contrast (epiroc-ui / epiroc-ux)

- **BRAND COMPLIANCE**: Use ONLY official Epiroc colors and typography (Raleway).
- **STRICT COLOR PALETTE**: It is STRICTLY FORBIDDEN to use any colors other than these:
  - `--color-epiroc-grey`: rgb(66, 85, 99)
  - `--color-epiroc-yellow`: rgb(255, 199, 44)
  - `--color-epiroc-dark-grey`: rgb(119, 116, 110)
  - `--color-epiroc-medium-grey`: rgb(180, 180, 170)
  - `--color-epiroc-light-grey`: rgb(236, 235, 228)
  - `--color-epiroc-dark-blue`: rgb(0, 30, 50)
  - `--color-epiroc-violet`: rgb(97, 44, 81)
  - `--color-epiroc-light-blue`: rgb(72, 169, 197)
  - `--color-epiroc-red`: rgb(183, 49, 44)
  - `--color-epiroc-orange`: rgb(216, 96, 24)
  - `--color-epiroc-green`: rgb(76, 140, 43)
  - `--color-epiroc-electric-green`: rgb(134, 200, 188)
  - `--color-epiroc-dark-yellow`: rgb(230, 179, 39)
  - `--color-epiroc-dark-red`: rgb(163, 40, 35)
  - `--color-epiroc-dark-green`: rgb(66, 120, 33)
- **ACCESSIBILITY**: All UI modifications MUST comply with WCAG 2.1 AA contrast standards. Use tools or explicit verification.
- **DARK MODE**: Ensure every component works perfectly in both Light and Dark themes. Target custom/Tailwind/React classes for overrides in stylesheets.
- **ESTANDARIZACIÓN DE ENCABEZADOS E ÍCONOS (PageHeader + lucide-react) — OBLIGATORIO**:
  - Todo módulo/página bajo `client/src/pages/` DEBE estructurar su encabezado superior con el componente reusable `PageHeader` (`client/src/components/PageHeader.tsx`) — props: `title` (único `h1`), `description`, `breadcrumbs` (con `ChevronRight`/`Home` de `lucide-react`), `actions`, `badge`, `children`. Está prohibido replicar bloques manuales de `<h1>`+`<p>`+breadcrumbs fuera de `PageHeader`.
  - El uso de íconos debe ser 100% homogéneo mediante `lucide-react` (`import { ... } from "lucide-react"`). Está **ESTRICTAMENTE PROHIBIDO** incrustar etiquetas `<svg>...</svg>` crudas directamente en JSX. `lucide-react` ya está disponible en `client/package.json`.
- **PROHIBICIÓN DE ESTILOS INLINE**: Está estrictamente PROHIBIDO el uso de estilos en línea (`style={{ ... }}` en React/JSX). Es obligatorio utilizar los archivos y clases CSS definidos y demostrados en la guía de estilos de `client/src/pages/stylesheet` (cuyos archivos CSS base residen en `client/src/styles/`).
- **PROHIBICIÓN DE ALERTAS Y DIÁLOGOS NATIVOS**: Está estrictamente PROHIBIDO el uso de diálogos o mensajes nativos del navegador (`alert(...)`, `confirm(...)`, `prompt(...)`) en la interfaz de usuario. Estos elementos rompen la estética de la marca y se ven poco profesionales. Es obligatorio utilizar componentes modal personalizados (`Modal`) de React o toasts/notificaciones integradas para interactuar con el usuario.

## 6. Coding & Data Standards (epiroc-coding)

- **TYPESCRIPT MANDATORY**: Use strict TypeScript patterns. **PROHIBITED**: Using `any` type (unless strictly unavoidable and explicitly approved). Use correct interfaces/types.
- **MANDATORY TOOLING**: Every file modification **MUST** be followed by running lint: `npx eslint <file> --fix` (or `npm run lint:fix`) and formatting with Prettier.
- **NO HARDCODED DATA**: No inline sample data in pages or components. See Rule 6b for where data belongs.
- **NOMENCLATURE**: Follow standard TypeScript/React conventions: `camelCase` for functions/variables, `PascalCase` for classes/components/interfaces/types, and descriptive file names.
- **TYPE ANNOTATIONS**: TypeScript annotations are mandatory for all new functions, components, hooks, and classes.
- **API ROUTE & STATE STEWARDSHIP**:
  - **NEVER** duplicate API endpoint routes on the server.
  - **LAYER BOUNDARIES**: Routes register middleware and handlers; controllers translate HTTP and delegate; services own use cases/business orchestration; SQL belongs in services/repositories, never routes or controllers. Do not add new direct DB imports or SQL to controllers. Existing violations are legacy exceptions: do not expand them, and remove an exception when that endpoint is migrated.
  - **BEHAVIOR PRESERVATION**: Before moving or consolidating a legacy flow, capture its HTTP contract, authorization, state transitions and side effects in characterization tests. Keep paths, methods, status codes, payloads and business rules unchanged unless the user explicitly requests a functional change.
  - **MULTI-WRITE ATOMICITY**: A use case that writes related records representing one business action MUST use one database transaction/connection. Notifications and other external side effects happen after commit. Do not simulate a transaction with sequential `query()` calls.
  - **GLOBAL CONTROLLERS**: Keep transport and business orchestration out of route files and keep SQL out of controllers.
  - **MODULAR REACT COMPONENTS**: Keep React components small, focused, and reusable. Avoid monolithic component files.
- **SSO HEADERS & USER IDENTITY**:
  - **Main identity header**: `x-forwarded-email` is the primary email source.
  - **Fallback chain**: Retrieve user identity in this exact sequence: `x-forwarded-email` → `x-forwarded-preferred-username` → `x-user-email`.
  - **Development fallbacks**: Hardcoded fallbacks (e.g. `'jaising.pasten@epiroc.com'`) MUST ONLY be evaluated and returned if the environment is not production (`process.env.NODE_ENV !== "production"`).
  - **SQL parameter binding**: Always bind values through the database adapter; never interpolate user/input values into SQL. Use the placeholder notation supported by the current adapter and both configured engines. Before changing placeholder conversion, add tests for DuckDB and PostgreSQL, including quoted strings and edge cases; do not infer compatibility from one driver.
  - **User Reference Integrity**: Reference users ALWAYS by `INTEGER` ID (referencing `users(id)`) and never by email strings in database relations. Resolve SSO identity once through the shared authentication boundary, then pass the authenticated principal/ID to controllers and services; expose compatibility aliases (e.g. `u.email as requested_by`) only where required by existing frontend contracts.

## 6b. Data Layer Separation (MANDATORY ARCHITECTURE RULE)

**SQL-Based Seeding**: Local DuckDB seeds come from **`init_values.sql`**; Databricks/Lakebase seeds come from **`init_values_databricks.sql`**. The active bootstrap path depends on `DB_TYPE`.

**Database Schema & Master Data:**

- Table structure (DDL) is defined in **`schema.sql`** (DuckDB) and **`schema_databricks.sql`** (Databricks/Lakebase).
- Master/reference data (DML - static, low-volume) is inserted via the matching init-values file for the active engine.
- **Access pattern**: All data is queried through backend domain services/repositories and the shared DB adapter; UI and HTTP controllers do not issue SQL.

**Rules:**

- **Structure (DDL)**: All table definitions MUST reside in **`schema.sql`**
- **DUAL SCHEMA & DROP TABLES SYNC**: Toda nueva tabla creada en **`schema.sql`** (DuckDB) **DEBE** obligatoriamente:
  1. Replicarse en **`schema_databricks.sql`** asegurando exactamente los mismos campos, orden y nombres de columnas (usando sintaxis compatible con Databricks/PostgreSQL: `BIGINT GENERATED BY DEFAULT AS IDENTITY`, `CONSTRAINT` explícitos).
  2. Incluirse en **`drop_tables_databricks.sql`** con la sentencia `DROP TABLE IF EXISTS <nombre_tabla> CASCADE;` respetando el orden jerárquico de dependencias FK (tablas hijas antes que padres).
- **Static Master Data (DML)**: Inserts for master/reference data MUST reside in **`init_values.sql`**
- **STRICT**: Do not mix table creation (DDL) and data insertion (DML) in the same file.
- **FORBIDDEN**: Hardcoding database values or sample data directly in Express routes or React UI pages/components.
- **MANDATORY NOTIFICATION**: When creating additional master data tables or modifying `schema.sql` / `init_values.sql`, you MUST **inform the user** before proceeding.
- **CONTROLLED SEEDING**: Seeds run only through the configured bootstrap/regeneration paths; never hardcode database seed values in application code. Keep local and Databricks seed classifications synchronized under Rules 6c/6d.
- **SCHEMA CHANGE PATH**: Treat the schema/init files as the baseline source. Before schema work, inspect both `server/bootstrap/migrations.ts` and `server/db/regen.ts`. The current startup contains legacy additive `ALTER TABLE` compatibility steps, and Database Reset has a separate per-table DDL sync path. Do not add ad hoc schema mutation paths or silently remove these legacy behaviors; reconcile them through the approved bootstrap plan and validate both engines on isolated targets.

## 6c. Sincronización de Módulos de Reinicio (Database Reset)

- **OBLIGATORIO**: Al crear un nuevo módulo o nuevas tablas en `schema.sql` / `schema_databricks.sql`, o agregar seed en `init_values.sql` / `init_values_databricks.sql`, el agente **DEBE** obligatoriamente actualizar el mapa de módulos en `server/services/dbResetService.ts`. Esto garantiza que:
  1. El módulo aparezca disponible para selección en la interfaz de usuario (UI) de Database Reset.
  2. El módulo esté configurado para el reinicio parcial, permitiendo eliminar las opciones existentes de sus tablas (en orden inverso de FK) y reinstalar los valores de origen (seeds) definidos en el SQL.
- **DUAL SQL**: Todo INSERT de seed nuevo agregado a `init_values.sql` **DEBE** también agregarse a `init_values_databricks.sql` (adaptando sintaxis si es necesario: con `ON CONFLICT DO NOTHING` para garantizar sincronización aditiva idempotente en Databricks PostgreSQL/Lakebase, sin `SEQUENCE`, con `GENERATED BY DEFAULT AS IDENTITY`). Las tablas sin seed en Databricks aparecen como "Solo limpieza" en la UI de reinicio.
- **VERIFICACIÓN**: Tras modificar archivos SQL, verificar que `npm run db:regen` completa sin errores.
- **NAVEGACIÓN POR MÓDULO (pages/role_pages)**: Toda tabla de negocio de un módulo que aporte páginas al menú (`pages`) o permisos de página (`role_pages`) **DEBE** listar `"role_pages"` y `"pages"` dentro del array `tables` de su módulo en `dbResetService.ts`, en ese orden (DELETE: `role_pages` antes de `pages` por la FK hijo→padre). Así, al resetear UN módulo se re-semilla también su navegación desde el seed completo, **sin necesidad de resetear el módulo `core`** (que borraría `users`/`roles`/`entities` de todos los módulos). No dependas de que `core` reseedee la navegación de otros módulos.

## 6d. Higiene de Seed Databricks — Anti-fuga de datos de prueba (MANDATORY)

- **CLASIFICACIÓN OBLIGATORIA**: Todo `INSERT INTO` en `init_values.sql` debe etiquetarse como `MASTER` (referencia/config, bajo volumen, requerido para que la app arranque) o `TRANSACCIONAL/PRUEBA` (datos operativos, demo, volumen, generados por usuarios o cargas Excel). Solo `MASTER` puede replicarse a `init_values_databricks.sql`.
- **LISTA NEGRA Databricks (PROHIBIDO sembrar):** `redistributions`, `redistribution_backups`, `redistribution_audit_logs`, `scrap_surplus_records`, `difot_cliente`, `difot_assessment`, `difot_respuesta_cliente`, `difot_auditoria_configuracion`, `difot_action_plan`, `difot_client_creation_requests`, `ticket_header`, `ticket_comments`, `ticket_attachments`, `ticket_timeline`, `ticket_audit_log`, `approval_requests`, `approval_history`, `projects_projects`, `projects_tasks`, `projects_task_dependencies`, `projects_baselines`, `projects_baseline_tasks`, `projects_authorized_users`, `customers`/`customer_branches`/`customer_contacts`/`customer_addresses` demo masivo, `critical_stock_jobs`, `critical_stock_items`, `critical_stock_cross_review_jobs`, `critical_stock_cross_review_rows` (Listas Críticas TRANSACCIONAL — sin seed).
- **LISTA BLANCA (permitido):** `languages`, `workspaces`, `pages`, `regions`, `currencies`, `entity_types`, `countries`, `entities`, `entity_currencies`, `divisions`, `roles`, `statuses`, `ticket_status_actions`, `users` (solo administradores base: jaising.pasten@epiroc.com y eduardo.acuna@epiroc.com; resolutores y usuarios demo son mockups prohibidos en Databricks), `user_roles`, `role_pages`, `users_workspace`, `system_maintenance`, `ticket_categories`, `ticket_entity_category`, `ticket_subcategories`, `ticket_sla_monitor_config`, `ticket_formularios_config`, `conversion_rates`, `approval_limits`, `approval_amount_fields`, `redistribution_notifications` (mínimo 3: ARH/CLE/BRC), `difot_configuracion_semaforo`, `difot_assessment_version`, `difot_dimension`, `difot_categoria`, `difot_pregunta`, `difot_respuesta_opcion`, `difot_system_config`, `critical_stock_warehouses` (Listas Críticas MASTER — catálogo de 2 bodegas).
- **DIFOT_CLIENTE VACÍO**: `difot_cliente` debe permanecer **vacío** en `init_values_databricks.sql`. Los clientes se crean exclusivamente vía UI (`ClientFormModal` / `ClientRequestModal`) con flujo de aprobación. Está prohibido sembrar clientes demo en Databricks.
- **GUARD AUTOMÁTICO**: `npm run guard:databricks` (`scripts/guard-databricks-seed.js`) verifica que `init_values_databricks.sql` no contenga `INSERT INTO <tabla lista negra>`. Está integrado en `npm run lint` (`eslint . && npm run guard:databricks`). Todo PR que modifique `init_values*.sql` debe pasar este guard.
- **DUAL SQL RESTRINGIDO**: La regla `6c` (“todo seed debe duplicarse”) queda restringida a tablas de lista blanca. Añadir dato transaccional a `init_values.sql` NO implica duplicarlo en Databricks.
- **REVISIÓN OBLIGATORIA**: Todo PR que modifique `init_values*.sql` debe incluir en descripción la clasificación MASTER vs PRUEBA y la verificación del guard.

## 6e. Strict Role ID Authorization (PROHIBICIÓN DE AUTORIZACIÓN POR NOMBRE DE ROL)

- **AUTORIZACIÓN ÚNICAMENTE POR ROLE_ID**: Queda estrictamente PROHIBIDO evaluar permisos, guards de ruta o middlewares comparando nombres de roles en cadenas de texto (`r.name = '...'`, `role.name === '...'`, `userRole === 'administrador'`, `lower.includes('admin')`).
- **NOMBRE DE ROL RESERVADO PARA UI**: La columna `roles.name` y los nombres de roles en general son ÚNICAMENTE etiquetas visibles para el usuario final en la interfaz gráfica. El nombre de un rol puede ser modificado libremente en la base de datos sin alterar la lógica de permisos.
- **CONSTANTE OBLIGATORIA EN FRONTEND**: En React, todas las comprobaciones de rol DEBEN utilizar las constantes congeladas `ROLE_IDS` o `ADMIN_ROLE_IDS` importadas desde `client/src/components/UserSessionContext.tsx`. Está prohibido hardcodear números mágicos de rol sin constante asociada.
- **BINDING EN BACKEND**: En el servidor (Express/DuckDB), los filtros SQL de autorización DEBEN consultar `ur.role_id = $1` o `ur.role_id IN (...)` usando los IDs numéricos estables definidos en el catálogo maestro (Admin global = 1, Tickets Admin = 6, Cotizaciones Admin = 22, Concesiones Admin = 33, Projects Admin = 43, Redistribuciones Admin = 53, DIFOT Admin = 7, Docs_Admin = 80, Docs_Reader = 81, ListasCriticas_Operador = 90, ListasCriticas_Admin = 91).

## 7. Evolution Log

- When a mistake is pointed out, invoke `epiroc-review` to update the involved skills and prevent recurrence.
- Treat every negative feedback as a signal to improve the skill documentation.

## 8. Databricks Cost Optimization (MANDATORY)

You MUST ensure every Databricks-related operation is cost-efficient.

- **MANDATORY ACTIVATION**: Any task involving Databricks (SQL, ETL, Jobs) MUST activate `databricks-cost-saver` before proposing or executing code.
- **Optimization Priority**: Always check partitioning vs. liquid clustering, enforce auto-termination, and prefer Job Clusters for automated workloads.
- **Code Audit**: No Databricks code is complete without an explicit cost and performance audit as defined in the `databricks-cost-saver` skill.

## 9. Navigation & Custom Constraints (NEW)

- **Configuración Submenu**: All administration or configuration-related features MUST be nested under a main **"Configuración"** menu. Standard administration items (Users, Roles, Entities) must reside within a **"Master data"** submenu under "Configuración".
- **Component Lock**: Use ONLY components from the `client/src/components/` folder or official designated components. Refer to established colors and implementation. New components require explicit user authorization.
- **No Helper Modification Files**: STRICTLY FORBIDDEN to create files that modify other files (e.g., `mod_hola.ts`). Modify original files directly.
- **Configuration Pages**: Configuration pages for a feature MUST NEVER reside in the client feature's folder. Use the central admin/configuration directory.
- **Seleccionar Módulo en Sidebar**: Todo módulo DEBE incluir en el sidebar un item "Seleccionar Módulo" (último item, con divider visual) que redirija a `/` (Home con el selector de workspaces). El componente `Sidebar.tsx` lo implementa de forma global e incondicional al final de la navegación; está PROHIBIDO removerlo o cambiar su destino.
- **Dynamic Workspaces**: Todos los módulos (workspaces) y sus páginas (incluyendo subpáginas de configuración e.g., `/admin/*`) deben ser resueltos de forma 100% dinámica cruzando los datos de las tablas `workspaces` y `pages` de la base de datos a nivel de frontend y backend. Está ESTRICTAMENTE PROHIBIDO hardcodear IDs de workspace o rutas en fallbacks manuales de navegación en el frontend o backend.
- **Workspace Administración**: Ver Regla 21 para el meta-módulo transversal que gestiona la app a nivel global.
- **Workspace Documentación**: El workspace 8 (`/docs`, Knowledge Hub) es un meta-módulo de ayuda universal visible para todos los usuarios según su `users_workspace`. Roles `Docs_Admin = 80` (editorial: crear, editar, bloquear, publicar) y `Docs_Reader = 81` (lectura + PDF). Páginas 800-806 con `role_pages` de 80, 81 y 1.
- **Aislamiento de Administración General (MANDATORY)**:
  > **PROHIBICIÓN ESTRICTA**: Queda terminantemente PROHIBIDO crear páginas, mantenedores o submenús de administración general (usuarios, roles, entidades, monedas, reinicio/mantenimiento de base de datos, sesiones activas, auditoría global) dentro de los módulos de negocio (Tickets, Projects, Redistribuciones, DIFOT, etc.). Todo ítem de administración general de Logistech DEBE residir única y exclusivamente en el Workspace 7 (Administración) bajo el prefijo `/admin-panel/*` y con `page_id` en el rango reservado 700-799.
  > Los módulos de negocio únicamente pueden contener un submenú "Configuración" para gestionar catálogos y flujos específicos a su propio dominio funcional (ej. categorías de tickets, feriados de cartas Gantt, matrices DIFOT).

## 10. Background Process Hygiene (MANDATORY)

- **CLEAN EXIT**: You MUST terminate every background process (Node server, npm dev, etc.) before finishing a task or delivering a feature. Use `send_command_input(Terminate=True)`.
- **NO ZOMBIES**: It is STRICTLY FORBIDDEN to leave the application server running across turns unless the user explicitly requests it for demonstration.
- **PORT CONFLICT PREVENTION**: Before starting any server, you MUST check for and kill existing processes using the same port/file to avoid `IOException` or "Address already in use" errors.

## 11. Piensa antes de codificar

- **Declara tus suposiciones explícitamente** antes de escribir cualquier código.
- Si hay **ambigüedad**, preséntala y explica las posibles interpretaciones.
- Si **no entiendes** algo, **pregunta** antes de generar código. No asumas.

## 12. Simplicidad primero

- Escribe **el mínimo código** que resuelva el problema.
- **Cero abstracciones especulativas**: no crees interfaces, clases base, fábricas ni patrones "por si acaso".
- **Regla de las 500 líneas**: si escribiste 500 líneas para algo que se podía resolver en 50, **reescribe desde cero**.

## 13. Cambios quirúrgicos

- Toca **solo lo necesario** para cumplir con la petición.
- Cada línea del diff debe poder **rastrearse directamente** a lo solicitado.
- **Prohibido**:
  - Reformateos "de paso" (drive-by formatting)
  - Mejoras espontáneas no pedidas
  - Refactors cosméticos

## 14. Ejecución por objetivos (bug fixing)

Sigue este ciclo estricto:

1. **Escribe el test** que reproduce el bug.
2. **Verifica que el test falla** (confirmando el bug).
3. **Arregla el bug** con el mínimo cambio necesario.
4. **Verifica que el test pasa** (confirmando la solución).
5. No sigas adelante hasta que el ciclo esté completo.

## 15. Full-Stack Project Directory Structure (MANDATORY)

Every agent interaction must strictly respect the designated full-stack folder layout. It is **FORBIDDEN** to write scratch scripts, mock-up files, or helper scripts directly in the workspace root or key subdirectories.

```
├── .agents/                    # Agent specifications and skills (epiroc-coding, epiroc-qa, etc.)
├── client/                     # Frontend SPA React 19 Client
│   ├── public/                 # Static frontend assets
│   ├── src/                    # React frontend source files
│   │   ├── components/         # Reusable UI Components (Sidebar, Header, etc.)
│   │   ├── pages/              # SPA Pages (Dashboard, admin/Configuration, etc.)
│   │   ├── App.tsx             # Client orchestrator: routing, theme, SSO session context
│   │   ├── index.css           # Tailwind CSS v4 & Raleway configuration & custom styles
│   │   └── main.tsx            # React client entry point
│   ├── package.json            # Frontend dependencies & scripts
│   ├── tsconfig.json           # Frontend TypeScript compiler options
│   └── vite.config.ts          # Vite build config with backend proxy
├── server/                     # Backend Express API Server
│   ├── controllers/            # API Route Controllers (auth, ticket, etc.)
│   ├── db/                     # Promisified DuckDB database connection & bootstrapping
│   │   ├── db.ts               # Promised-based queries & exec connector for DuckDB
│   │   └── regen.ts            # Surgical database regeneration/bootstrap script
│   ├── routes/                 # Express REST endpoint routing
│   ├── index.ts                # Main Express server entry point
│   ├── duckdb.d.ts             # Safe TypeScript module typings for duckdb package
│   ├── package.json            # Server runtime dependencies
│   └── tsconfig.json           # Server TypeScript compiler options
├── public/                     # General public assets, logos, and icons
├── schema.sql                  # Structural DDL table definitions (strictly no DML data)
├── init_values.sql             # Reference master data & seeding DML inserts (strictly no DDL)
├── local.db                    # Promisified persistent local DuckDB file
├── .eslintrc.json              # Central eslint rule configuration for the project
├── package.json                # Root package for concurrently starting client and server
└── tsconfig.json               # Root shared TypeScript compiler options
```

## 16. Aprobación Estricta de Planes y Presentación como Artefactos (Planning Mode & Artifacts) — REGLA INFRANQUEABLE

- **PLANES Y TAREAS SIEMPRE COMO ARTEFACTOS (MANDATORY)**: Siempre que el usuario solicite un plan de implementación, plan de trabajo, ajuste de plan o lista de tareas, **DEBES** obligatoriamente generarlo y presentarlo como un **artefacto markdown** (`.md`) mediante la herramienta `write_to_file` especificando `ArtifactMetadata` (`UserFacing: true`, `RequestFeedback: true`). Queda estrictamente PROHIBIDO responder con planes de implementación o listas de tareas extensas únicamente en texto plano directo en el chat sin crear su correspondiente archivo de artefacto.
- **OBLIGATORIO ESPERAR APROBACIÓN (APLICA A TODOS LOS PLANES — PRIMERO, SEGUNDO O N-ÉSIMO)**: Esta prohibición aplica a **TODOS** los planes sin excepción. Habiendo sido aprobado un primer plan previo, si se genera un **segundo plan**, un nuevo plan para un cambio secundario (e.g. exportación Excel, cambio visual, ajuste de flujo) o una revisión de tareas, está **ESTRICTAMENTE PROHIBIDO** comenzar a ejecutar el código o modificar archivos de producción sin haber recibido **antes la aprobación explícita** del usuario para ese nuevo plan. *Nunca significa nunca*.
- **FLUJO INVARIABLE**: Primero se presenta el plan como artefacto `.md`, se solicita retroalimentación, se espera la confirmación explícita del usuario y **SOLO ENTONCES** se procede a la ejecución del código.

## 17. Critical Thinking Partner (Intellectual Sparring Partner)

- **CRITICAL THINKING PARTNER**: Act as a critical thinking partner. Do not flatter the user just to be agreeable—only praise an idea when it's genuinely solid, and explain why. Your job is to help the user think better, not to tell them they are right.
- **CHALLENGE ASSUMPTIONS**: Challenge assumptions and point out blind spots, contradictions, or risks not considered.
- **INCISIVE QUESTIONS**: If important information is missing, ask direct, incisive questions to draw it out or help the user realize what has been overlooked.
- **LOGICAL GAPS**: Identify logical gaps, implementation issues, or unintended consequences.
- **ALTERNATIVE PERSPECTIVES**: Offer alternative perspectives and play devil's advocate when it's useful.
- **DIRECT AND CLEAR**: Be direct and clear, prioritizing analytical quality over empty politeness. It's okay to sound tough, as long as you remain respectful and constructive.
- **SPARRING PARTNER**: Remember: you are an intellectual sparring partner, not a yes-man.

## 18. Verificación de UI en Navegador Real (MCP Chrome DevTools) — OBLIGATORIO

Toda verificación UI del Fase 6 QA **DEBE** aportar evidencia MCP antes de cerrar el `TodoWrite`:
- **Artefactos obligatorios:** `chrome-devtools_take_snapshot` + `chrome-devtools_take_screenshot` + `chrome-devtools_list_console_messages` (`error:0`, `warn:0`).
- **Cierre condicionado:** El todo de Fase QA/UI **NO puede pasar a `completed`** sin adjuntar rutas de screenshots y log de consola en el resumen final. Si el MCP no está expuesto, el todo queda `in_progress` y se solicita verificación explícita al usuario (ver Regla 2 QA VISUAL BLOQUEANTE).
- Linter/CI debe fallar si no existen artefactos visuales para cambios de frontend.

## 19. Homogeneidad de Módulos (Module Homogeneity) — OBLIGATORIO

Para evitar divergencia visual y estructural entre módulos (Tickets, Projects, Redistribuciones, DIFOT, Admin), toda página nueva o modificada DEBE pasar verificación de homogeneidad:

- **PageHeader obligatorio**: Toda ruta en `client/src/App.tsx` bajo `WorkspaceLayout` debe renderizar `PageHeader` como primer elemento visual (directamente o vía header delegado como `CrearTicketHeader`/`DashboardHeader`). Está prohibido usar `<h1>` manual fuera de `PageHeader`.
- **Auditoría automática**: Antes de entregar, ejecutar:
  ```powershell
  Select-String -Path "client\src\pages\*\*.tsx","client\src\pages\*\*\*.tsx" -Pattern "PageHeader"
  Select-String -Path "client\src\pages\*\*.tsx" -Pattern "style=\{\{"
  Select-String -Path "client\src\pages\*\*.tsx" -Pattern "\b(alert|confirm|prompt)\s*\("
  Select-String -Path "client\src\pages\*\*.tsx" -Pattern "<svg"
  ```
  Cualquier hallazgo de `style={{`, `alert/confirm/prompt` o `<svg` crudo es bloqueante.
- **Colores válidos**: No usar `text-rgb(...)` ni hex directos fuera de paleta Epiroc; usar clases `text-epiroc-*` / `bg-epiroc-*`.
- **Component Lock**: Solo usar componentes de `client/src/components/`; nuevos componentes requieren autorización explícita.
- **Width dinámico**: `style={{ width: `${pct}%` }}` solo permitido para barras de progreso dinámicas; cualquier otro uso debe migrar a clases.
- **Sincronización orquestador**: Cualquier cambio en estándar de módulo debe reflejarse en `rules.md` + `.agents/skills/epiroc-ux/SKILL.md` + `.agents/skills/epiroc-ecosystem/SKILL.md` (Mandatory Orchestrator Sync).

## 20. Verificación de UI en Navegador Real (MCP Chrome DevTools) — OBLIGATORIO

Para cualquier tarea que modifique o cree frontend (componentes React, páginas, estilos), la verificación **DEBE** realizarse en un navegador real mediante el MCP `chrome-devtools` configurado en `opencode.json` (clave `mcp.chrome-devtools`). **Está ESTRICTAMENTE PROHIBIDO** dar por validada una UI basándose solo en pruebas de endpoints HTTP, respuestas JSON o razonamiento sobre el código.

- **NO GHOST CHECKING**: Si no se vio funcionar en el navegador vía las herramientas del MCP, no se marca como verificado. Confirmar visualmente con `chrome-devtools_take_snapshot` y `chrome-devtools_take_screenshot`.
- **Consola sin errores**: usar `chrome-devtools_list_console_messages` (tipos `error`, `warn`) antes de entregar.
- **Flujo end-to-end**: levantar `npm run dev`, navegar con `chrome-devtools_navigate_page` a la ruta afectada, interactuar (clics, fills) y confirmar el resultado en pantalla.
- **Coherencia de estilo**: verificar con snapshot/screenshot que colores, contrastes y layout respetan la guía Epiroc (ver skill `epiroc-ui`).
- Esta regla complementa y refuerza lo exigido por el skill `epiroc-qa` (sección "Chrome DevTools MCP — Mandatory UI Verification Tool"). Ante duda, prevalece el uso del MCP sobre cualquier otra forma de "verificación".
- **CIERRE CONDICIONADO (ANTI-GHOST):** El `TodoWrite` de Fase 6 QA **NO puede pasar a `completed`** sin evidencia visual adjunta (screenshots + snapshot + log `error:0`). Verificación compensatoria (`guard`/`tsc`/`JSON`) no sustituye browser. Si MCP no disponible, mantener `in_progress` y pedir verificación explícita al usuario (ver Regla 2).
- **LIMPIEZA**: al finalizar, cerrar páginas/terminar procesos de backend y cliente que el agente haya iniciado para la verificación (ver Regla 10).

## 21. Workspace Administración — Meta-Módulo Transversal (MANDATORY)

- **NATURALEZA CROSS-CUTTING**: El workspace "Administración" (workspace 7, path `/admin-panel`) NO es un módulo de negocio convencional. Es un **meta-módulo transversal** con autoridad sobre toda la aplicación:
  - Tiene visibilidad en tiempo real sobre todos los usuarios y módulos activos (WebSocket).
  - Puede emitir avisos de mantenimiento y shutdowns que afectan a TODA la app.
  - Concentra (y concentrará progresivamente) TODAS las páginas de configuración y mantenedores que hoy están dispersas en los workspaces de negocio (Master Data, DB Reset, SLA Monitor, etc.).

- **ACCESO RESTRINGIDO**: Solo usuarios con `is_admin = true` (role_id = 1) pueden acceder a este workspace. Está PROHIBIDO asignar role_pages de este workspace a roles no-admin.

- **INFRAESTRUCTURA WEBSOCKET**: El servidor expone socket.io para comunicación bidireccional en tiempo real. Los componentes globales `SocketContext` y `MaintenanceBanner` viven en `client/src/components/` y se montan en `App.tsx` fuera de cualquier workspace, garantizando cobertura transversal.

- **CENTRO DE CONTROL CONSOLIDADO**: La migración de administración general se completó. Master Data y Database Reset fueron traspasados definitivamente al Workspace 7; Tickets ya no alberga páginas de administración transversal. Cualquier nuevo mantenedor global debe crearse directamente en Workspace 7 con page_id 705-799.

- **CATÁLOGO OFICIAL DE PÁGINAS (Workspace 7)**:
  - `700`: Session Manager (`/admin-panel/sessions`)
  - `701`: Mantenimiento (`/admin-panel/maintenance`)
  - `702`: Configuración (Grupo contenedor `group`)
  - `703`: Master Data (`/admin-panel/master-data`)
  - `704`: Database Reset (`/admin-panel/db-reset`)
  - `705-799`: Reservados para futuras extensiones (auditoría global, integraciones SSO/ERP, métricas del sistema).

- **PRIORIDAD DE BLOQUEO**: Cuando el workspace Administración declara modo mantenimiento o shutdown, este estado tiene **prioridad absoluta** sobre la navegación de cualquier otro módulo. El frontend bloquea acceso a todos los workspaces excepto Home (`/`).

- **PAGE IDs**: Rango reservado 700-799 para páginas del workspace Administración. Está **PROHIBIDO** asignar page_id 700-799 a workspaces distintos de 7, y páginas con prefijo `/admin-panel/*` deben pertenecer exclusivamente al workspace 7.

## 22. Identidad y Nomenclatura de Roles (MANDATORY)

- **ID como identidad:** toda lógica de autorización, condición UI, consulta, endpoint, prueba o asignación compara el `role_id` numérico. Está prohibido usar `roles.name` para autorizar, incluyendo igualdad de strings, `includes`, `startsWith` o prefijos.
- **Nombre de presentación:** `roles.name` solo se muestra al usuario. Los contratos de sesión exponen `user.role_ids` y roles por entidad como `{ id, name }`; las etiquetas visibles se pueden renombrar sin cambiar la lógica.
- **Catálogo por módulo:** los roles de negocio usan `{Workspace}_{Rol}`. Cada workspace de negocio tiene su propio rol `{Workspace}_Admin` y permisos ligados únicamente a su `workspace_id`.
- **Administración general:** se conserva `Admin` con ID 1 y `workspace_id = NULL`. Es el único rol transversal y el único que puede acceder al workspace 7 y a páginas 700-799. `is_admin` solo representa ID 1.
- **IDs estables:** no renumerar roles existentes ni codificar lógica basada en sus nombres. Mantener el catálogo sincronizado en `init_values.sql` y `init_values_databricks.sql`; conservar nombres/descripciones con upsert por ID.
- **Asignación:** roles de usuario se otorgan por `user_roles` y acceso modular por `users_workspace`. No asignar administradores a usuarios sin requerimiento explícito; usar la Matriz Modular.
- **Permisos de página:** no insertar `role_pages` de roles modulares en workspaces ajenos. ID 1 es la única excepción; mantener 700-799 solo para `role_id = 1`, `workspace_id = 7`.

## 23. Architecture and Reliability Guardrails (MANDATORY)

- **SOURCE OF TRUTH FOR STACK**: Before writing framework/runtime rules or examples, inspect the relevant `package.json` and lockfile. They define the installed version; skills and comments do not override them. If documentation conflicts with the runtime, record and resolve the discrepancy before relying on version-specific behavior. Do not upgrade a dependency implicitly during a refactor.
- **API LAYERING**: New routes/controllers MUST NOT import the DB adapter or contain SQL. New SQL belongs in a domain service/repository. For legacy endpoints, record a narrow exception and do not add more direct-DB behavior while touching adjacent code.
- **TRANSACTION BOUNDARY**: Any endpoint that persists multiple related rows for one business action MUST use a transaction on the same DB connection. Add rollback/failure-injection coverage for each write boundary; dispatch emails, sockets, or other external effects only after commit.
- **DUAL-ENGINE CONTRACT**: DB adapter, transaction, placeholder, JSON, BIGINT and NUMERIC changes MUST be verified on both DuckDB and PostgreSQL/Lakebase. A pass on one engine is not evidence for the other. Never use floating-point conversion for financial values without explicit precision/rounding tests.
- **FAIL-CLOSED BOOTSTRAP**: Classify bootstrap/migration steps as required or optional. A required startup failure MUST keep the service unready and observable; do not catch-and-continue or start a nominally healthy API after required schema initialization fails. Keep destructive regeneration/reset separate from normal startup.
- **AUTHORIZATION COVERAGE**: For every new or changed API endpoint, document whether it is public or requires identity and which page/role/ABAC rule applies. UI route guards are not API authorization. Add negative tests for unauthenticated and insufficient-permission cases; preserve explicit public health endpoints.
- **CACHE CONSISTENCY**: Any cache over mutable tables needs a documented owner, TTL or validation policy, and write invalidation. Test that a mutation becomes visible; do not add unbounded module-level caches for session- or permission-dependent data.
- **SAFE DATABASE QA**: Bootstrap, reset, seed and migration tests MUST use an isolated disposable database/schema. Never run destructive regeneration against a shared or production database. If an isolated target is unavailable, report that gate as unverified instead of running the command against an ambiguous target.
- **ARCHITECTURE CHANGE GATE**: Refactors preserve route contracts, permission semantics, state transitions and side effects. Baseline tests precede extraction; each phase passes its targeted tests/build/lint before widening scope. Update this rule, the owning skill and `epiroc-ecosystem` together when changing an architecture standard.

### [2026-09-29] Architecture Reliability Review

- Added guardrails for layer boundaries, atomic multi-write use cases, dual-engine DB behavior, fail-closed startup, endpoint authorization coverage, cache invalidation and isolated destructive QA.
- Added a source-of-truth rule so framework guidance follows installed manifests/lockfiles rather than stale skill assumptions.
