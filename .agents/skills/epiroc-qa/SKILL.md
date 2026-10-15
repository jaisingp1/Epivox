---
name: epiroc-qa
description: Conducts systematic quality assurance for Epiroc Node.js and TypeScript applications. Ensures all features follow a strict "Test Plan" before delivery, including backend Express APIs, React frontend components, and database integrity. Mandates the absence of console errors and styling inconsistencies.
---

# Epiroc QA Skill

Ensures the highest quality and reliability standards for Epiroc Node.js and TypeScript applications by enforcing rigorous testing protocols and verification workflows.

## When to use this skill

- After creating or modifying any Express API route, controller, service, or React component.
- Before delivering a task to the user.
- To verify backend logic and SQL integration.
- To verify frontend integrity (no browser console errors, responsive design).
- To ensure full flow completeness (start-to-finish workflows).
- **MANDATORY ACTIVATION**: Any request containing "qa", "test", or "verify" MUST trigger this skill's protocol (Test Plan) before execution.
- Trigger keywords: qa, haz un qa, test, verify, check, quality, validation, flow, debug, errors, eslint, prettier, tsx, ts

## QA Protocol: The Test Plan

Every new creation or modification MUST follow a temporary Test Plan artifact (`docs/qa_test_plan.md`). Share the plan with the user and execute the applicable checks before finalizing. Delete a plan created for the current task when QA is complete; retain it only when the user explicitly requests a permanent plan. If a check is blocked or unavailable, report the gap in the final response instead of leaving an orphan plan in the repository. Never overwrite or delete a pre-existing user-owned plan.

### 1. Preparation
The `epiroc-coding` skill is responsible for generating the initial test plan, but `epiroc-qa` must refine and execute it.

### 2. Execution Checklist

| Category | Check Item | Verification Method |
|----------|------------|---------------------|
| **Backend** | API Endpoints | Run backend tests or inspect console logs during API requests |
| **Backend** | Data processing logic | Validate returned JSON payload structures and contents |
| **Backend** | **ESLint & Prettier Compliance** | Run `npx eslint <file_path>` and check Prettier formatting on all modified files |
| **Backend** | **TypeScript Type Checking** | Run `npm run typecheck` to confirm no TS compilation errors exist |
| **Backend** | **Production Logs (Databricks Apps)** | Check container logs in cloud: `databricks apps logs logistech --profile DEFAULT --tail-lines 100` |
| **Frontend** | No console errors | Use `chrome-devtools_list_console_messages` to inspect browser console logs |
| **Frontend** | Visual verification | Use `chrome-devtools_take_screenshot` to capture and verify UI rendering |
| **Frontend** | Styling consistency | Use `chrome-devtools_take_screenshot` + `chrome-devtools_take_snapshot` to verify Tailwind/CSS parameters and contrast |
| **Frontend** | Performance | Use `chrome-devtools_performance_start_trace` and `chrome-devtools_performance_analyze_insight` to detect lag and Core Web Vitals issues |
| **Frontend** | Network requests | Use `chrome-devtools_list_network_requests` and `chrome-devtools_get_network_request` to verify API calls and responses |
| **Flow** | Logic sequence | Verify the path from input to final result |
| **Data** | **Reseed Logic** | Verify bootstrap only against an explicitly isolated, disposable database/schema; never run destructive regen against a shared or production target |
| **Hygiene** | **Process Termination** | Terminate all background processes via `send_command_input(Terminate=True)` |

### Backend Architecture Regression Gates

For changes to API, persistence, bootstrap, or business workflows, include the applicable checks below in the task test plan. Do not mark an unrun or unavailable check as passed.

| Risk | Required evidence |
|---|---|
| Multi-row business mutation | Inject a failure after each relevant write; verify rollback leaves ticket/approval state, timeline and audit/history mutually consistent. Verify external notifications are not sent before commit. |
| DuckDB/PostgreSQL adapter behavior | Run adapter/transaction contract tests against both engines using isolated fixtures. Cover bound parameters, JSON values, integer/decimal mapping, commit and rollback. |
| Authorization | For every changed route, verify the documented public/protected classification, unauthenticated response, insufficient role/page response and relevant ABAC/entity isolation. A UI `ProtectedRoute` check is not API evidence. |
| Bootstrap/readiness | Test fresh, existing, partially initialized and required-step-failure startup. A required bootstrap failure must not be reported ready. |
| Cache | Mutate each cached catalog in a test and prove invalidation/expiry makes the new value visible. |
| Architecture boundary | New routes/controllers have no SQL/DB imports; any pre-existing exception is named and not expanded. |

