---
name: epiroc-coding
description: Maintains coding standards, best practices, and technological stack consistency for Epiroc Node.js and TypeScript applications. Ensures code quality, proper nomenclature, and up-to-date dependencies. Activates on every coding interaction to maintain coherence across all TypeScript, React, Express, and Databricks SQL code. Manages package.json patterns and file organization.
---

# Epiroc Coding Standards Skill

Maintains coding excellence across all Epiroc Node.js and TypeScript applications by enforcing consistent standards, nomenclature, and best practices for TypeScript, React, Express, and Databricks integration.

## When to use this skill

- Writing or modifying any TypeScript/React (`.ts`, `.tsx`) code
- Writing or modifying backend Express routers, controllers, or services
- Working with Databricks integration or SQL queries
- Managing npm dependencies and package.json configurations
- Setting up project structure
- Managing gitignore configurations
- Code review and refactoring
- Trigger keywords: typescript, react, express, node, coding, function, import, dependency, package.json, tsconfig, eslint, prettier

## Dependencies

This skill coordinates with all other Epiroc skills:

- **epiroc-ux**: For layout structure and component conventions
- **epiroc-ui**: For Tailwind/CSS organization
- **epiroc-components**: For React component patterns
- **epiroc-debugging**: For error handling and diagnostic patterns
- **epiroc-qa**: For feature verification and delivery
- **epiroc-api**: For REST endpoint architecture (routes/controllers/services)
- **epiroc-security**: For SSO resolution, RBAC/ABAC and permission patterns
- **epiroc-workflows**: For ticket and approval business logic
- **epiroc-i18n**: For multilingual data (EN/ES/PT/SV) patterns
- **epiroc-mockup-data**: For schema and seed data rules

## Technology Stack

### Core Technologies

| Technology | Version | Purpose                            |
| ---------- | ------- | ---------------------------------- |
| Node.js    | 20+     | **MANDATORY** - Runtime            |
| TypeScript | 5.x     | Strict type safety and compilation |
| React      | 19+     | Frontend client UI framework       |
| Express    | Version pinned in `server/package.json` and lockfile (currently major 4) | Backend server routing and APIs |
| Vite / TSX | -       | Build tool and dev watch execution |
| DuckDB     | 1.4+    | Persistent local storage database  |

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

## Session Management & Authentication

### User Identity Retrieval

User identity MUST be retrieved from the request headers sent by Databricks or proxy SSO.

| Header                           | Value / Type                | Purpose                                      |
| -------------------------------- | --------------------------- | -------------------------------------------- |
| `x-forwarded-email`              | `jaising.pasten@epiroc.com` | Primary user email (Main source of identity) |
| `x-forwarded-preferred-username` | `jaising.pasten@epiroc.com` | Backup OIDC username                         |
| `x-forwarded-access-token`       | JWT                         | User access token for on-behalf-of API calls |
| `x-forwarded-user`               | Databricks Numeric ID       | e.g. `7003906323703297@1520628986248469`     |

#### Real-World Databricks App Headers Schema Reference

```json
{
  "sso_headers": {
    "user-agent": "Mozilla/5.0 ...",
    "x-databricks-org-id": "1520628986248469",
    "x-databricks-workspace-dp-region": "AZURE_WESTEUROPE",
    "x-forwarded-access-token": "eyJraWQiOi...",
    "x-forwarded-email": "jaising.pasten@epiroc.com",
    "x-forwarded-preferred-username": "jaising.pasten@epiroc.com",
    "x-forwarded-user": "7003906323703297@1520628986248469"
  },
  "forwarded_headers": {
    "x-forwarded-for": "...",
    "x-forwarded-host": "logistech-1520628986248469.9.azure.databricksapps.com",
    "x-forwarded-proto": "https"
  }
}
```

#### Fallback and Authentication Pattern

