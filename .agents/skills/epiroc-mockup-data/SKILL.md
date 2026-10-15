| `roles`                 | `Admin` global (ID 1) y roles de módulo identificados por ID, con nombres `{Workspace}_{Rol}` y un admin por workspace de negocio |
---
name: epiroc-mockup-data
description: Manages SQL database seeding and bootstrapping for the local DuckDB database. Seed values from init_values.sql are loaded by server/db/db.ts during regeneration. Direct SQL queries in React components are STRICTLY FORBIDDEN.
---

# Epiroc Database Seeding & Mockup Data Skill

Manages all database schemas, seed data insertions, and bootstrapping procedures for the local DuckDB database, ensuring realistic volumes and consistent reference values.

## When to use this skill

- Modifying the database tables structure (`schema.sql`)
- Updating seed values or adding static master data (`init_values.sql`)
- Bootstrapping or resetting the local DuckDB database (`local.db`)
- Trigger keywords: database, schema, seed, sql, bootstrap, reseed, tables, init_values, schema.sql

## STRICT RULES

### ⛔ FORBIDDEN

- **❌ NEVER DO THIS** - Mixing table structure (DDL) and initial data rows (DML) in the same file. Keep DDL in `schema.sql` and DML in `init_values.sql`.
- **❌ NEVER DO THIS** - Hardcoding DB query results or mockup arrays directly inside client React components. Always create Express backend routes to fetch data.
- **❌ NEVER DO THIS** - Usar `ALTER TABLE` o parches incrementales de SQL para cambiar tablas o datos maestros en desarrollo local. Todo cambio debe definirse en la creación original dentro de `schema.sql` o `init_values.sql` y aplicarse regenerando la base de datos completa.

### 📢 MANDATORY NOTIFICATION

When creating additional tables or modifying `schema.sql` / `init_values.sql`, you MUST **inform the user** before proceeding. Schema modifications affect the entire stack.

### 🏗️ BOOTSTRAP ONLY

The database regeneration script (`server/db/regen.ts` invoking `db.ts` `regenerateDatabase()`) resets the local database by reading `schema.sql` and `init_values.sql`. Any transactional seed data must reside in these SQL files.

## Database Bootstrap Flow

```
1. Run: npm run db:regen
           │
           ▼
2. Deletes existing 'server/db/local.db' file
           │
           ▼
3. Connects to fresh local.db instance
           │
           ▼
4. Executes DDL statements in 'server/db/schema.sql' (Creates tables, views, indices)
           │
           ▼
5. Executes DML statements in 'server/db/init_values.sql' (Seeds master and reference data)
           │
           ▼
6. Closes connections and locks successfully
```

## Data Requirements

### Structured Master Data

- All primary configurations, users, entities, roles, permissions, workflow states, and master records must be fully populated inside `init_values.sql`.
- The data should allow for realistic testing of lists, dropdowns, role switching, and multi-entity workflows.

## Schema Real de Logistech (schema.sql)

> [!IMPORTANT]
> Este es el inventario de tablas REALES del proyecto. Todo seed en `init_values.sql` debe cubrir estas tablas con datos realistas y suficientes para testing.

### Sección 1: Configuración & Datos Referenciales

| Tabla              | Seed Mínimo                                              |
| ------------------ | -------------------------------------------------------- |
| `languages`        | 4 idiomas: EN, ES, PT, SV                                |
| `workspaces`       | Workspaces base (ej. Tickets, Aprobaciones)              |
| `pages`            | Páginas con pageIds 100, 101, 102, 106, 107, 108, 110 (Tickets) y 700-704 (Administración) — 103/109 migrados a 703/704 en workspace 7 |
| `currencies`       | SEK (corporativa), USD, CLP, BRL, EUR                    |
| `regions`          | Regiones Epiroc                                          |
| `entity_types`     | Tipos de entidad                                         |
| `countries`        | Países con columnas multilingües (name_en/es/pt/sv)      |
| `conversion_rates` | Factores de conversión a SEK                             |

### Sección 2: Estructura Organizacional

| Tabla       | Seed Mínimo                           |
| ----------- | ------------------------------------- |
| `entities`  | Entidades Epiroc (con `is_principal`) |
| `divisions` | Divisiones de negocio                 |

### Sección 3: Usuarios & SSO

| Tabla                   | Seed Mínimo                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `roles`                 | Roles con `app_id` (Admin, Solicitante, Aprobador, Resolutor, Despachador)               |
| `statuses`              | Estados de workflow con categorías y colores                                             |
| `ticket_status_actions` | Máquina de estados: acciones permitidas por estado (con labels EN/ES, iconos, variantes) |
| `users`                 | Usuarios realistas (emails @epiroc.com, `language_id`, entidad por defecto)              |
| `user_roles`            | Asignaciones usuario-rol por entidad                                                     |
| `role_pages`            | Permisos de página por rol (cobertura de todos los pageIds) — 700-799 exclusivo `role_id=1` + `workspace_id=7` |
| `users_workspace`       | Vinculación usuarios-workspace (admin `user_id=1` con acceso a workspace 7)             |

