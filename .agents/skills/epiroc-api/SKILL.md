---
name: epiroc-api
description: Diseña, implementa y mantiene APIs REST para Logistech con la version de Express fijada en los manifests/lockfiles y TypeScript. Define rutas delgadas, controllers HTTP, casos de uso, acceso a datos, transacciones y validacion. Se activa al crear o modificar endpoints, controladores, servicios, middleware, routers o persistencia API.
---

# Epiroc API Skill (Express + TypeScript REST)

Esta skill define la arquitectura backend de Logistech: cómo se estructuran rutas, controladores y servicios, cómo se manejan errores, validaciones y respuestas, manteniendo consistencia con la version de Node/Express/TypeScript y los drivers declarados en los manifests y lockfiles del repo. No asumir Express 5: confirmar el runtime instalado antes de usar semanticas especificas.

## When to use this skill

- Crear o modificar endpoints REST en `server/routes/`.
- Implementar lógica de negocio en `server/controllers/` o `server/services/`.
- Agregar middleware de Express (auth, validación, logging).
- Manejar errores, respuestas JSON estandarizadas o códigos HTTP.
- Diseñar la firma de un nuevo endpoint.
- Trabajar con la conexión a base de datos (`server/db/db.ts`).
- **Trigger keywords**: api, endpoint, route, router, controller, service, middleware, express, REST, GET, POST, PUT, DELETE, request, response, res.json, status code, db.query.

## Dependencies

Esta skill coordina con:
- **epiroc-coding**: Para estándares TypeScript, naming y estructura de archivos.
- **epiroc-security**: Para middleware de autenticación SSO y validación de permisos.
- **epiroc-workflows**: Para endpoints de tickets y aprobaciones.
- **epiroc-mockup-data**: Para queries SQL y manejo de la capa de datos.

## Arquitectura en 3 Capas (Obligatoria)

```
server/
├── routes/          ← Capa 1: Rutas delgadas (solo registran endpoints)
│   ├── index.ts     ← Agrega todos los routers en apiRouter
│   ├── approval.routes.ts
│   └── ...
├── controllers/     ← Capa 2: Lógica de negocio + orquestación
│   ├── ticketController.ts
│   ├── authController.ts
│   ├── adminController.ts
│   └── ...
├── services/        ← Capa 3: Acceso a datos + queries SQL
│   ├── approval.service.ts
│   ├── ticket.service.ts (si existe)
│   └── ...
└── db/
    └── db.ts        ← Conector DuckDB/PostgreSQL promisificado
```

### Regla de Separación

| Capa | Responsabilidad | Prohibido |
|------|----------------|-----------|
| **Routes** | Registrar endpoints, delegar a controller | ❌ Lógica de negocio, queries SQL |
| **Controllers** | Adaptar HTTP, validar input, delegar casos de uso y consumir principal autenticado | ❌ Queries SQL directas o releer headers SSO |
| **Services** | Casos de uso, reglas y orquestacion; delegan SQL a repositorios cuando existen o cuando la extraccion esta en alcance | ❌ Acceso a req/res de Express |
| **Repositories / DB adapter** | SQL parametrizado, mapeo persistente y transacciones | ❌ Reglas de transporte HTTP |

> [!IMPORTANT]
> Las rutas registran; los controllers adaptan HTTP; los services ejecutan casos de uso; SQL no se agrega a routes/controllers. Logistech contiene controllers legacy con SQL directo: no ampliar ese patron y migrarlo solo con pruebas de caracterizacion, preservando contratos y permisos.

## Patrón de Endpoint Estándar

### Route (delgada)

```typescript
// server/routes/ticket.routes.ts
import { Router } from "express";
import { ticketController } from "../controllers/ticketController";

const router = Router();

router.get("/", ticketController.list);
router.get("/:id", ticketController.getById);
router.post("/", ticketController.create);
router.post("/:id/action", ticketController.executeAction);

export default router;
```

### Controller (adaptador HTTP)

```typescript
// server/controllers/ticketController.ts
import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticketService";

type AuthenticatedRequest = Request & { user: { id: number } };

export const ticketController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await ticketService.findAll();
      return res.json(tickets);
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.create(req.body, req.user.id);
      return res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  },
};
```

### Service (acceso a datos)

