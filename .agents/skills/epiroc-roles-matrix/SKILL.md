---
name: epiroc-roles-matrix
description: Guía maestra y estándar para crear roles, gobernar la visibilidad de pantallas y acciones, gestionar la matriz de permisos multi-módulo (un usuario con distintos roles según el workspace) y operar el sistema de asignación rápida por módulo en Logistech. Se activa al crear roles, modificar permisos de página (role_pages), configurar qué ve o puede hacer un usuario según el módulo, o trabajar con la asignación modular de usuarios.
---

# Epiroc Roles Matrix & Modular Access Control

Esta skill define el estándar integral para la gestión de roles, control de visibilidad y gobierno de acceso modular en **Logistech**. Cada rol de negocio pertenece a un workspace y se identifica por su ID estable. El nombre sigue `{Workspace}_{Rol}` y se usa como etiqueta visible; la lógica nunca autoriza por nombre.

---

## When to use this skill

- Crear o modificar roles en la base de datos (`roles`).
- Establecer qué pantallas/rutas puede ver un rol (`role_pages` filtrado por `workspace_id`).
- Configurar controles de visibilidad en frontend (ocultar/mostrar botones, tabs o acciones según el rol activo o modular).
- Proteger endpoints en Express verificando roles por módulo o permisos por página.
- Configurar la matriz de acceso de un usuario a múltiples módulos (`users_workspace` + `user_roles`).
- Operar el sistema de asignación rápida por módulo (pestaña *Matriz Modular* y presets en la Ficha de Usuario).
- **Trigger keywords**: `rol`, `roles`, `crear rol`, `permisos por módulo`, `matriz modular`, `visibilidad`, `role_pages`, `workspace_id`, `acceso modular`, `asignación rápida`, `quién puede ver`, `ocultar botón rol`, `proteger ruta`.

---

## Dependencies & Coordination

Esta skill coordina directamente con:
- **epiroc-security**: Para la autenticación base SSO via headers (`x-forwarded-email`), tokens y contexto de sesión.
- **epiroc-coding**: Para TypeScript estricto y parametros enlazados mediante el adaptador con compatibilidad DuckDB/Lakebase.
- **epiroc-ux**: Para el árbol de navegación dinámico (`WorkspaceLayout`, `Sidebar`, `WorkspaceNavigationContext`).
- **epiroc-mockup-data**: Para la estructura DDL en `schema.sql` y datos maestros DML en `init_values.sql` (regla Dual SQL).
- **epiroc-api**: Para middlewares de Express (`requireRole`, `requirePageAccess`).

---

## 1. Arquitectura de Seguridad Multi-Módulo

El modelo de seguridad de Logistech opera en 4 capas concéntricas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Capa Módulo (Workspace Access)                                           │
│    Tabla: users_workspace (user_id, workspace_id)                           │
│    ¿Tiene el usuario permiso para entrar al módulo?                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Capa Rol por Módulo (Modular RBAC)                                       │
│    Tablas: roles (id, workspace_id, name) + user_roles (user_id, role_id)   │
│    ¿Qué rol específico desempeña el usuario en este módulo y entidad?       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Capa Navegación y Páginas (Page Visibility)                              │
│    Tabla: role_pages (role_id, page_id, workspace_id)                       │
│    ¿Qué pantallas del menú y rutas URL están autorizadas para su rol?       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Capa Acción / Atributo (ABAC & Action Gates)                             │
│    Tablas: ticket_user_category_roles, ticket_status_actions                │
│    ¿Puede editar montos, cambiar estados o aprobar en su entidad?           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Regla de Oro: Aislamiento Modular
- Un rol asignado a un módulo específico (`roles.workspace_id = X`) **nunca** debe otorgar privilegios en otro módulo (`workspace_id = Y`).
- Los roles con `roles.workspace_id IS NULL` se reservan exclusivamente a `Admin` (ID 1), el único rol transversal con acceso al Workspace 7 (`Administración`).
- Cada workspace de negocio tiene un rol `{Workspace}_Admin` con `workspace_id` igual a ese módulo. Un admin modular nunca concede acceso al Workspace 7 ni sustituye el ID 1.
- Cada `role_pages` debe respetar `roles.workspace_id = role_pages.workspace_id`, excepto el rol global ID 1. No se reutilizan roles de un módulo para completar permisos en otro.
- Las decisiones RBAC/ABAC, comparaciones en TS/TSX, guards y endpoints usan `role_id` numérico. `roles.name` solo se presenta al usuario; no usar `includes("Admin")`, `startsWith(...)` ni igualdad por nombre para autorizar.
- Asignar roles por medio de `user_roles` y `users_workspace`; nunca inferir o conceder roles por email, etiqueta o nombre de usuario.