1. Always attempt to read headers in order: `x-forwarded-email` → `x-forwarded-preferred-username` → `x-user-email`.
2. Hardcoded fallback values (e.g. `'jaising.pasten@epiroc.com'`) MUST ONLY be used when not in production (`process.env.NODE_ENV !== "production"`).
3. Database values MUST be bound through the DB adapter, never interpolated. Use the placeholder notation supported by the current adapter; test both DuckDB and PostgreSQL before changing placeholder translation.

```typescript
// Shared authentication middleware helper; do not call once per route/controller
import { Request, Response } from "express";

export function getSessionUser(req: Request): string | undefined {
  // 1. Read headers in priority sequence
  const email =
    (req.headers["x-forwarded-email"] as string) ||
    (req.headers["x-forwarded-preferred-username"] as string) ||
    (req.headers["x-user-email"] as string);

  if (email) {
    return email;
  }

  // 2. Local/development fallback is ONLY permitted outside of production
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.DB_TYPE === "databricks";
  if (!isProduction) {
    return "jaising.pasten@epiroc.com";
  }

  return undefined;
}
```

The shared authentication middleware calls this resolver once, authenticates the identity and attaches the numeric principal to the request. Authorization guards and controllers reuse that principal; they do not re-read or reinterpret SSO headers.

### Session Data Structure

The backend user session response MUST contain the complete user context, fetched via the database service layer.

```typescript
interface UserSession {
  userId: number;
  email: string;
  entityCode: string; // Default active entity
  rol: string; // Default active role ID
  entities: Array<{
    // Authorized entities with roles
    entity: string;
    description: string;
    roles: Array<{ id: number; name: string }>;
  }>;
  permissions: Record<string, boolean>; // Pre-calculated permissions for active role
  isAuthenticated: boolean;
  isInitialized: boolean;
}
```

## Nomenclature Standards
- Use numeric `role_id` values for every authorization decision, role comparison, API contract, and permission gate.
- `roles.name` is display-only. Never authorize by comparing role names or prefixes.
- Session contracts must expose role IDs (`user.role_ids` and `{ id, name }` assignments); render `name` only as user-facing text.
- Keep the global administrator ID distinct from module administrator IDs; do not infer global admin status from a module role.

### TypeScript & JavaScript Naming

Use `camelCase` for all TypeScript variables, parameters, functions, and properties. Classes, interfaces, types, and React components MUST use `PascalCase`.

### React Component Files

Files containing React components MUST use the `.tsx` extension. File names should ideally match the primary export in `PascalCase` (e.g. `Sidebar.tsx`). Pure utility/service files MUST use `.ts`.

## Code Style Guidelines

### Strict Typing

**MANDATORY** for all new functions, interfaces, and classes. Do NOT use `any` type. Define explicit types or interfaces.

```typescript
// SAFE PATTERN
interface Part {
  partNumber: string;
  description: string;
  price: number;
}

export function formatPartDescription(part: Part): string {
  return `${part.partNumber} - ${part.description}`;
}
```

### ESLint & Prettier

Running linting is **MANDATORY** for every TS/TSX file creation or modification.

```bash
# Run lint check
npx eslint client/src/components/Sidebar.tsx

# Run and automatically fix issues
npx eslint client/src/components/Sidebar.tsx --fix
```

## Data Layer Architecture

### Two-Source Data Model

- **Master Data**: `schema.sql` (Structure/DDL) and `init_values.sql` (Values/DML).
  - `schema.sql` MUST contain ONLY DDL statements (`CREATE TABLE`, `CREATE SEQUENCE`, etc.). No `INSERT` statements allowed.
  - `init_values.sql` MUST contain ONLY DML statements (`INSERT`, `UPDATE`, etc.). No `CREATE TABLE` allowed.
  - `schema.sql` / `schema_databricks.sql` and their seed files are the current baseline sources. Before changing schema workflow, inspect both `server/bootstrap/migrations.ts` and `server/db/regen.ts`: startup currently contains legacy additive `ALTER TABLE` compatibility steps. Do not add ad hoc schema mutation paths or run destructive regeneration against a shared database. Reconcile this legacy behavior through the approved bootstrap plan rather than silently changing runtime behavior.
