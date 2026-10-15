---
name: epiroc-ecosystem
description: Coordinates all Epiroc skills and defines their interactions. Use as the central reference for understanding how UX, UI, Components, Coding, Debugging, and QA skills work together to maintain consistency in Epiroc Node.js and TypeScript applications.
---

# Epiroc Skills Ecosystem

This document describes the interactions and dependencies between all Epiroc skills for Node.js & TypeScript web application development.

## Skills Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EPIROC SKILLS ECOSYSTEM                               │
│                 (Logistech - 21 skills + Administración cross-cutting)       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────┐                                                      │
│    │  epiroc-coding  │ ◄──── Always active for any code interaction         │
│    │   (Standards)   │      (delegates to specialized skills)               │
│    └────────┬────────┘                                                      │
│             │                                                                │
│      ┌──────┴───────┬────────────────────────┐                              │
│      ▼              ▼                        ▼                               │
│ ┌─────────┐   ┌───────────┐          ┌──────────────┐                       │
│ │epiroc-  │   │  DOMAIN   │          │  FRONTEND    │                       │
│ │  api    │   │  SKILLS   │          │  SKILLS      │                       │
│ │(REST)   │   │           │          │              │                       │
│ └────┬────┘   └─────┬─────┘          └──────┬───────┘                       │
│      │              │                       │                               │
│      │    ┌─────────┼─────────┐     ┌───────┴──────────┐                   │
│      │    │         │         │     │                  │                   │
│      │    ▼         ▼         ▼     ▼                  ▼                   │
│      │ workflows  security  i18n  ux/ui            components              │
│      │ (tickets+  (SSO+ABAC (EN/ES (layout+         (30+ catalog:          │
│      │  approvals)+deleg.) PT/SV)  styles)          Modal,Stepper,etc)     │
│      │              │                                              │        │
│      └──────────────┴──────────────────────────────────────────────┘        │
│                              │                                              │
│                              ▼                                              │
│    ┌─────────────────────────────────────────────┐                          │
│    │   epiroc-mockup-data  (schema + seeding)    │                          │
│    └─────────────────────────────────────────────┘                          │
│                              │                                              │
│                              ▼                                              │
│              ┌─────────────────┐                                            │
│              │ epiroc-qa       │ ◄─── Mandatory verification before delivery │
│              │   (Handoff)     │                                            │
│              └────────┬────────┘                                            │
│                       │                                                     │
│                       ▼                                                     │
│              ┌─────────────────┐                                            │
│              │ epiroc-debugging│ ◄─── Activates on issues                   │
│              │   (Fix/Cleanup) │                                            │
│              └────────┬────────┘                                            │
│                       │                                                     │
│                       ▼                                                     │
│              ┌─────────────────┐                                            │
│              │ epiroc-review   │ ◄─── Evolves skills from feedback          │
│              │   (Evolution)   │                                            │
│              └─────────────────┘                                            │
│                                                                              │
│    SUPPORT SKILLS: prompt-architect, databricks-cost-saver, skill-creator,  │
│                    epiroc-chrome-devtools, epiroc_archify,                  │
│                    epiroc-documenter, epiroc-doc-publisher                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Skill Responsibilities