> [!IMPORTANT]
> **Catálogo Workspace 7 (Administración — transversal):** `700 Session Manager (/admin-panel/sessions)`, `701 Mantenimiento (/admin-panel/maintenance)`, `702 Configuración (group)`, `703 Master Data (/admin-panel/master-data, migrado desde 103)`, `704 Database Reset (/admin-panel/db-reset, migrado desde 109)` — solo `role_id=1`. `Tickets Config (106)`, `Formularios (107)`, `Aprobaciones Config (108)`, `Monitor SLA (110)` permanecen en `workspace_id=1` bajo grupo `Configuración (200)` con sort reordenado 1-4.

> **Integridad de roles:** toda autorización compara `role_id`, nunca `roles.name`. `name` es una etiqueta visible. En `role_pages`, un rol de módulo solo recibe páginas de su propio workspace; ID 1 es la única excepción global. Admins de módulos no reciben páginas 700-799.

### Sección 5: Sistema de Tickets

| Tabla                        | Seed Mínimo                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `ticket_categories`          | Categorías con `routing_type` (POOL_LIDER, DIRECTO_RESOLUTOR) y `approve_required` |
| `ticket_user_category_roles` | Matriz ABAC: usuario + entidad + categoría + rol                                   |
| `ticket_entity_category`     | Vinculación categorías-entidades                                                   |
| `ticket_routing`             | Mapeo entidad+categoría → despachadores                                            |
| `ticket_formularios_config`  | Formularios dinámicos con `schema_json` (versión draft/published)                  |
| `ticket_priorities`          | Prioridades con nombres bilingües, colores, pesos 1-4                              |

> [!NOTE]
> `ticket_header`, `ticket_comments`, `ticket_attachments`, `ticket_timeline` son tablas transaccionales. NO sembrar manualmente; se llenan durante uso o bootstrap.

### Sección 7: SLA & Configuración Regional

| Tabla                           | Seed Mínimo                                 |
| ------------------------------- | ------------------------------------------- |
| `ticket_sla_definitions`        | Reglas SLA por prioridad/categoría/entidad  |
| `ticket_country_holidays`       | Feriados por país (para cálculo SLA)        |
| `ticket_country_business_hours` | Horario laboral por país y día de la semana |
| `ticket_templates`              | Plantillas de ticket por categoría/entidad  |

### Sección 8: Motor de Aprobaciones

| Tabla                    | Seed Mínimo                                                |
| ------------------------ | ---------------------------------------------------------- |
| `approval_limits`        | Umbrales multi-nivel (1-3) por workspace/entidad/categoría |
| `approval_amount_fields` | Mapeo de campos JSON del ticket que contienen monto/moneda |
| `approval_delegations`   | Ejemplos de delegación temporal (opcional, para testing)   |

## Reglas de Calidad del Seed

### Realismo Obligatorio

> [!CAUTION]
> **PROHIBIDO** datos mock irreales o hardcoded. El seed debe permitir testear flujos completos:

1. **Usuarios**: Emails `@epiroc.com` realistas, no `user1@test.com`.
2. **Multi-entidad**: Al menos 3 entidades para testear switching.
3. **Multi-rol**: Cobertura de todos los roles (Admin, Solicitante, Aprobador, Resolutor, Despachador).
4. **ABAC completo**: La matriz `ticket_user_category_roles` debe tener cobertura cruzada.
5. **i18n completo**: Toda columna `_en/_es/_pt/_sv` debe tener valor (especialmente `_sv` que es corporativo).
6. **Aprobaciones**: `approval_limits` con umbrales que cubran los 3 niveles para probar escalamiento.
7. **SLA**: Definiciones que permitan testing con diferentes prioridades.

### Volumen Suficiente

| Tabla                   | Cantidad Mínima Sugerida                |
| ----------------------- | --------------------------------------- |
| `users`                 | 10-15 usuarios                          |
| `entities`              | 3-5 entidades                           |
| `ticket_categories`     | 5-8 categorías                          |
| `ticket_priorities`     | 4 (pesos 1-4)                           |
| `ticket_status_actions` | Cobertura de todas las transiciones     |
| `role_pages`            | Permisos para todos los pageIds por rol |

## Best Practices

### 1. Separate DDL and DML

Keep structural definitions separated from database values.