---

## 2. Catálogo Oficial de Roles por Módulo

| ID | workspace_id | Rol | Módulo | Propósito |
|---:|---:|---|---|---|
| **1** | `NULL` | **Admin** | General | Administración transversal y Workspace 7. |
| **2** | 1 | **Tickets_Requestor** | Tickets | Crea tickets y consulta los propios. |
| **3** | 1 | **Tickets_Dispatcher** | Tickets | Despacha y asigna tickets. |
| **4** | 1 | **Tickets_Resolver** | Tickets | Resuelve tickets asignados. |
| **5** | 1 | **Tickets_Approver** | Tickets | Autoriza solicitudes según límites. |
| **6** | 1 | **Tickets_Admin** | Tickets | Administración funcional del módulo. |
| **20** | 2 | **Cotizaciones_Cotizador** | Cotizaciones | Simula y calcula tarifas. |
| **21** | 2 | **Cotizaciones_Aprobador** | Cotizaciones | Aprueba cotizaciones especiales. |
| **22** | 2 | **Cotizaciones_Admin** | Cotizaciones | Administración funcional del módulo. |
| **30** | 3 | **Concesiones_Solicitante** | Concesiones | Solicita y consulta concesiones. |
| **31** | 3 | **Concesiones_Aprobador** | Concesiones | Aprueba concesiones. |
| **32** | 3 | **Concesiones_Gestor_Stock** | Concesiones | Gestiona stock y backorders. |
| **33** | 3 | **Concesiones_Admin** | Concesiones | Administración funcional del módulo. |
| **40** | 4 | **Projects_Jefe_Proyecto** | Projects | Gestiona proyectos, hitos y baselines. |
| **41** | 4 | **Projects_Planificador** | Projects | Gestiona tareas y dependencias. |
| **42** | 4 | **Projects_Visualizador** | Projects | Consulta Gantt y reportes. |
| **43** | 4 | **Projects_Admin** | Projects | Administración funcional del módulo. |
| **50** | 5 | **Redistribuciones_Operador_Carga** | Redistribuciones | Carga archivos mensuales. |
| **51** | 5 | **Redistribuciones_Analista_Scrap_Surplus** | Redistribuciones | Gestiona scrap, surplus y alertas. |
| **52** | 5 | **Redistribuciones_Lector** | Redistribuciones | Consulta historial y reportes. |
| **53** | 5 | **Redistribuciones_Admin** | Redistribuciones | Administración funcional del módulo. |
| **7** | 6 | **DIFOT_Admin** | DIFOT | Administración funcional del módulo. |
| **8** | 6 | **DIFOT_Evaluador** | DIFOT | Ejecuta evaluaciones y planes de acción. |
| **9** | 6 | **DIFOT_Lector_Ejecutivo** | DIFOT | Consulta dashboard y reportes. |
| **80** | 8 | **Docs_Admin** | Documentación | Administración editorial: crear, editar, bloquear/desbloquear y publicar artículos. |
| **81** | 8 | **Docs_Reader** | Documentación | Lectura de manuales publicados, buscador y descarga de PDF. Rol por defecto. |
| **90** | 9 | **ListasCriticas_Operador** | Listas Críticas | Extracción Syncron, historial, revisión cruzada y CSV. |
| **91** | 9 | **ListasCriticas_Admin** | Listas Críticas | Administración funcional del módulo: reintentos y diagnóstico. |

Los IDs DIFOT 7-9 son históricos; se conservan para no invalidar referencias. El bloque 90-99 queda reservado al workspace 9 (Listas Críticas). Workspace 7 usa exclusivamente `Admin` (ID 1), no un rol modular.

---

## 3. Metodología Paso a Paso para Crear un Rol

Cuando se requiera crear un nuevo rol en la aplicación, se debe seguir estrictamente este flujo de 6 pasos:

### Paso 1: Definir el Alcance y Nomenclatura
- Determinar si el rol pertenece a un módulo existente (`workspace_id`), si es transversal (`workspace_id = NULL`), o si corresponde a un módulo nuevo.
- Nombrar roles de negocio `{Workspace}_{Rol}` con tokens ASCII y `_`; mantener `Admin` como nombre global reservado.
- Conservar IDs existentes. Asignar IDs libres de cada bloque (Tickets 1-19, Cotizaciones 20-29, Concesiones 30-39, Projects 40-49, Redistribuciones 50-59). DIFOT conserva IDs históricos 7-9; validar colisiones antes de crear más.
- Mantener un `{Workspace}_Admin` por cada workspace de negocio. Workspace 7 es únicamente para Admin global (ID 1).