- **Transactional & Dynamic Data**: Populated during DB bootstrap through the TS script (`server/db/regen.ts` using SQL loading).

### User Reference & Database Normalization Patterns

- **Numeric IDs (INTEGER)**: All tables that reference a user (creator, actor, resolver, approver, etc.) MUST declare columns as `INTEGER` referencing `users(id)` (e.g., `requested_by_id`, `resolved_by_id`, `actor_id`).
- **NO Email References**: It is strictly forbidden to store email strings in operational tables as primary or foreign key relationships.
- **SSO Resolution Pattern**: Inbound SSO identity must be resolved through the shared authentication path, then mapped to `users.id` before operational writes. Bind the email parameter through the DB adapter using syntax supported by both configured drivers; never interpolate it into SQL.

### Hybrid Database & JSON Handling (DuckDB vs. Databricks/PostgreSQL)

The application operates as a **hybrid system**: it uses **DuckDB** for local development, and **Databricks PostgreSQL (Lakebase)** for production. This creates a critical JSON parsing constraint:

- **DuckDB (Local)**: Structured JSON columns (e.g. `schema_json`, `data_json`) are returned by the DuckDB Node driver as **strings**. To access their properties in TypeScript/Node, you MUST call `JSON.parse()`.
- **Databricks/PostgreSQL (Production)**: The `pg` database driver automatically parses JSON/JSONB columns and returns them as **pre-parsed JavaScript objects/dictionaries**. Calling `JSON.parse()` on these pre-parsed objects will fail, throwing a fatal `SyntaxError` (e.g. "Unexpected token o in JSON...") and causing an HTTP 500 error.
- **Safe Handling Pattern**: Always check the type of the JSON column before parsing:
  ```typescript
  const schema =
    typeof row.schema_json === "string"
      ? JSON.parse(row.schema_json)
      : row.schema_json;
  const formData =
    typeof row.data_json === "string"
      ? JSON.parse(row.data_json)
      : row.data_json;
  ```

## Strict Rules

### Architecture Consistency Safeguards

- Before adding framework-specific code or changing conventions, verify installed versions from the relevant package manifest and lockfile. Update the owning skill and `.agents/rules/rules.md` when the verified runtime differs from documentation; do not perform an implicit dependency upgrade.
- New API routes/controllers do not own SQL. Keep transport in routes/controllers, business use cases in services, and persistence in services/repositories. Existing direct-SQL controllers are legacy exceptions; do not expand them during adjacent work.
- A use case that writes related records as one business action must use a tested transaction on one connection in DuckDB and PostgreSQL. Keep notifications/external effects after commit and add rollback/failure-path tests.
- Always use bound SQL parameters. Placeholder syntax is an adapter contract: preserve the current convention in the touched module until cross-driver tests justify standardizing it.
- Refactors preserve API contracts, authorization and workflow semantics. Add characterization coverage before extraction; destructive DB verification only uses an isolated disposable target.

## Evolution Log

### [2026-09-29] Runtime and Architecture Guardrails

**Issue:** Framework and SQL parameter guidance did not match the installed runtime and dual-engine adapter.

**User Feedback:** The architecture review requested detailed implementation phases and durable safeguards against recurring findings.

**Fix Applied:** Manifests/lockfiles are the runtime source of truth; SQL stays out of new controllers; multi-write flows require tested transactions; schema work must account for existing bootstrap behavior and use isolated QA databases.

**Impact:** Prevents stale version assumptions, partial business writes and unsafe/destructive verification from being normalized as standards.