```typescript
// server/services/ticketService.ts
import { query } from "../db/db";

export const ticketService = {
  async findAll() {
    const rows = await query("SELECT * FROM ticket_header ORDER BY created_at DESC");
    return rows;
  },

};
```

## Transacciones y efectos secundarios

- Si una accion de negocio escribe varias filas relacionadas (por ejemplo ticket + timeline/adjuntos o aprobacion + ticket + historial), todas las escrituras que forman la misma invariante se ejecutan dentro de una transaccion y sobre la misma conexion.
- No usar llamadas independientes a `query()` como sustituto de una transaccion. La transaccion debe proporcionar al servicio/repositorio una unidad de trabajo; revisar primero las capacidades de DuckDB y PostgreSQL.
- Mantener llamadas externas (email, socket, APIs) fuera de la transaccion y dispararlas solo despues del commit. Si el efecto externo no puede perderse, documentar una estrategia compatible; no simular entrega fiable con un `try/catch` silencioso.
- Probar commit, rollback y fallo inducido despues de cada escritura relevante. Verificar estado principal, timeline/auditoria, estados vinculados y respuesta API.
- El ejemplo de `database.transaction(...)` es conceptual hasta que el adaptador de ambos motores implemente y pruebe esa interfaz.

## Reglas de Parámetros SQL

> [!CAUTION]
> **SIEMPRE** enlazar valores mediante el adaptador. **NUNCA** interpolar input en SQL. La notacion de placeholder debe coincidir con la interfaz soportada por el adaptador actual y verificarse en DuckDB y PostgreSQL; no cambiar su traductor sin pruebas de ambos drivers.

```typescript
// ✅ CORRECTO
await query("SELECT * FROM users WHERE email = ?", [email]);

// ❌ PROHIBIDO
await query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Manejo de Errores Estándar

### Patrón Try/Catch + Next

Todo controller DEBE usar el patrón try/catch con `next(err)` para que el middleware de errores centralizado procese las excepciones:

```typescript
async function handler(req: Request, res: Response, next: NextFunction) {
  try {
    // ...lógica
    return res.json(result);
  } catch (err) {
    next(err); // Delegar al middleware de errores
  }
}
```

### Códigos HTTP Convención

| Código | Uso |
|--------|-----|
| `200 OK` | GET exitoso, PUT exitoso |
| `201 Created` | POST que crea recurso |
| `400 Bad Request` | Validación de input fallida |
| `401 Unauthorized` | No autenticado / SSO inválido |
| `403 Forbidden` | Sin permisos (ABAC) |
| `404 Not Found` | Recurso no existe |
| `409 Conflict` | Estado inválido (ej. transición no permitida) |
| `500 Internal Server Error` | Error no manejado |

### Respuesta de Error Estandarizada

```typescript
// Error handler middleware (en server/index.ts)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[ERROR]", err);
  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});
```

## Resolución de Usuario SSO (Patrón Obligatorio)
- Los endpoints y controladores autorizan por `role_id` numérico, con alcance limitado por `workspace_id`.
- No filtrar ni validar permisos comparando `roles.name`; el nombre se incluye solo para etiquetas visibles.
- En sesiones, devolver IDs explícitos: `user.role_ids` y asignaciones `{ id, name }` por entidad.
- El ID 1 es el único rol global; un admin modular no implica `is_admin`.

La identidad SSO se resuelve una sola vez en el middleware de autenticacion compartido. Los controllers reciben un principal ya autenticado y pasan su `user.id` numerico al caso de uso; no vuelven a leer headers ni a resolver el email por endpoint. El fallback local solo puede usarse fuera de produccion, considerando tambien la configuracion de base de datos de produccion.

```typescript
interface AuthenticatedPrincipal {
  id: number;
  email: string;
}
```

> [!IMPORTANT]
> El email SSO **nunca** se guarda en tablas operativas. El middleware compartido lo resuelve a `users.id` una sola vez; los controllers/services reciben el principal/ID antes de cualquier INSERT/UPDATE.

## Conector de Base de Datos (db.ts)

El archivo `server/db/db.ts` expone funciones promisificadas para DuckDB/PostgreSQL:

```typescript
import { query, exec } from "../db/db";

// query → SQL parametrizado y filas devueltas (incluye DML si requiere binding)
const rows = await query("SELECT id, email FROM users WHERE entity_code = ?", [entity]);