| Skill | Primary Responsibility | Key Files |
|-------|----------------------|-----------|
| **epiroc-coding** | Code standards, TS nomenclature, base patterns | `*.ts`, `*.tsx`, `package.json` |
| **epiroc-api** ⭐NEW | REST layers, transaction boundaries, DB adapter contracts & Cache Policy | `server/routes/`, `server/controllers/`, `server/services/`, `server/db/` |
| **epiroc-api** (ext.)| Session & Maintenance API + WebSocket | `server/services/socketManager.ts`, `server/services/maintenanceService.ts`, `server/controllers/sessionController.ts` |
| **epiroc-workflows** ⭐NEW | Ticket & approval business logic | `ticket_*`, `approval_*` tables, `server/services/` |
| **epiroc-security** ⭐NEW | SSO, autenticación headers, tokens, ABAC tickets | `users`, `*_middleware*`, `ProtectedRoute`, session |
| **epiroc-roles-matrix** ⭐NEW | Gobierno de roles modulares, visibilidad (`role_pages`), matriz modular | `roles`, `role_pages`, `users_workspace`, `adminController.ts` |
| **epiroc-i18n** ⭐NEW | Multilingual EN/ES/PT/SV | `languages`, columns `_en/_es/_pt/_sv` |
| **epiroc-ux** | App layout, sidebar, routing, WorkspaceLayout | `client/src/components/`, `client/src/pages/`, `App.tsx` |
| **epiroc-ui** | Styling, official colors, themes, typography | `client/src/index.css`, Tailwind settings |
| **epiroc-components** | Reusable React component library (30+ catalog) | `client/src/components/` |
| **epiroc-mockup-data** | Schema & seed data for DuckDB | `schema.sql`, `init_values.sql`, `server/db/regen.ts` |
| **epiroc-debugging** | Issue resolution, cleanup, verification | All files |
| **epiroc-qa** | Contract/regression, authorization, dual-engine, bootstrap and UI verification | `qa_test_plan.md` |
| **epiroc-review** | Skill evolution, feedback integration | All SKILL.md files |
| **prompt-architect** | Structures detailed prompts before tasks | `.agents/workflows/` |
| **databricks-cost-saver** | Databricks cost optimization | Databricks SQL, clusters |
| **skill-creator** | Creates/modifies skills following Antigravity standard | `.agents/skills/*/SKILL.md` |
| **epiroc-chrome-devtools** ⭐NEW | Browser automation, visual testing & QA via MCP | `.agents/skills/epiroc-chrome-devtools/SKILL.md` |
| **epiroc_archify** ⭐NEW | Visualización de arquitectura, workflows y mapas interactivos (HTML/SVG) | `.agents/skills/epiroc_archify/` |
| **epiroc-documenter** ⭐NEW | Documentación técnica (código/BD/APIs) y funcional (manuales paso a paso). Trazabilidad dual (código->UI) y protocolo HALT por inconsistencias | `docs/`, `*.tsx`, `*.ts`, `schema.sql` |
| **epiroc-doc-publisher** ⭐NEW | Maquetación y exportación de Markdown a DOCX (Word) y PDF con identidad visual corporativa Epiroc (colores, fuentes, portada, revisiones) | `docs/exports/`, `*.md` |

⭐NEW = Skills creadas para cubrir gaps de Logistech

## Project Directory Structure

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

## Dynamic Session & Authentication Architecture (MANDATORY)

To support multiple users and role-based access, the ecosystem enforces a **Dynamic Session Pattern**:

1. **Identity Retrieval**: User email MUST be retrieved via `req.headers['x-user-email']` or proxy SSO.
2. **Session Initialization**: Express API backend loads the user's entities and roles from the DuckDB database.
3. **Session Store**: User context is propagated to the React client and stored in a React Context/State provider.

> [!CAUTION]
> **PRODUCTION DEPLOYMENT WARNING (TEST ONLY ASSETS):**
> All files, endpoints, and interceptors created to simulate SSO/impersonation (such as `eliminar_MockLogin.tsx`, the `/api/auth/mock-users` endpoint, the global fetch interceptor in `main.tsx` injecting `X-User-Email`, and simulator notices in `Home.tsx`/`Header.tsx`) **MUST NEVER GO TO PRODUCTION**.
> Before deploying or shipping:
> 1. Delete all assets prefixed with `eliminar_` (e.g., `client/src/pages/eliminar_MockLogin.tsx`).
> 2. Remove the `/mock-login` route and lazy import from `client/src/App.tsx`.
> 3. Remove the fetch interceptor from `client/src/main.tsx`.
> 4. Remove simulator banners and quick links from `client/src/pages/Home.tsx` and `client/src/components/Header.tsx`.
> 5. Disable the mock users endpoint `/api/auth/mock-users` in `server/routes/index.ts` and `server/controllers/authController.ts`.


