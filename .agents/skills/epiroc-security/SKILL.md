---
name: epiroc-security
description: Gestiona la autenticación SSO, autorización basada en roles (RBAC), control de acceso basado en atributos (ABAC), permisos por página, y delegación de autoridad en Logistech. Define cómo se resuelve la identidad desde headers SSO, cómo se cargan sesiones, cómo se validan permisos por página (role_pages), por categoría (ticket_user_category_roles) y cómo se aplican delegaciones de aprobación. Se activa al trabajar con auth, sesión, permisos, roles, ABAC, middleware de autorización, o cualquier feature que requiera validación de acceso.
---

# Epiroc Security Skill (Auth, Permissions & ABAC)

Esta skill define el modelo de seguridad completo de Logistech: autenticación SSO via headers, gestión de sesión, autorización por roles y páginas, control de acceso basado en atributos (ABAC) para tickets, y delegación temporal de autoridad de aprobación.

## When to use this skill

- Implementar o modificar autenticación SSO y resolución de identidad.
- Crear middleware de autorización (verificar permisos por página o categoría).
- Trabajar con las tablas `users`, `user_roles`, `roles`, `role_pages`, `ticket_user_category_roles`.
- Construir el `UserSessionContext` del frontend o el endpoint `/api/auth/session`.
- Implementar `ProtectedRoute` en React para validar acceso a páginas.
- Validar si un usuario puede ejecutar una acción sobre un ticket (ABAC).
- Implementar delegación de aprobación (`approval_delegations`).
- Integrar búsqueda de usuarios Entra ID (Microsoft Graph).
- **Trigger keywords**: auth, SSO, login, sesión, session, permisos, permissions, roles, RBAC, ABAC, acceso, autorización, authorization, x-forwarded-email, protected route, delegación, Entra ID, middleware.

## Dependencies

Esta skill coordina con:
- **epiroc-coding**: Para la estructura de tipos TypeScript (`UserSession`, permisos).
- **epiroc-api**: Para middleware de Express y patrones de controller.
- **epiroc-workflows**: Para validación de acceso a categorías de tickets.
- **epiroc-i18n**: Para mensajes de error de autorización localizados.

## Modelo de Autenticación (SSO via Headers)

### Resolución de Identidad

Logistech NO maneja login propio. La identidad proviene de headers inyectados por el proxy SSO (Databricks / Azure / Entra ID):

| Header | Origen | Propósito |
|--------|--------|-----------|
| `x-forwarded-email` | Databricks/Azure | Email primario (fuente principal) |
| `x-forwarded-preferred-username` | OIDC | Username backup |
| `x-forwarded-access-token` | OIDC | JWT para llamadas on-behalf-of |
| `x-forwarded-user` | Databricks | ID numérico Databricks |

### Orden de Resolución (Obligatorio)

```typescript
export function getSessionUser(req: Request): string | undefined {
  const email =
    (req.headers["x-forwarded-email"] as string) ||
    (req.headers["x-forwarded-preferred-username"] as string) ||
    (req.headers["x-user-email"] as string);

  if (email) return email;

  // Fallback SOLO en desarrollo
  if (process.env.NODE_ENV !== "production") {
    return "jaising.pasten@epiroc.com";
  }
  return undefined;
}
```

> [!CAUTION]
> El fallback hardcoded **solo** es válido cuando `NODE_ENV !== "production"`. En producción, si no hay email, la solicitud se rechaza con 401.

## Estructura de Sesión (UserSession)

El endpoint `GET /api/auth/session` retorna el contexto completo del usuario:

```typescript
interface UserSession {
  userId: number;
  email: string;
  fullName: string;
  entityCode: string;          // Entidad activa
  rol: string;                 // Rol activo
  entities: Entity[];          // Entidades autorizadas con roles
  permissions: {               // Permisos pre-calculados del rol activo
    canEditPrices: boolean;
    canViewCosts: boolean;
    canApprove: boolean;
    canAdminConfigs: boolean;
  };
  isAuthenticated: boolean;
  isInitialized: boolean;
}
```

### Cambio de Contexto (Entidad/Rol)

El usuario puede cambiar su entidad activa y rol activo. Esto re-query la base de datos y recalcula permisos:

```
GET /api/auth/session?entity=<code>&role=<id>
   → Re-carga sesión con nueva entidad/rol
   → Recalcula permissions
   → Actualiza UserSessionContext en React
```

## Modelo de Autorización
- Toda decisión de autorización en backend o frontend compara `role_id` numérico contra IDs permitidos del workspace.
- `roles.name` es una etiqueta de presentación y puede cambiar; no se usa en condiciones, consultas de autorización ni guards (`role.name === ...`, `includes("Admin")`, `startsWith(...)`).
- La sesión expone `user.role_ids: number[]` y roles por entidad como `{ id, name }`. El nombre solo se muestra; las verificaciones usan `id`.
- `is_admin` y el rol global corresponden exclusivamente al ID 1. IDs administrativos por módulo nunca se traducen a `is_admin`.

| Alcance | Role ID | Regla |
|---|---:|---|
| Global / Workspace 7 | 1 | Único acceso a `/admin-panel/*` |
| Tickets | 6 | Admin funcional de Tickets |
| Cotizaciones | 22 | Admin funcional de Cotizaciones |
| Concesiones | 33 | Admin funcional de Concesiones |
| Projects | 43 | Admin funcional de Projects |
| Redistribuciones | 53 | Admin funcional de Redistribuciones |
| DIFOT | 7 | Admin funcional de DIFOT (ID histórico) |
| Documentación | 80 | Admin editorial de Documentación (`Docs_Admin`; lectura con 81 `Docs_Reader`) |
| Listas Críticas | 91 | Admin funcional de Listas Críticas (operación con 90 `ListasCriticas_Operador`) |

### Capa 1: Permisos por Página (RBAC)

La tabla `role_pages` vincula roles con páginas dentro de workspaces:

```sql
-- Un rol tiene acceso a una página
INSERT INTO role_pages (role_id, page_id) VALUES (1, 100);
```

En el frontend, `ProtectedRoute` valida el acceso:

```tsx
<ProtectedRoute pageId={100}>
  <TicketsDashboard />
</ProtectedRoute>
```

- Si el usuario no tiene el `pageId` en su rol activo, se le niega el acceso.
- Los pageIds están definidos en la tabla `pages` (ej. 100 = Tickets, 102 = Despacho, 703 = Master Data).

> [!CAUTION]
> **Matriz 700-799 (Workspace 7 — Aislamiento obligatorio):** Las páginas con `page_id` en rango 700-799 pertenecen **exclusivamente** a `workspace_id = 7` (`/admin-panel/*`) y al `role_id = 1` (Admin, `is_admin = true`). Está prohibido asignar `role_pages` de este rango a roles no-admin (Requestor, Dispatcher, Resolver, Approver, Tickets Admin). `Master Data (703)` y `Database Reset (704)` residen bajo el grupo `Configuración (702)` y requieren verificación `is_admin`.

> [!CAUTION]
> **Matriz 700-799 (Workspace 7 — Aislamiento obligatorio):** Las páginas con `page_id` en rango 700-799 pertenecen **exclusivamente** a `workspace_id = 7` y al `role_id = 1` (`Admin`, `is_admin = true`). Ningún admin de módulo puede acceder al workspace 7. `Master Data (703)` y `Database Reset (704)` requieren verificación del ID global 1.
  role_ids: number[];          // IDs asignados; fuente para decisiones de acceso

| page_id | Nombre | Path | Workspace |
|---------|--------|------|-----------|
| 700 | Session Manager | `/admin-panel/sessions` | 7 |
| 701 | Mantenimiento | `/admin-panel/maintenance` | 7 |
| 702 | Configuración (group) | `NULL` | 7 |
| 703 | Master data | `/admin-panel/master-data` | 7 |
| 704 | Database Reset | `/admin-panel/db-reset` | 7 |

### Capa 2: ABAC para Tickets (Attribute-Based Access Control)

La tabla `ticket_user_category_roles` define qué usuario + entidad + categoría + rol puede operar:

```sql
-- El usuario X en entidad Y tiene rol Z sobre la categoría C
INSERT INTO ticket_user_category_roles (user_id, entity_code, category_id, role_id)
VALUES (5, 'CHL', 3, 2);
```