If the repository has no test runner or isolated target for a required gate, record the gap and the exact manual verification needed. Do not invent a successful result or run destructive commands against an ambiguous database.

## Chrome DevTools MCP — Mandatory UI Verification Tool

All frontend/UI verification MUST be performed using the **Chrome DevTools for Agent MCP** tools. This is the only acceptable method for UI testing in Logistech.

### Required MCP Tools for QA

| QA Task | MCP Tool | Description |
|---------|----------|-------------|
| **Visual Verification** | `chrome-devtools_take_screenshot` | Capture full page or element screenshots to verify UI rendering |
| **Console Errors** | `chrome-devtools_list_console_messages` | List all console messages (errors, warnings, logs) |
| **Specific Error** | `chrome-devtools_get_console_message` | Get details of a specific console message by ID |
| **Network Inspection** | `chrome-devtools_list_network_requests` | List all XHR/fetch requests to verify API calls |
| **Request Details** | `chrome-devtools_get_network_request` | Inspect request/response payload of a specific API call |
| **Performance** | `chrome-devtools_performance_start_trace` | Record performance trace to detect lag |
| **Performance Analysis** | `chrome-devtools_performance_analyze_insight` | Analyze specific performance insights (LCP, CLS, etc.) |
| **Lighthouse Audit** | `chrome-devtools_lighthouse_audit` | Run accessibility, SEO, and performance audits |
| **Page Snapshot** | `chrome-devtools_take_snapshot` | Get accessibility tree snapshot of the page |
| **DOM Inspection** | `chrome-devtools_evaluate_script` | Execute JavaScript in the page to inspect state |
| **Navigation** | `chrome-devtools_navigate_page` | Navigate to specific URLs or routes |
| **Form Testing** | `chrome-devtools_fill_form` | Fill and submit forms for end-to-end testing |
| **Page State** | `chrome-devtools_list_pages` | List all open browser pages |

### QA Workflow with Chrome DevTools MCP

1. **Start the app**: Run `npm run dev` to launch server and client.
2. **Navigate**: Use `chrome-devtools_navigate_page` to open the target page.
3. **Visual Check**: Use `chrome-devtools_take_screenshot` to verify the UI renders correctly.
4. **Console Check**: Use `chrome-devtools_list_console_messages` with `types: ["error", "warn"]` to verify no errors.
5. **Network Check**: Use `chrome-devtools_list_network_requests` to verify API calls succeed (status 200).
6. **Performance Check**: Use `chrome-devtools_performance_start_trace` for critical flows.
7. **Cleanup**: Terminate all background processes before task completion.

## QA Best Practices Base

### Core Principles
1. **Execution by Objectives**: When verifying a fix, ensure the agent followed the "Test-Fail-Fix-Pass" cycle. No verification is valid without a reproducing test (e.g., a Vitest/Playwright test or verified steps).
2. **Never "Guess" Success**: If you didn't see it work, it doesn't work. **NO GHOST CHECKING:** Always use **Chrome DevTools MCP** tools (`take_screenshot`, `list_console_messages`, `get_console_message`) to visually verify UI and console output. Never check off "No console errors" without inspecting the browser console via MCP tools.
3. **Database Bootstrapping Safety**: Verify bootstrap from zero only against an explicitly isolated, disposable database/schema. `npm run db:regen` deletes/recreates the configured local DuckDB file; inspect its target first and never run destructive regeneration against a shared or production database. If isolation cannot be proven, do not execute it and report the gate as unverified.
4. **Clean Delivery**: The app must start without errors and the specifically modified flow must be perfect.
5. **Component Props Strictness**: React/TypeScript enforces strict prop types. Always verify TS type declarations and interface matchings to prevent compilation or runtime crashes.
6. **Background Process Cleanup**: After performing any verification that involves running the application in the background (e.g., using `run_command` with `npm run dev`), the agent MUST explicitly terminate the process once the verification is complete. Background processes must never be left running when a task turn is finalized or delivered.
7. **SSO Impersonation / Test Asset Cleanup**: Before validating a branch or PR for release/production, verify that all dynamic simulation/impersonation files and code blocks are fully disabled, removed, or cleaned up. None of the `eliminar_` prefixed files, `/api/auth/mock-users` endpoint, fetch interceptors injecting test headers, or UI simulator widgets should be shipped to production.
8. **No Orphan Console Logs in Production**: During QA, verify that temporary debug logs (`console.log`) used during troubleshooting have been completely cleaned up. They are acceptable during active debugging but must not remain unsupervised in production files to keep backend logs clean.
9. **QA Visual Bloqueante (Anti-Ghost)**: Ningún `TodoWrite` de Fase QA/UI puede pasar a `completed` sin evidencia MCP (`take_snapshot` + `take_screenshot` + `list_console_messages: error 0`). Si `mcp.chrome-devtools` no está expuesto, el todo permanece `in_progress` y se solicita al usuario: *"sin acceso a navegador, requiero que verifiques en http://localhost:5173/... y confirmes consola 0 errores"*. `db:regen` / `guard` / `tsc` no sustituyen verificación visual.