## Interaction Matrix

### Client-Server Data & Session Flow

```
1. Client (React) requests page/data
           │
           ▼
2. Axios/Fetch HTTP Request ───► Passes 'X-User-Email' in headers (SSO)
           │
           ▼
3. Express Server ───► Reads headers -> Queries database for entities & roles
           │
           ▼
4. Response with user details & permissions
           │
           ▼
5. React Context updates active user session & switches layout context
```

## Coordination Rules

### Rule 1: Coding Always First
**epiroc-coding** defines the TypeScript types, base patterns (JSON safe parse, user-by-ID, SQL binding), and delegates to specialized skills. It is the entry point that activates first on any code interaction.

### Rule 2: Component Modularity
Keep React UI components separated from SQL. On the backend, SQL belongs in domain services/repositories behind the database adapter; routes/controllers do not add direct DB calls. Treat existing direct-SQL controllers as legacy exceptions and migrate them incrementally.

### Rule 3: Domain Skill Activation (NEW)
When working on business logic, the agent MUST activate the corresponding domain skill:

| Si la tarea involucra... | Skill a activar |
|--------------------------|-----------------|
| Endpoints, controllers, services | **epiroc-api** |
| Tickets, aprobaciones, SLA, ruteo | **epiroc-workflows** |
| Auth, SSO, tokens, headers de identidad | **epiroc-security** |
| Roles por módulo, visibilidad, role_pages, matriz modular | **epiroc-roles-matrix** |
| Traducciones, idiomas, locales | **epiroc-i18n** |
| Documentar flujos, crear manuales de usuario o especificaciones técnicas | **epiroc-documenter** |
| Exportar o maquetar a Word (DOCX) o PDF con marca corporativa | **epiroc-doc-publisher** |

### Rule 4: No Overlap
Each skill has a focused scope. **epiroc-coding** sets base standards but does NOT duplicate domain logic — it delegates to **epiroc-api**, **epiroc-workflows**, **epiroc-security**, **epiroc-roles-matrix**, **epiroc-i18n**.

### Rule 5: Skill Reuse Before Creation
Before creating a new skill or component, consult **epiroc-components** (catalog of 30+) and the skill registry. Extend, don't duplicate.

### Rule 6: Cache Policy Compliance
All REST endpoints, database query caching, and frontend data fetching must adhere strictly to the Cache Policy defined in **epiroc-api** (data volatility classification, in-memory TTL, HTTP Cache-Control headers, and invalidation rules).

## Data Layer Architecture

### Two-Source Data Model
- **Master Data**: `schema.sql` (Structure) and `init_values.sql` (Values).
  - `schema.sql` MUST contain ONLY DDL statements.
  - `init_values.sql` MUST contain ONLY DML statements.
- **Transactional & Seeding Data**: Populated strictly during database bootstrapping (`npm run db:regen` / `server/db/regen.ts`).

---

### [2026-07-20] Cache Policy Integration
- Se incorpora la referencia a la Política de Cache en `epiroc-api` y se añade la regla de coordinación **Rule 6: Cache Policy Compliance**.

---

### [2026-05-19] Stack Update: Full Node & TypeScript Architecture
- Replaced Python/Dash/SSO patterns with Node.js, Express, React, and DuckDB session architecture mapping.
- Updated skill key files to watch TypeScript, React, and SQL files.

---

### [2026-07-02] Major Update: Logistech Domain Skills Expansion
- **4 skills nuevas creadas** para cubrir gaps críticos del modelo de negocio:
  - `epiroc-workflows`: Sistema de tickets (POOL_LIDER/DIRECTO_RESOLUTOR, SLA) y motor de aprobaciones multi-nivel (delegación, límites 1-3, conversión SEK).
  - `epiroc-api`: Arquitectura REST de 3 capas con la version Express fijada en los manifests/lockfiles y TypeScript.
  - `epiroc-security`: Modelo completo de auth SSO, RBAC por páginas, ABAC para tickets, delegación de aprobación.
  - `epiroc-i18n`: Internacionalización EN/ES/PT/SV con columnas multilingües y formato Intl.