// exec → sentencia controlada sin parametros (p. ej. DDL); la firma actual no acepta params
await exec("CREATE TABLE IF NOT EXISTS ...");
```

## Safe JSON Parsing (Sistema Híbrido)

```typescript
// DuckDB retorna JSON como string, PostgreSQL como objeto
const schema =
  typeof row.schema_json === "string" ? JSON.parse(row.schema_json) : row.schema_json;
```

## Registro de Rutas en index.ts

Todas las rutas se agregan al `apiRouter` central:

```typescript
// server/routes/index.ts
import { Router } from "express";
import ticketRoutes from "./ticket.routes";
import approvalRoutes from "./approval.routes";

export const apiRouter = Router();

apiRouter.use("/tickets", ticketRoutes);
apiRouter.use("/approval", approvalRoutes);
// ...otros
```

Luego en `server/index.ts`:

```typescript
app.use("/api", apiRouter);
```

## Validación de Input

Valida siempre el body/params antes de procesar. Lanza errores con status apropiado:

```typescript
async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId, data } = req.body;
    if (!categoryId || !data) {
      const err = new Error("categoryId y data son obligatorios") as Error & { status: number };
      err.status = 400;
      throw err;
    }
    // ...
  } catch (err) {
    next(err);
  }
}
```

## Workspace Availability Enforcement

- The API router applies the shared workspace-availability guard before module handlers. A new module is covered automatically when its API prefix matches the first segment of `workspaces.path` (for example, `path = '/projects'` and routes under `/projects`).
- If a module uses a different API prefix, add the prefix and numeric `workspace_id` to the central alias registry in `server/middleware/requireActiveWorkspace.ts`. Include read, write, and module-configuration endpoints; do not rely on React `ProtectedRoute` or the module launcher alone.
- Keep `users_workspace` assignments intact when `workspaces.is_active` is false. The disabled module remains visible but inaccessible to already-assigned users; unassigned users must not see it.
- New workspace changes must cover the full flow: administrator authorization, status persistence, API rejection, direct-route rejection, Socket.IO ejection of active users, and re-entry after reactivation.

## Decision Tree

```
¿Qué capa estoy modificando?
├── Route → Mantener delgada, solo registrar endpoint
├── Controller → Adaptar HTTP, validar/normalizar entrada y delegar al caso de uso
├── Service → Reglas/orquestacion y frontera transaccional del caso de uso
└── Repository / DB adapter → SQL parametrizado y acceso a persistencia

¿Necesito identidad del usuario?
└── Consumir el principal autenticado que adjunto el middleware; no releer headers ni resolver email por endpoint

¿La query tiene JSON columns?
└── Aplicar safe parse: typeof check antes de JSON.parse