## Direct Verification Protocol for Databricks PostgreSQL (Lakebase)

When modifying schemas (`schema_databricks.sql`), seed scripts (`init_values_databricks.sql`), or backend queries for Databricks, validate first against an explicitly designated non-production sandbox. Production checks are read-only unless a separately approved change procedure authorizes a specific write. Never run the destructive cleanup recipe below against a shared or production database.

### 1. Connection & Authentication Architecture

Lakebase PostgreSQL Gateway uses standard PostgreSQL wire protocol on port 5432, but requires a temporary OAuth Bearer token as the password instead of a static password.

* **Environment Parameters** (configured in `.env`):
  * `PGHOST`: Hostname of the Databricks Lakebase endpoint (e.g., `ep-*.database.westeurope.azuredatabricks.net`).
  * `PGPORT`: Port (defaults to `5432`).
  * `PGDATABASE`: Target database (defaults to `databricks_postgres`).
  * `PGUSER`: Developer SSO email (e.g., `jaising.pasten@epiroc.com`) or Databricks Service Principal ID.
  * `PG_SCHEMA`: Target application schema (e.g., `logistech`).
* **OAuth Token Acquisition**:
  * In local development, the OAuth access token is generated on-demand via the Databricks CLI:
    ```bash
    databricks auth token --profile DEFAULT
    ```
  * The returned JSON payload contains `.access_token`, which is passed directly as the `password` to the `pg` client/pool with `ssl: { rejectUnauthorized: false }`.

### 2. Live Dry-Run Methodology (`BEGIN ... ROLLBACK`)

This recipe deletes data inside a transaction and is permitted only on an explicitly designated disposable Databricks sandbox after verifying `PGHOST`, `PGDATABASE`, and `PG_SCHEMA`. A transaction is not approval to run destructive SQL against production; never use this recipe there. To test every SQL statement in `init_values_databricks.sql` or custom migrations:

1. **Open Client & Start Transaction**:
   ```javascript
   await client.query('BEGIN');
   ```
2. **Clean Dependent Tables in Inverse FK Order**:
   Before inserting new or regenerated master data, clear tables within the transaction. **Order matters** due to foreign key constraints:
   * **DIFOT Tables First** (depend on users/entities): `difot_action_plan`, `difot_respuesta_cliente`, `difot_auditoria_configuracion`, `difot_respuesta_opcion`, `difot_pregunta`, `difot_client_creation_requests`, `difot_assessment`, `difot_cliente`, `difot_categoria`, `difot_dimension`, `difot_assessment_version`, `difot_configuracion_semaforo`, `difot_system_config`.
   * **Redistributions & Projects**: `redistribution_notifications`, `scrap_surplus_records`, `redistribution_audit_logs`, `redistribution_backups`, `redistributions`, `projects_authorized_users`, `projects_baseline_tasks`, `projects_baselines`, `projects_task_dependencies`, `projects_tasks`, `projects_projects`.
   * **Customers & Approvals**: `customer_addresses`, `customer_contacts`, `customer_branches`, `customers`, `approval_history`, `approval_requests`, `approval_amount_fields`, `approval_limits`, `approval_delegations`.
   * **Tickets Config & Transactional**: `ticket_audit_log`, `ticket_templates`, `ticket_sla_monitor_logs`, `ticket_sla_monitor_config`, `ticket_user_supervisors`, `ticket_routing`, `ticket_user_category_roles`, `ticket_subcategories`, `ticket_entity_category`, `ticket_categories`, `ticket_timeline`, `ticket_attachments`, `ticket_comments`, `ticket_header`, `ticket_formularios_config`.
   * **Auth & Core Master Data**: `users_workspace`, `role_pages`, `user_roles`, `users`, `ticket_status_actions`, `statuses`, `roles`, `divisions`, `entity_currencies`, `entities`, `conversion_rates`, `countries`, `entity_types`, `regions`, `currencies`, `pages`, `workspaces`, `languages`.