- **Skills mejoradas** con contenido real del proyecto:
  - `epiroc-components`: Catálogo de 30+ componentes reales (Modal, Stepper, FormBuilder, TicketActions, PersonSelect, etc.).
  - `epiroc-ux`: Estructura real de rutas de App.tsx (10 rutas con pageIds, WorkspaceLayout, ProtectedRoute).
  - `epiroc-mockup-data`: Inventario completo de tablas del schema.sql (8 secciones) con requisitos de seed.
  - `epiroc-coding`: Dependencias actualizadas para delegar a las skills nuevas.
- **Ecosystem actualizado**: Diagrama, tabla de responsabilidades y 2 coordination rules nuevas.
- Total skills: 12 → 16.

---

### [2026-08-20] Skill Creation: Browser Automation
- Creada la skill `epiroc-chrome-devtools` para estandarizar el uso de Chrome DevTools MCP en interacción y testing visual.
- Actualizado el ecosistema y la tabla de responsabilidades (Total skills: 16 → 17).

---

### [2026-09-21] Improvement: Module Homogeneity Orchestration

**Issue:** Cambios de estándar visual en un módulo (ej. migrar headers manuales a `PageHeader`) no se propagaban a `rules.md`/`epiroc-ux`, permitiendo regresiones en otros módulos.

**User Feedback:** "no veo en el plan cambios en las skills o reglas para evitar que esto pase nuevamente"

**Root Cause:** `epiroc-ecosystem` no tenía regla explícita de sincronización orquestada (Mandatory Orchestrator Sync).

**Fix Applied:**
- Añadida **Rule 7: Mandatory Orchestrator Sync** — todo cambio de estándar en skill hija debe reflejarse en `rules.md` + skill orquestadora.
- Referencia cruzada a nueva **Regla 19 Homogeneidad de Módulos** en `rules.md`.
- Actualizado diagrama de coordinación para incluir verificación de homogeneidad en handoff de `epiroc-qa`.

**Impact:** Previene divergencia futura; cualquier evolución local se vuelve globalmente obligatoria.

### Rule 7: Mandatory Orchestrator Sync (NEW)
Cualquier cambio en estándar de módulo (PageHeader, colores, diálogos, estilos) en una skill hija **DEBE** sincronizarse en:
1. `rules.md` (nueva Regla 19)
2. Skill orquestadora (`epiroc-ecosystem` + `epiroc-ux`)
3. Verificación `epiroc-qa` handoff checklist

Fallo en sincronizar resulta en comportamiento inconsistente del agente.

### Rule 8: Cross-Cutting Module Authority (Centro de Control Consolidado)
El workspace Administración (workspace 7, `path: /admin-panel`) tiene **autoridad transversal absoluta**. Es el **único** lugar válido para administración general de Logistech (usuarios, roles, entidades, monedas, reinicio/mantenimiento de BD, sesiones activas, auditoría global). Queda **PROHIBIDO** crear mantenedores globales en módulos de negocio (Tickets, Projects, Redistribuciones, DIFOT) — allí solo se permiten submenús "Configuración" de dominio específico (ej. categorías de tickets, feriados Gantt, matrices DIFOT). El meta-módulo vive fuera de `WorkspaceLayout` con `SocketContext` + `MaintenanceBanner` como infraestructura global y concentra definitivamente: `Session Manager (700)`, `Mantenimiento (701)`, `Master Data (703)` y `Database Reset (704)` bajo el grupo `Configuración (702)`. Page IDs 700-799 reservados exclusivamente para `workspace_id = 7` con prefijo `/admin-panel/*`.