### Paso 2: Registrar en DDL y DML (Dual SQL)
1. **`schema.sql` y `schema_databricks.sql`**: Verificar que la definición incluya `workspace_id`:
   ```sql
   CREATE TABLE IF NOT EXISTS roles (
       id INT PRIMARY KEY,
       workspace_id INT,
       app_id INT NOT NULL DEFAULT 1,
       name VARCHAR(50) NOT NULL UNIQUE,
       description TEXT,
       FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
   );
   ```
2. **`init_values.sql`**: Insertar/actualizar el registro maestro idempotentemente:
   ```sql
   INSERT INTO roles (id, workspace_id, app_id, name, description) VALUES
  (43, 4, 1, 'Projects_Admin', 'Administrador funcional del módulo Projects')
  ON CONFLICT (id) DO UPDATE SET
     workspace_id = EXCLUDED.workspace_id,
     app_id = EXCLUDED.app_id,
     name = EXCLUDED.name,
     description = EXCLUDED.description;
   ```
3. **`init_values_databricks.sql`**: Replicar con sintaxis compatible:
   ```sql
   INSERT INTO roles (id, workspace_id, app_id, name, description) VALUES
  (43, 4, 1, 'Projects_Admin', 'Administrador funcional del módulo Projects')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
   ```

### Paso 3: Mapear la Visibilidad de Páginas (`role_pages`)
Cada página a la que el nuevo rol tiene acceso debe registrarse en `role_pages`:
```sql
INSERT INTO role_pages (role_id, page_id, workspace_id) VALUES
(40, 300, 4), -- Cartera de Proyectos
(40, 301, 4), -- Carta Gantt
(40, 302, 4)  -- Admin Proyecto
ON CONFLICT (role_id, page_id, workspace_id) DO NOTHING;
```

> [!CAUTION]
> **Aislamiento de Administración**: Está **ESTRICTAMENTE PROHIBIDO** asignar páginas del rango 700-799 (`/admin-panel/*`) a roles distintos de `Admin` (ID 1). Un `{Workspace}_Admin` solo administra su workspace de negocio.

### Paso 4: Proteger Rutas y Endpoints en Backend
Para proteger un endpoint o recurso según el rol del usuario en ese módulo:

```typescript
// En server/controllers/ o middleware Express:
export function requireModuleRole(workspaceId: number, allowedRoleIds: number[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "No autenticado" });

    const rows = await query(`
      SELECT ur.role_id 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
        AND (r.workspace_id = ? OR r.workspace_id IS NULL)
    `, [userId, workspaceId]);

    const userRoles = rows.map((r: { role_id: number }) => r.role_id);
    const hasRole = userRoles.some(id => allowedRoleIds.includes(id) || id === 1); // 1 = Admin

    if (!hasRole) {
      return res.status(403).json({ error: "No tienes permisos para ejecutar esta acción en este módulo." });
    }
    next();
  };
}
```

### Paso 5: Control de Visibilidad en Frontend (UI Gates)
1. **Rutas URL**: Ya están protegidas por `<ProtectedRoute pageId={...}>` en `App.tsx`, el cual consulta `role_pages` dinámicamente vía `WorkspaceNavigationContext`.
2. **Acciones y Botones en Pantalla**: Usar comprobaciones declarativas basadas en la sesión del usuario:
   ```tsx
  // Ejemplo: autorizar por ID, no por etiqueta visible
  const canCreateProject = user?.role_ids.includes(40) || user?.is_admin;
   
   return (
     <div>
       {canCreateProject && (
         <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
           Nuevo Proyecto
         </Button>
       )}
     </div>
   );
   ```

### Paso 6: Sincronización en `dbResetService.ts` y Verificación
- Asegurar que `role_pages` y `roles` estén en el array de tablas del módulo en `server/services/dbResetService.ts`.
- Validar bootstrap solo en una base/schema aislado y descartable; `npm run db:regen` es destructivo para el archivo local configurado y nunca debe apuntar a una base compartida o productiva.

---

## 4. Sistema de Asignación Rápida por Módulo

Para agilizar la operación diaria de altas de usuario y asignaciones de perfil, Logistech cuenta con el **Sistema de Asignación Rápida por Módulo** en el Workspace 7 (`/admin-panel/master-data` -> Ficha de Usuario -> Pestaña **Matriz Modular**).

### 4.1 Características de la Interfaz Visual
- **Barra de Presets en 1 Clic**:
  - `Resolutor de Tickets`: asigna Tickets rol ID 4.
  - `Gestor de Proyectos`: asigna Projects rol ID 40.
  - `Evaluador DIFOT`: asigna DIFOT rol ID 8.
  - `Operador Integral`: asigna Tickets ID 4, Projects ID 41 y DIFOT ID 8.
  - `👑 Administrador Total`: Habilita todos los módulos activos con rol *Admin*.