3. **Execute Target Script Statements**:
   Parse and execute each statement sequentially. Any syntax error, duplicate key (`pk_*`), or constraint violation will immediately fail with the exact line/statement.
4. **Safely Roll Back**:
   ```javascript
   await client.query('ROLLBACK');
   ```
   Ensures zero traces are left in the database.

### 3. Permissions Constraint: DDL (`DROP TABLE`) vs DML (`DELETE / INSERT`)

* **Table Ownership**: Tables created by the Databricks App in Azure are owned by the Service Principal (e.g., `"db453113-21f1-4d7b-ba40-7e1d00f67b3d"`).
* **Developer Permissions**: Personal user credentials (`jaising.pasten@epiroc.com`) have full DML permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) across the `logistech` schema, but PostgreSQL strictly forbids `DROP TABLE` unless executed by the table owner (returns error `42501: must be owner of table`).
* **Rule**: Full database resets with schema drop/recreation (`npm run db:regen`) must run within the Databricks App runtime in Azure where the Service Principal executes the DDL. Local QA against Databricks must use the DML dry-run workflow above.

### 4. Standalone Test Recipe

To run this test anytime from Node.js:

```javascript
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/server/package.json');
const pg = require('pg');
const dotenv = require('dotenv');
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyDatabricksSeed() {
  const token = JSON.parse(
    execSync('databricks auth token --profile DEFAULT', { encoding: 'utf8' })
  ).access_token;

  const client = new pg.Client({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: token,
    port: parseInt(process.env.PGPORT || '5432', 10),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Databricks PG. Starting dry-run in transaction...');
  await client.query('BEGIN');
  try {
    const tablesToDelete = [
      'difot_action_plan', 'difot_respuesta_cliente', 'difot_auditoria_configuracion',
      'difot_respuesta_opcion', 'difot_pregunta', 'difot_client_creation_requests',
      'difot_assessment', 'difot_cliente', 'difot_categoria', 'difot_dimension',
      'difot_assessment_version', 'difot_configuracion_semaforo', 'difot_system_config',
      'redistribution_notifications', 'scrap_surplus_records', 'redistribution_audit_logs',
      'redistribution_backups', 'redistributions', 'projects_authorized_users',
      'projects_baseline_tasks', 'projects_baselines', 'projects_task_dependencies',
      'projects_tasks', 'projects_projects', 'customer_addresses', 'customer_contacts',
      'customer_branches', 'customers', 'approval_history', 'approval_requests',
      'approval_amount_fields', 'approval_limits', 'approval_delegations',
      'ticket_audit_log', 'ticket_templates', 'ticket_sla_monitor_logs',
      'ticket_sla_monitor_config', 'ticket_user_supervisors', 'ticket_routing',
      'ticket_user_category_roles', 'ticket_subcategories', 'ticket_entity_category',
      'ticket_categories', 'ticket_timeline', 'ticket_attachments', 'ticket_comments',
      'ticket_header', 'ticket_formularios_config', 'users_workspace', 'role_pages',
      'user_roles', 'users', 'ticket_status_actions', 'statuses', 'roles', 'divisions',
      'entity_currencies', 'entities', 'conversion_rates', 'countries', 'entity_types',
      'regions', 'currencies', 'pages', 'workspaces', 'languages'
    ];

    for (const tbl of tablesToDelete) {
      await client.query(`DELETE FROM logistech.${tbl}`);
    }

    const initSql = fs.readFileSync(path.resolve(process.cwd(), 'init_values_databricks.sql'), 'utf8');
    const statements = splitSqlStatements(initSql);

    for (const stmt of statements) {
      await client.query(stmt);
    }
    console.log(`SUCCESS! All ${statements.length} statements verified without errors.`);
  } finally {
    await client.query('ROLLBACK');
    console.log('Transaction rolled back safely. Database untouched.');
    await client.end();
  }
}
```