> [!IMPORTANT]
> Antes de permitir que un usuario cree, vea o actúe sobre un ticket de cierta categoría, **SIEMPRE** validar contra `ticket_user_category_roles`. El acceso por página (RBAC) **no** es suficiente para operaciones de tickets.

### Capa 3: Delegación de Aprobación

`approval_delegations` permite delegar temporalmente autoridad de aprobación:

- Constraints CHECK previenen auto-delegación y rangos inválidos.
- Al evaluar un aprobador, verificar si existe delegación activa (fecha actual dentro del rango).
- El delegado asume la capacidad de aprobar durante el período.

## Tablas de Seguridad (schema.sql)

| Tabla | Propósito |
|-------|-----------|
| `users` | Usuarios con email único (SSO), lenguaje, entidad por defecto |
| `roles` | Definición de roles (con `app_id` para multi-tenant) |
| `user_roles` | Asignación rol-usuario por entidad (PK compuesta: user_id, role_id, entity_code) |
| `role_pages` | Permisos de página por rol |
| `users_workspace` | Vincula usuarios con workspaces |
| `ticket_user_category_roles` | Matriz ABAC para tickets |
| `approval_delegations` | Delegación temporal de aprobación |

## Middleware de Autorización (Express)

### Verificar Autenticación

```typescript
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const email = getSessionUser(req);
  if (!email) {
    return res.status(401).json({ error: "No autenticado" });
  }
  try {
    const user = await authService.findActiveUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Usuario no autorizado" });
    req.user = { id: user.id, email: user.email };
    return next();
  } catch (err) {
    return next(err);
  }
}
```

`req.user` representa un principal tipado (extender `Express.Request` en el modulo de tipos). Este middleware es el unico punto que lee headers y traduce email a ID; los guards y controllers posteriores solo consumen el principal.

### Verificar Permiso por Página

```typescript
export function requirePageAccess(pageId: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "No autenticado" });

      const hasAccess = await authService.checkPageAccess(user.id, pageId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Sin permisos para esta página" });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
```

### Verificar Acceso ABAC a Categoría

```typescript
export function requireCategoryAccess(categoryId: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "No autenticado" });
      const entityCode = req.headers["x-active-entity"] as string;

      const hasAccess = await authService.checkCategoryAbac(
        user.id,
        entityCode,
        categoryId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Sin acceso a esta categoría" });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
```

## Frontend: ProtectedRoute y UserSessionContext

### UserSessionProvider

Carga la sesión al inicio y expone el contexto:

```tsx
const { session, loading } = useUserSession();
if (loading) return <LoadingSpinner />;
if (!session?.isAuthenticated) return <Navigate to="/mock-login" />;
```

### ProtectedRoute

```tsx
function ProtectedRoute({ pageId, children }: { pageId: number; children: React.ReactNode }) {
  const { session } = useUserSession();
  const hasAccess = session?.permissions?.pages?.includes(pageId);

  if (!hasAccess) {
    return <AccessDenied />;
  }
  return <>{children}</>;
}
```

## Integración Entra ID (Microsoft Graph)

Para búsqueda/creación de usuarios desde Entra ID:

- Endpoint: `/api/admin/users/entra-search` (busca en Microsoft Graph).
- El access token viene en `x-forwarded-access-token`.
- Se usa para onboarding de usuarios antes de asignarles roles.

> [!CAUTION]
> La búsqueda Entra ID **solo** debe activarse en contextos administrativos con permiso `canAdminConfigs`. Nunca exponer a usuarios regulares.

## Reglas de Seguridad Obligatorias

> [!CAUTION]
> **REGLAS CRÍTICAS:**