- `schema.sql` should only contain `CREATE TABLE`, `CREATE SEQUENCE`, etc.
- `init_values.sql` should only contain `INSERT INTO`, `UPDATE`, etc.

### 2. Standard SQL Types

DuckDB supports highly standard SQL. Make sure your SQL files use robust, standard SQL syntax compatible with DuckDB's types (e.g., standard integers, varchars, dates, timestamps, and foreign keys).

### 3. Verification of Seeding

Always verify that a freshly seeded database has initialized correctly without errors by running:

```bash
npm run db:regen
```

Check that the terminal outputs `✅ Base de datos local regenerada con éxito.`

### 4. Hybrid System & JSON Parsing Note

- The application operates on a **hybrid database model**: local testing and database seeding use **DuckDB**, while production uses **Databricks PostgreSQL (Lakebase)**.
- Under **DuckDB**, JSON columns (such as `schema_json` and `data_json`) are returned as **raw strings** (requiring `JSON.parse` in JavaScript/TypeScript).
- Under **Databricks PostgreSQL**, the `pg` driver returns these columns as **pre-parsed objects/dictionaries**.
- Coding logic fetching these columns MUST safely check their type before parsing:
  ```typescript
  const schema =
    typeof row.schema_json === "string"
      ? JSON.parse(row.schema_json)
      : row.schema_json;
  ```

---

### [2026-05-19] Stack Update: Full Node & TypeScript Seeding Pivot

- Completely removed Python `mockup_data.py` rules, pandas details, and python-based data-loss algorithms.
- Configured guidelines strictly for `schema.sql` (DDL), `init_values.sql` (DML), and `server/db/regen.ts` bootstrap execution.

---

### [2026-07-02] Improvement: Inventario Real de Tablas de Logistech

- Documentado el catálogo completo de tablas del `schema.sql` organizado por secciones (1-8).
- Definidos requisitos de seed mínimo por tabla con volúmenes sugeridos.
- Agregadas reglas de realismo (emails @epiroc.com, multi-entidad, multi-rol, ABAC, i18n completo).
- Vinculación con sistema de tickets (categorías, routing, formularios dinámicos) y motor de aprobaciones (límites multi-nivel, delegaciones).

---

## 5. Selective Database Reset (Módulos de Reinicio)

Logistech cuenta con un mecanismo para reiniciar de manera selectiva conjuntos de tablas (módulos) en producción o desarrollo local desde la página `/admin/db-reset`.

### Arquitectura de Reinicio Selectivo

1. **Definición de Módulos**: Las tablas se agrupan en módulos lógicos en `server/services/dbResetService.ts`. Cada módulo tiene un orden estricto de DELETE (inverso a las llaves foráneas).
2. **Extracción y Ejecución de Seed**: El backend lee los archivos SQL (`init_values.sql` o `init_values_databricks.sql` según `process.env.DB_TYPE`) y busca todos los bloques `INSERT INTO <tabla>` dispersos a lo largo del archivo para las tablas seleccionadas. Ejecuta primero un DELETE y luego re-inserta estos valores iniciales sin alterar la estructura física de la base de datos (no ejecuta DDL).
3. **Módulos sin Seed (Asimetría)**: Si un módulo no tiene sentencias `INSERT INTO` en `init_values_databricks.sql`, en producción dicho módulo solo se limpiará (vaciará). La interfaz gráfica mostrará esta condición con el badge "Solo limpieza".

### Obligaciones del Desarrollador

- **Regla de Sincronización al Crear Módulos Nuevos**: Al agregar un módulo nuevo o nuevas tablas a `schema.sql`, es obligatorio:
  1. Replicar la definición DDL de la tabla en `schema_databricks.sql` manteniendo coincidencia exacta de campos y nombres de columnas.
  2. Registrar la sentencia `DROP TABLE IF EXISTS <nombre_tabla> CASCADE;` en `drop_tables_databricks.sql` en orden según dependencias FK.
  3. Registrar el módulo completo en el mapa de módulos de `server/services/dbResetService.ts` (con su `id`, `name`, `description`, y el listado de `tables` en orden de DELETE inverso a las llaves foráneas). Esto garantiza que el módulo aparezca disponible y seleccionable en la interfaz de usuario (UI) de Database Reset.
  4. Asegurar que el reinicio parcial limpie los registros existentes y vuelva a sembrar los valores iniciales (seeds) leyendo los inserts de `init_values.sql` e `init_values_databricks.sql`.
- **Doble Registro de Seed**: Si añades datos de semilla en `init_values.sql`, también debes agregarlos en `init_values_databricks.sql` para que el reinicio en producción cuente con los datos iniciales.

---

### [2026-07-28] Selective Database Reset Support