### 5. Production Container Logs Inspection (Databricks Apps)

To verify the runtime behavior, database operations (such as additive sync or reset), and endpoint executions on the production cloud container, QA MUST inspect the logs via:

```bash
databricks apps logs logistech --profile DEFAULT --tail-lines 100
```

*(Note: The `--profile DEFAULT` flag is mandatory to prevent ambiguous profile matching errors when multiple CLI profiles are present on the system).*

**QA Verification Criteria for Production Logs:**
- Ensure no uncaught exceptions, `[DATABASE ERROR]`, or unhandled promise rejections exist.
- For database additive syncs, verify that `Init: X/X` completes with `0` warnings/errors and no `duplicate key value violates unique constraint` (code `23505`) violations.
- Confirm all migrations or data seed statements finish cleanly.

## Integration Matrix

- **epiroc-coding**: Provides the "Test Plan" skeleton.
- **epiroc-debugging**: Activated if QA fails to resolve issues.
- **epiroc-ecosystem**: Orchestrates the handoff from Coding to QA.
- **Chrome DevTools MCP**: Mandatory tool for all frontend/UI verification (screenshots, console, network, performance).

---

### [2026-09-29] Architecture Regression Coverage

- **Issue:** The architecture review identified partial-write, bootstrap-readiness, authorization-coverage and dual-database risks that the existing QA checklist did not test directly. The default `db:regen` command is destructive to its configured local database.
- **User Feedback:** Add detailed implementation phases and rules/skills that prevent recurrence.
- **Fix Applied:** Added failure-injection, two-engine, endpoint authorization, readiness and cache invalidation gates; restricted destructive bootstrap checks to isolated disposable targets.
- **Impact:** Refactors now require evidence for the failure modes they are intended to remove, without risking shared database contents during QA.

---

### [2026-09-12] Databricks PostgreSQL Direct Verification Protocol
- Documented connection via Databricks CLI OAuth Token (`databricks auth token --profile DEFAULT`) combined with `.env` parameters (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PG_SCHEMA`).
- Established zero-risk dry-run methodology using PostgreSQL transactions (`BEGIN ... ROLLBACK`).
- Documented precise foreign-key dependent table deletion sequence (DIFOT -> Redistributions -> Projects -> Customers -> Approvals -> Tickets Config -> Auth & Core).
- Clarified DDL (`DROP TABLE`, code 42501 table ownership constraint) vs DML (`DELETE / INSERT`) permissions between developer SSO credentials and Databricks App Service Principal.

### [2026-08-17] Chrome DevTools MCP Integration
- All frontend UI testing MUST use Chrome DevTools for Agent MCP tools.
- Added MCP tool reference table for QA tasks (screenshots, console, network, performance).
- Defined mandatory QA workflow with Chrome DevTools MCP.
- Updated core principles to require MCP-based verification.

### [2026-08-18] MCP Configuration Awareness
- The `chrome-devtools` MCP is declared in `opencode.json` under `mcp.chrome-devtools` (command: `npx -y chrome-devtools-mcp@latest`).
- Reinforced: UI verification MUST be done in a real browser via this MCP; HTTP/JSON-only checks are NOT valid verification ("NO GHOST CHECKING").
- Added mandatory section 18 to `.agents/rules/rules.md` (always-on) so every session enforces browser-based UI verification regardless of which skill is active.

### [2026-05-19] Stack Update: Full Node & TypeScript QA Pivot
- Completely replaced Python tooling (Ruff/Black) with ESLint (`npm run lint`), Prettier (`npm run format`), and TypeScript (`npm run typecheck`).
- Changed database bootstrap verification to use `npm run db:regen`.
- Updated checklist and core principles to target React components and Express APIs.

### [2026-09-30] Temporary QA Plan Cleanup
- **Issue:** A task-specific `docs/qa_test_plan.md` remained in the repository after QA.
- **User Feedback:** Remove the QA plan after verification instead of keeping it as a project artifact.
- **Root Cause:** The QA procedure required creating a plan but did not define its lifecycle.
- **Fix Applied:** Mark the plan temporary, delete it after the task's QA phase, report blocked checks in the final response, and preserve pre-existing plans.
- **Impact:** Task-specific QA documentation no longer accumulates while verification gaps remain visible to the user.