- **Grid Modular**:
  - Cada tarjeta o fila muestra el módulo con su icono Lucide y ruta.
  - Interruptor para encender/apagar el acceso al workspace (`users_workspace`).
  - Selector desplegable de rol filtrado por el módulo: muestra roles del workspace más `Admin` global; la lógica envía y compara IDs.
  - Selector desplegable de entidad asignada.
- **Acción Atómica**: Al presionar "Guardar Matriz Modular", la API sincroniza de forma transaccional tanto `users_workspace` como `user_roles` en una única solicitud.

### 4.2 Endpoints REST de Soporte
- `GET /api/admin/users/:id/module-matrix`: Retorna el estado actual del usuario en cada workspace, sus roles asignados y los roles elegibles.
- `PUT /api/admin/users/:id/module-matrix`: Actualiza atómicamente el acceso al módulo y la asignación de rol por entidad.

---

## 5. Decision Tree para Creación y Asignación de Roles

```
¿Necesitas controlar acceso o visibilidad de una funcionalidad?
│
├── ¿Aplica a todos los módulos sin distinción (ej. Super Admin, Auditoria Global)?
│   └── SÍ → Crear/Usar rol global con workspace_id = NULL (ej. Admin).
│
└── ¿Aplica a un módulo de negocio específico (Tickets, DIFOT, Projects, etc.)?
    ├── ¿Es una pantalla completa o menú de navegación?
    │   └── SÍ → Crear rol con workspace_id = X y mapear en role_pages con page_id correspondiente.
    │
    ├── ¿Es un botón o acción puntual dentro de una pantalla (ej. Aprobar, Despachar)?
    │   ├── Si es en Tickets → Configurar en ticket_status_actions o ticket_user_category_roles (ABAC).
    │   └── Si es en otro módulo → Usar IDs/constantes de rol en UI y validar siempre en el endpoint backend.
    │
    └── ¿El usuario necesita operar en más de un módulo con roles distintos?
        └── SÍ → Usar la pestaña "Matriz Modular" en la Ficha de Usuario para asignar el rol específico de cada workspace.
```

---

## 6. Checklist de Calidad y Anti-Regresión

Antes de dar por completada cualquier modificación de roles:
- [ ] El rol tiene asignado el `workspace_id` correcto (`NULL` únicamente para Admin).
- [ ] El nombre cumple `{Workspace}_{Rol}`; las verificaciones en cliente y servidor usan el ID.
- [ ] El rol está registrado en ambos seeds y los upserts sincronizan nombres/descripciones sin cambiar IDs existentes.
- [ ] Las páginas del rol están mapeadas en `role_pages` con el `workspace_id` coincidente.
- [ ] No hay grants cruzados: solo ID 1 puede aparecer en `role_pages` de workspaces ajenos.
- [ ] Ningún rol no-admin tiene acceso a páginas 700-799 (`/admin-panel/*`).
- [ ] Bootstrap/regeneration se verifico solo contra una base/schema descartable aislado; no se uso un destino compartido/productivo.
- [ ] `npm run guard:databricks` reporta 0 violaciones de lista negra.
- [ ] La consola del navegador permanece en 0 errores al cambiar de módulo y verificar la navegación.

## 7. Workspace Availability for New Modules

- Global module availability is controlled by `workspaces.is_active`; user-specific visibility remains controlled by `users_workspace`. Do not remove assignments when a workspace is disabled.
- Workspace-scoped API routes should use the same first path segment as the workspace `path` (for example, `/new-module`). The shared API middleware then resolves the workspace from the catalog and denies requests while it is inactive.
- When an API prefix differs from the workspace path (for example, a legacy route or module configuration endpoint), register that prefix and its numeric `workspace_id` in `server/middleware/requireActiveWorkspace.ts`. Do not add a one-off guard only to a controller or UI route.
- Every new module checklist must verify the Home selector, direct URL entry, all module API reads/writes, and active-session ejection on a disable event. Add a test-plan case for both the canonical API prefix and every alias.
- Never make workspace 7 (Administration) disableable through this control; preserve an administrative recovery path.

## Evolution Log

### [2026-09-29] Principal and Role-ID Guardrails

- **Issue:** The role-middleware example re-read SSO email per endpoint, assumed `$1/$2` placeholders, and the decision tree showed role-name UI checks. Its QA checklist also recommended unqualified destructive regeneration.
- **User Feedback:** Add detailed implementation phases and update rules/skills to prevent architecture issues from recurring.
- **Fix Applied:** Use the authenticated numeric principal, adapter-bound parameters, numeric role IDs in UI/backend checks, and an isolated disposable DB for regeneration.
- **Impact:** Reduces identity drift, adapter incompatibility, role-name authorization regressions and unsafe reset verification.