- **Think Before Coding**: Explicitly declare assumptions and clarify ambiguities before writing code.
- **Simplicity First**: Write minimal code. No speculative abstractions. If logic exceeds 500 lines for a simple problem, rewrite.
- **Surgical Changes**: Touch ONLY what is necessary. Each diff line must be traceable to the request. No drive-by formatting or cosmetic refactors.
- **Strict TypeScript**: No implicit `any`. Use strict lint checks.
- **User Reference Integrity**: Reference users ALWAYS by `INTEGER` ID and never by email strings in database relations. Resolve SSO identity once through the shared authentication boundary, then pass the authenticated principal/ID to controllers and services. Expose compatibility aliases (e.g. `u.email as requested_by`) only where required by existing frontend contracts.
- **Zero Junk**: Delete all temporary test files and `qa_test_plan.md` after verification.
- **Prefixing Temporary Files**: Any temporary, mock, test, or debugging file not intended for production MUST carry the `eliminar_` prefix (e.g., `eliminar_MockLogin.tsx`) as a secondary safety net for the Zero Junk policy.
- **No Orphan Console Logs in Production**: Using `console.log` statements is perfectly fine for local debugging and testing, but they must be cleaned up and removed before final delivery so that no unsupervised logs reach production and clutter backend/server logs.
- **Master Data Notification**: Inform the user before creating new master tables or altering SQL files.
- **Admin Navigation**: Must be nested under "Configuración" -> "Master data".
- **Prohibición de Estilos Inline**: No utilices estilos inline (`style={{ ... }}`) en archivos TSX. Usa en su lugar las clases CSS correspondientes del sistema de diseño y componentes documentados en `client/src/pages/stylesheet`.
- **Nuevas Tablas - Checklist de Integración**: Al agregar una tabla nueva a `schema.sql`, verificar:
  1. La tabla está definida en `schema.sql` con su DDL completo.
  2. La tabla está replicada en `schema_databricks.sql` con los mismos campos y sintaxis compatible (`BIGINT GENERATED BY DEFAULT AS IDENTITY`, `CONSTRAINT` explícitos).
  3. La tabla está registrada en `drop_tables_databricks.sql` con su sentencia `DROP TABLE IF EXISTS <nombre_tabla> CASCADE;` en orden de dependencias FK.
  4. Si tiene seed, los INSERTs están en `init_values.sql` (clasificación MASTER o PRUEBA).
  5. Si es MASTER, duplicar el seed a `init_values_databricks.sql` con `ON CONFLICT DO NOTHING`.
  6. La tabla está registrada en el array `tables` del módulo correspondiente en `server/services/dbResetService.ts` (con orden DELETE inverso a FK).
  7. Si la tabla es transaccional/operativa, agregarla a la lista negra de Databricks en `getTablesInfo()` y `executeTableReset()`.
  8. Ejecutar `npm run guard:databricks` para verificar que no hay fugas de datos de prueba.

---

### [2026-05-19] Stack Update: Full Node & TypeScript Migration

- Completely removed Python and Dash styling/nomenclature/SSO rules.
- Set standards for Node.js, Express, React, TypeScript, and DuckDB (`server/db/regen.ts`).
- Enforced mandatory ESLint running on `.ts` and `.tsx` file changes.

---

### [2026-07-02] Improvement: Integración con Skills Nuevas de Logistech
- Actualizada la sección de dependencias para incluir las 4 skills nuevas:
  - **epiroc-api**: Arquitectura REST de 3 capas (routes/controllers/services).
  - **epiroc-security**: Resolución SSO, RBAC/ABAC, delegación de aprobación.
  - **epiroc-workflows**: Lógica de tickets (routing POOL_LIDER/DIRECTO_RESOLUTOR, SLA) y aprobaciones multi-nivel.
  - **epiroc-i18n**: Modelo multilingüe EN/ES/PT/SV con columnas `_en/_es/_pt/_sv`.
- Esta skill ahora delega a skills especializadas en lugar de contener toda la lógica.
- Patrones transversales (JSON safe parse, user-by-ID, SQL parameters enlazados) se mantienen aquí como estándares base.