¿Es un error?
├── Validación input → 400
├── No autenticado → 401
├── Sin permisos → 403
├── No existe → 404
├── Estado inválido → 409
└── Otro → 500
```

## Best Practices

1. **Routes delgadas**: Solo registran endpoints y delegan.
2. **SIEMPRE try/catch + next**: Nunca dejes errores sin manejar.
3. **Binding de parámetros**: Nunca interpolar valores; usar la sintaxis del adaptador y probarla en ambos motores.
4. **Usuarios por ID**: Usar el principal resuelto por el middleware; pasar `user.id` al caso de uso, no volver a resolver headers en cada controller.
5. **Servicios reutilizables**: Los casos de uso/domain services son reusables; controllers no contienen SQL ni reglas de negocio extensas.
6. **Respuestas JSON consistentes**: Usa códigos HTTP correctos y estructura `{ error }` para errores.
7. **Logging de errores**: `console.error("[ERROR]", err)` para trazabilidad.

## Política de Cache (Cache Policy)

Esta sección define las normas obligatorias para la gestión de cache en Logistech, garantizando rendimiento y consistencia de datos en backend, HTTP y frontend.

### 1. Clasificación de Datos por Volatilidad

| Categoría | Ejemplos | Estrategia de Cache | TTL / Expiración |
|---|---|---|---|
| **Estáticos** | `currencies`, `countries`, `regions`, `languages` | In-Memory backend + HTTP cacheable | Indefinido (invalidación solo en `db:regen`) |
| **Semi-estáticos** | `entities`, `roles`, `ticket_priorities`, `ticket_categories`, `/api/users/for-select` | In-Memory backend + HTTP con TTL | TTL sugerido: 5 minutos |
| **Transaccionales** | `ticket_header`, `ticket_comments`, `ticket_attachments`, aprobaciones | **Sin cache** — consulta directa a DB | N/A (`no-store`) |
| **Sesión & Permisos** | Identidad SSO, `role_pages`, permisos ABAC activos | Por request (Scope de Middleware) | Revalidación continua (`no-cache`) |

### 2. Reglas para Cache In-Memory Backend (`server/db/db.ts`)

- **Compatibilidad Híbrida (DuckDB vs Databricks PostgreSQL)**: El cache in-memory vive en el proceso Node.js (`server/db/db.ts`) **antes** de evaluar el motor de base de datos (`dbType === "databricks"` vs `"duckdb"`). Funciona de forma 100% idéntica en desarrollo local (DuckDB) y producción (Databricks Lakebase / PostgreSQL).
- **Whitelist explícita**: Solo se permite cachear consultas de catálogos maestros mediante whitelist de SQLs parametrizadas.
- **TTL Obligatorio para Semi-estáticos**: Toda entrada en `queryCache` para tablas semi-estáticas debe tener un tiempo de expiración o timestamp de validación.
- **Sin parámetros dinámicos**: Está **estrictamente prohibido** cachear queries que acepten parámetros dinámicos del usuario (como filtros o búsquedas por ID).
- **Límite de memoria**: El almacén `queryCache` no debe exceder de 50 entradas únicas.
- **Invalidación en Bootstrap**: El script de regeneración `regenerateDatabase()` o la función `exec` de migración DEBE invocar `queryCache.clear()`.

### 3. Reglas para Headers HTTP de Cache (Express Middleware & Routes)

- **Catálogos y Datos Maestros** (`/api/catalogs/*`, `/api/users/for-select`):
  `Cache-Control: private, max-age=300` (Permite cache en cliente por 5 minutos).
- **Recursos Transaccionales** (`/api/tickets/*`, `/api/approval/*`):
  `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
- **Autenticación y Sesión** (`/api/auth/session`):
  `Cache-Control: no-cache` (Requiere revalidación de cabeceras SSO en cada petición).
- **Activos Estáticos Frontend** (`express.static` de Vite en producción):
  `Cache-Control: public, max-age=31536000, immutable` (Vite incluye hashes únicos en el build).

### 4. Reglas para Frontend (React Components)

- **Prohibición de Singletons de Módulo sin Expiración**: No crear variables globales/singletons a nivel de archivo (ej. `let cachePromise = null`) sin un mecanismo de refresco/expiración o manejo de errores de invalidación.
- **Uso Contextual**: Reutilizar los datos maestros cargados desde el Contexto global de la aplicación (`App.tsx` / `SessionContext`) en lugar de hacer `fetch` repetidos en componentes hijos.

### 5. Invalidación de Cache

- **Reboot / Regeneration**: Al ejecutar `npm run db:regen`, todo el cache in-memory debe limpiarse inmediatamente.
- **Mutación de Datos Maestros**: Si un endpoint administrativo (`PUT/POST/DELETE` en `/api/admin/*`) modifica tablas de catálogo, se debe purgar la clave específica o limpiar `queryCache.clear()`.

---

### [2026-07-20] Cache Policy Standard Added
- Agregada la Política de Cache formal para Logistech (Backend In-Memory, Headers HTTP, Frontend y reglas de invalidación).

### [2026-09-29] Architecture and Transaction Guardrails
- User feedback requested detailed implementation phases and persistent rules for preventing the architecture review findings.
- Added explicit boundaries for SQL, runtime/version verification, atomic multi-write operations, cross-driver validation, and post-commit external effects.
- Clarified that parameter syntax follows the tested DB adapter rather than assuming one placeholder convention.

---

### [2026-07-02] Skill Creation
- Skill nueva para estandarizar la arquitectura REST backend de Logistech.
- Define el patrón de 3 capas (routes/controllers/services) y convenciones HTTP.
- Integra patrones SSO, binding SQL y safe JSON parsing del sistema híbrido DuckDB/PostgreSQL.