1. **NUNCA** guardar emails en tablas operativas como FK. Usar siempre `INTEGER` referenciando `users.id)`.
2. **SIEMPRE** validar autenticación antes de procesar cualquier endpoint que requiera identidad.
3. **SIEMPRE** validar ABAC para operaciones de tickets (no basta con RBAC de página).
4. **NUNCA** exponer endpoints administrativos sin verificar `canAdminConfigs`.
5. **SIEMPRE** enlazar parámetros mediante el adaptador DB; no interpolar input. Usar solo la sintaxis soportada por el contrato actual y probar cambios del adaptador en DuckDB y PostgreSQL.
6. El token `x-forwarded-access-token` **solo** se usa para llamadas Entra ID on-behalf-of, nunca se loguea ni persiste.
7. Cada ruta HTTP debe clasificarse explicitamente como publica o protegida y enlazarse a su politica de identidad, page/role y ABAC aplicable. `ProtectedRoute` es solo un control de UI y nunca sustituye la autorizacion backend.
8. Todo endpoint nuevo o cambiado requiere pruebas negativas para request sin identidad y para identidad autenticada sin permiso; los endpoints realmente publicos deben tener esa excepcion documentada.
9. Resolver el principal una sola vez en el limite de confianza del servidor y reutilizarlo. No aceptar headers de identidad simulados en produccion; la configuracion `DB_TYPE` tambien cuenta para determinar produccion cuando corresponda.

### Matriz obligatoria de autorizacion de API

Antes de agregar o cambiar una ruta, registrar en el inventario de API:

| Campo | Pregunta que se responde |
|---|---|
| Identidad | ¿Requiere usuario SSO? Si no, ¿por que es publica? |
| RBAC | ¿Que `page_id` / `role_id` y workspace autorizan la accion? |
| ABAC | ¿Aplica entidad, categoria, propietario, asignacion o delegacion? |
| Pruebas | ¿Se verifican 401, 403, acceso permitido y aislamiento de workspace/entidad? |

La politica se aplica en el backend aunque la misma pagina este envuelta por `ProtectedRoute`. Para una ruta montada sin middleware visible, verificar el controller/service antes de concluir que esta abierta; no dejar esa cobertura implicita ni sin prueba.

## Assets de Test/Impersonación (PRODUCCIÓN)

> [!WARNING]
> **PRE-PRODUCCIÓN OBLIGATORIO:** Antes de release, ELIMINAR todos los assets de simulación:
> - `client/src/pages/eliminar_MockLogin.tsx`
> - Ruta `/mock-login` y lazy import en `App.tsx`
> - Fetch interceptor en `main.tsx` que inyecta `X-User-Email`
> - Endpoint `/api/auth/mock-users`
> - Banners/widgets de simulador en `Home.tsx` y `Header.tsx`

## Decision Tree

```
¿La request necesita identidad?
└── getSessionUser(req) → ¿hay email?
    ├── Sí → proseguir
    └── No + dev → usar fallback / No + prod → 401

¿Es operación sobre ticket?
└── Validar ABAC: ticket_user_category_roles (user + entity + category)

¿Es página administrativa?
└── Validar canAdminConfigs en session.permissions

¿Es acción de aprobación?
└── Verificar approval_delegations antes de requerir approver titular

¿Es búsqueda Entra ID?
└── Verificar canAdminConfigs + usar x-forwarded-access-token
```

## Best Practices

1. **Defensa en profundidad**: RBAC (página) + ABAC (categoría) + verificaciones específicas.
2. **Fail-closed**: Ante duda, denegar (403), nunca fail-open.
3. **Permisos pre-calculados**: La sesión carga `permissions` ya resueltas para evitar queries por click.
4. **Auditoría de accesos sensibles**: Logging de acciones administrativas en `ticket_audit_log`.
5. **Tokens efímeros**: El access token SSO no se persiste, se usa solo para la request en curso.

## Evolution Log

### [2026-09-29] API Authorization Coverage

**Issue:** El montaje de rutas no muestra una politica de autorizacion transversal; la UI tambien contiene guards que no protegen el servidor.

**User Feedback:** El usuario pidio convertir los riesgos de arquitectura en reglas/skills para prevenir su recurrencia.

**Fix Applied:** Se exige clasificar cada endpoint, documentar RBAC/ABAC, probar denegaciones y resolver/reutilizar el principal en el backend.

**Impact:** Reduce el riesgo de que una ruta nueva dependa accidentalmente del control visual del cliente o quede con permisos no comprobados.

---

### [2026-07-02] Skill Creation
- Skill nueva para el modelo completo de seguridad de Logistech.
- Cubre SSO via headers, RBAC por páginas, ABAC para tickets, delegación de aprobación.
- Define middleware de Express y patrones de ProtectedRoute en React.