- Documentado el sistema de reinicio selectivo por módulos, sincronización de `dbResetService.ts` y asimetría de seed entre local y producción.

---

### [2026-09-11] Databricks Seed Hygiene — Anti-fuga de datos de prueba (6d)

**Problema resuelto:** Datos transaccionales de prueba (`redistributions`, `scrap_surplus_records`, `difot_cliente`, `difot_assessment`, etc.) se copiaron a `init_values_databricks.sql` y llegaron a producción.

**Clasificación obligatoria de seed:**
- `MASTER` (permitido en Databricks): referencia/config de bajo volumen requerido para arrancar la app. Lista blanca: `languages`, `workspaces`, `pages`, `regions`, `currencies`, `entity_types`, `countries`, `entities`, `entity_currencies`, `divisions`, `roles`, `statuses`, `ticket_status_actions`, `users` (solo administradores base: jaising.pasten@epiroc.com y eduardo.acuna@epiroc.com; resolutores y demo prohibidos en Databricks), `user_roles`, `role_pages`, `users_workspace`, `ticket_categories`, `ticket_entity_category`, `ticket_subcategories`, `ticket_sla_monitor_config`, `ticket_formularios_config`, `conversion_rates`, `approval_limits`, `approval_amount_fields`, `redistribution_notifications` (mínimo ARH/CLE/BRC), `difot_configuracion_semaforo`, `difot_assessment_version`, `difot_dimension`, `difot_categoria`, `difot_pregunta`, `difot_respuesta_opcion`, `difot_system_config`.
- `TRANSACCIONAL/PRUEBA` (prohibido en Databricks): `redistributions`, `redistribution_backups`, `redistribution_audit_logs`, `scrap_surplus_records`, `difot_cliente` (debe permanecer VACÍO), `difot_assessment`, `difot_respuesta_cliente`, `difot_auditoria_configuracion`, `difot_action_plan`, `difot_client_creation_requests`, `ticket_header`/`ticket_comments`/`ticket_timeline`, `approval_requests`/`approval_history`, `projects_*`, `customers` demo masivo.

**Reglas:**
- `difot_cliente` permanece **vacío** en `init_values_databricks.sql`; clientes se crean vía UI con aprobación.
- `DUAL SQL restringido`: duplicar seed a Databricks solo aplica a lista blanca.
- **Guard automático:** `scripts/guard-databricks-seed.js` falla el build/lint si detecta `INSERT INTO <tabla lista negra>` en `init_values_databricks.sql`. Integrado en `npm run lint` (`eslint . && npm run guard:databricks`).
- Todo PR que toque `init_values*.sql` debe declarar clasificación MASTER vs PRUEBA.

---

### [2026-09-25] Reinicio Granular por Tabla Individual

**Nueva funcionalidad:** Database Reset ahora permite reiniciar tablas individuales (no solo por módulo) desde `/admin-panel/db-reset` con pestaña "Por Tabla Individual".

**Capacidades:**
1. **Catálogo dinámico de 69 tablas**: `GET /api/admin/db-reset/tables` retorna todas las tablas con conteo de filas en vivo, estado de seed, y flag de blacklist Databricks.
2. **Detección de dependencias FK**: `GET /api/admin/db-reset/table/:tableName/dependencies` retorna tablas hijas con sus conteos para mostrar advertencias antes del reinicio.
3. **Reinicio individual**: `POST /api/admin/db-reset/execute-table` con modos `upsert` (seguro para tablas padre) o `clean` (vaciar + resembrar).
4. **Reinicio en lote**: `POST /api/admin/db-reset/execute-tables` para reiniciar múltiples tablas seleccionadas.
5. **DDL Sync por tabla**: Checkbox "Recrear estructura DDL" ejecuta `DROP TABLE + CREATE TABLE + INSERT` desde `schema.sql`.

**Flujo de reinicio de tabla padre con hijas:**
1. El modal detecta tablas hijas vía `getTableDependencies()`.
2. Opción "Upsert Seguro" (recomendado): ejecuta `INSERT ... ON CONFLICT DO UPDATE` para no romper referencias FK.
3. Opción "Limpieza en Cascada": vacía hijas en orden inverso de FK, luego el padre, re-sembrando todo.

**Obligaciones del desarrollador:**
- Al agregar una tabla nueva a `schema.sql`, el sistema la detecta automáticamente en el catálogo (via parsing dinámico del DDL).
- Si la tabla pertenece a un módulo existente, se muestra con su badge de módulo.
- Si la tabla no está asociada a ningún módulo, aparece bajo "Otras / Nuevas Tablas".
- La blacklist de Databricks se aplica también a reinicios individuales: tablas en lista negra solo permiten modo `clean` (vaciar) sin resembrado.