### Rule 9: Architecture Reliability Sync (MANDATORY)

For API, persistence, authorization, role-matrix, workflow, bootstrap, scalability, or architecture-diagram standards, the owning skill MUST be synchronized with `.agents/rules/rules.md` and this orchestrator. `epiroc-qa` must add a test gate for every new invariant; `epiroc-coding` and `epiroc_archify` must match the installed manifests/lockfiles and observed code. Record the reason and impact in each changed skill's evolution log.

Minimum architecture gates:

1. No new SQL/DB adapter imports in routes or controllers; grandfathered violations are listed and not expanded.
2. `epiroc-workflows` treats related ticket/approval writes as one tested transaction on one connection; external notifications occur after commit.
3. Database adapter changes pass contract tests on both DuckDB and PostgreSQL/Lakebase.
4. Required bootstrap failures keep readiness negative; destructive bootstrap/reset tests use only isolated disposable targets.
5. Every changed API endpoint has an explicit public/protected classification and negative authorization tests; UI guards do not replace backend checks.
6. Cache over mutable or identity-dependent data has an explicit TTL/invalidation/isolation policy and a regression test.
7. Architecture refactors start from characterization tests and preserve routes, status/payload contracts, authorization and business transitions.
8. `epiroc_archify` verifies package manifests, lockfiles and code entry points; diagrams label observed behavior separately from proposed architecture.

---

### [2026-09-29] Architecture Reliability Orchestration

**Issue:** The architecture review identified recurring risks that were not converted into aligned always-on rules, API/security guidance and QA gates. Some skill statements also disagreed with installed runtime/adapter behavior.

**User Feedback:** Add detailed implementation phases and update rules or skills so the detected errors do not recur.

**Fix Applied:** Added Rule 9, synchronized layer/transaction/authorization/bootstrap/dual-engine gates across `rules.md`, `epiroc-api`, `epiroc-workflows`, `epiroc-security`, `epiroc-roles-matrix`, `epiroc-coding` and `epiroc-qa`, and corrected outdated Express/placeholder assumptions in API and architecture-diagram guidance.

**Impact:** Architecture decisions now have a global enforcement path and a corresponding verification requirement instead of remaining suggestions in a one-off plan.

---

### [2026-09-28] Skill Creation: Roles Matrix & Modular Access Control
- Creada la skill `epiroc-roles-matrix` para gobernar el estándar de roles por módulo (`roles.workspace_id`), visibilidad de navegación (`role_pages`), gates de acción y el sistema de asignación rápida por módulo en la Ficha de Usuario.
- Se especializa la responsabilidad: `epiroc-security` mantiene SSO y tokens, mientras que `epiroc-roles-matrix` asume la matriz de roles y permisos modular.
- Total skills registradas: 18 → 19.

---

### [2026-10-02] Skill Creation: epiroc-documenter (Documentador Integral Logistech)
- Creada la skill `epiroc-documenter` para auditar y documentar flujos de Logistech tanto a nivel técnico (código, APIs, BD, fórmulas, restricciones) como funcional (manuales paso a paso para usuario final).
- Incorpora: Triage obligatorio inicial, trazabilidad dual (código -> UI), y protocolo HALT ante detección de cualquier inconsistencia o error (principio de responsabilidad compartida con `epiroc-debugging`).
- Total skills registradas: 19 → 20.

---

### [2026-10-02] Skill Creation: epiroc-doc-publisher (Maquetador y Publicador Corporativo)
- Creada la skill `epiroc-doc-publisher` para transformar documentos Markdown (`.md`) en formatos ejecutivos DOCX (Word) y PDF aplicando la identidad visual oficial Epiroc (colores, fuentes Raleway, portada institucional, ficha de autoría y tabla de revisiones).
- Se conecta de forma natural como pipeline de salida de `epiroc-documenter`, `epiroc-qa` y `epiroc_archify`.
- Total skills registradas: 20 → 21.




