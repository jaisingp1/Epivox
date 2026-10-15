---
name: epiroc-ux
description: Maintains UX consistency across Epiroc Node.js, React 19, and TypeScript applications. Ensures all pages follow consistent navigation, sidebar hierarchy, spacing, and user experience patterns. Automatically activates when creating or modifying pages to maintain design system consistency. Handles sidebar navigation, page structure, responsive layouts, and accessibility standards.
---

# Epiroc UX Skill

Ensures a premium and consistent user experience across all Epiroc full-stack React and Express applications by maintaining standardized layouts, navigation patterns, and UX best practices.

## When to use this skill

- Creating a new page or view in the React frontend
- Modifying an existing page layout or hierarchy
- Adding new navigation elements to the Sidebar or Header
- Implementing responsive design patterns with Tailwind CSS v4
- Reviewing user experience consistency and WCAG 2.1 AA compliance
- Setting up sidebar navigation and admin submenus
- **Auditing module homogeneity** (PageHeader presence, inline styles, native dialogs, color palette) across modules (Tickets, Projects, Redistribuciones, DIFOT, Admin)
- Trigger keywords: layout, navigation, sidebar, page structure, UX, user experience, new page, header, responsive, accessibility, homogeneidad, PageHeader, módulo homogéneo, module homogeneity

## Dependencies

This skill must coordinate with:

- **epiroc-ui**: For styling and color consistency (Tailwind v4 classes and Raleway font)
- **epiroc-components**: For reusable React UI components
- **epiroc-coding**: For code standards, TypeScript strict typing, and folder layout rules

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

## Layout Structure

### Client Orchestrator: `client/src/App.tsx`

`client/src/App.tsx` serves as the core application shell. It is responsible for loading the user session via the SSO session endpoints, initializing the theme, and managing page routing.

#### Session Loading & Propagating Pattern

The App must load the full user session at startup from `/api/auth/session` to ensure role and entity context are available globally.

```typescript
// App.tsx (Session Fetching Pattern)
export interface Session {
  userId: number;
  email: string;
  fullName: string;
  entityCode: string;
  rol: string;
  entities: Entity[];
  permissions: {
    canEditPrices: boolean;
    canViewCosts: boolean;
    canApprove: boolean;
    canAdminConfigs: boolean;
  };
  isAuthenticated: boolean;
  isInitialized: boolean;
}

// Inside App component
const fetchSession = async (entityOverride?: string, roleOverride?: number) => {
  try {
    let url = "/api/auth/session";
    const params = new URLSearchParams();
    if (entityOverride) params.append("entity", entityOverride);
    if (roleOverride) params.append("role", roleOverride.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const data = await res.json();
    setSession(data);
  } catch (err) {
    console.error("Error loading session:", err);
  }
};
```

### Global Header: `client/src/components/Header.tsx`

The header provides identity display, theme toggling (Light/Dark), and context-switching selectors (Entity/Role) that dynamically update the backend session.

### Navigation Sidebar: `client/src/components/Sidebar.tsx`

The sidebar handles application page switching. It MUST render links dynamically based on user session permissions.

## Page Creation Checklist

When creating a new page in the React client, follow this checklist:

### 1. File Placement

- [ ] Place page views under `client/src/pages/`
- [ ] Place configuration and administration views under `client/src/pages/admin/`

### 2. Navigation Integration

- [ ] Add the page as a selectable route/view in `client/src/App.tsx`
- [ ] Add the page navigation tab in `client/src/components/Sidebar.tsx`
- [ ] Enforce permission checks (e.g. `session.permissions.canAdminConfigs` for admin links)
- [ ] Use **exclusively** `lucide-react` for icons (`import { ... } from "lucide-react"`). **Prohibido** `<svg>` crudo en JSX.

### 2b. Page Header Obligatorio — `PageHeader`

- [ ] **Toda nueva vista bajo `client/src/pages/` DEBE usar `<PageHeader>`** como encabezado superior (no `<h1>` manual suelto):
  ```tsx
  import PageHeader from "@/components/PageHeader";
  import { Plus } from "lucide-react";
  <PageHeader
    title="Título del Módulo"
    description="Descripción breve para el usuario"
    breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Módulo" }]}
    actions={<Button leftIcon={<Plus className="w-4 h-4" />}>Acción</Button>}
    badge={<Badge>opcional</Badge>}
  />
  ```
- [ ] Verificar que `title` sea el **único** `<h1>` de la página (jerarquía semántica).
- [ ] Breadcrumbs deben usar `ChevronRight` / `Home` de `lucide-react` a través de `PageHeader` (no implementar nav manual).

### 3. Responsive Layout

- [ ] Use Tailwind CSS flexbox and grid layouts (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)
- [ ] Verify padding and spacing match official rules (`p-6 md:p-8`)

### 4. Accessibility

- [ ] Maintain a single `<h1>` per page with clean semantic hierarchy (h1 > h2 > h3)
- [ ] Ensure all interactive buttons/elements are keyboard accessible with focus borders
- [ ] Verify contrast meets WCAG 2.1 AA (min 4.5:1 for standard text)

## Sidebar Behavior: Administration & Config Routing

### Configuration Submenu Constraint

> [!IMPORTANT]
> All administration or configuration-related features MUST be nested under a main **"Configuración"** menu. Standard administration items (Users, Roles, Entities) must reside within a **"Master data"** submenu under "Configuración".

#### Aislamiento de Administración General (Workspace 7)

> [!CAUTION]
> **PROHIBIDO** crear páginas de administración general (Master Data, Database Reset, Session Manager, Mantenimiento, auditoría global) dentro de módulos de negocio (Tickets, Projects, etc.). Todo admin transversal DEBE vivir en Workspace 7 (`/admin-panel/*`, page_id 700-799, `role_id = 1` exclusivo). Los módulos de negocio solo alojan su propia "Configuración" de dominio (ej. Tickets Config, Formularios, Feriados Projects, Matrices DIFOT).

#### Folder Isolation

Configuration pages MUST NEVER reside in client feature folders. They must reside in `client/src/pages/admin/`.

## Estructura de Rutas Real de Logistech (App.tsx)

La aplicación usa **lazy loading** con `React.lazy()` envuelto en `lazyWithRetry` (recarga la página si un chunk falla, con debounce de 10s). Dos modos de layout:

### Rutas Standalone (sin sidebar)
| Path | Componente | Propósito |
|------|-----------|-----------|
| `/` | `Home` | Launcher de selección de módulos |
| `/mock-login` | `MockLogin` | **DEV ONLY** - Simulador SSO (eliminar en producción) |

### Rutas de Workspace (dentro de `<WorkspaceLayout>`)
| Path | Componente | pageId | Descripción |
|------|-----------|--------|-------------|
| `/tickets` | `TicketsDashboard` | 100 | Dashboard de tickets |
| `/tickets/crear` | `CrearTicket` | 101 | Crear ticket (form dinámico) |
| `/tickets/ver/:id` | `VerTicket` | 100 | Ver detalle de ticket |
| `/aprobaciones` | `ApprovalPending` | 3 | Cola de aprobaciones pendientes |
| `/despacho` | `DispatcherQueue` | 102 | Cola de despacho (asignación) |
| `/admin/tickets` | `TicketsConfig` | 106 | Configuración de tickets (dominio Tickets) |
| `/admin/forms` | `FormsList` | 107 | Lista de formularios dinámicos (dominio Tickets) |
| `/admin/forms/:categoryId/edit` | `FormEdit` | 107 | Editor de formulario por categoría |
| `/admin/approval-config` | `ApprovalConfig` | 108 | Config del motor de aprobaciones (dominio Tickets) |
| `/admin-panel/sessions` | `SessionManager` | 700 | Monitor presencia + acciones admin (Workspace 7) |
| `/admin-panel/maintenance` | `SessionManager` | 701 | Mantenimiento y shutdown programado (Workspace 7) |
| `/admin-panel/master-data` | `GeneralConfig` | 703 | Master Data transversal (Workspace 7 — migrado desde Tickets) |
| `/admin-panel/db-reset` | `DatabaseReset` | 704 | Database Reset transversal (Workspace 7 — migrado desde Tickets) |

> [!IMPORTANT]
> Los `pageId` corresponden a IDs en la tabla `pages` de la base de datos. Todo route de workspace DEBE envolverse en `<ProtectedRoute pageId={N}>` para validar permisos contra `role_pages`.

### Estructura de Carpetas de Páginas

```
client/src/pages/
├── Home.tsx                      # Launcher de módulos
├── eliminar_MockLogin.tsx        # DEV ONLY - eliminar en prod
├── admin/                        # Páginas de Configuración
│   ├── GeneralConfig.tsx         # /admin/general (Master data)
│   ├── TicketsConfig.tsx         # /admin/tickets
│   ├── FormsList.tsx             # /admin/forms
│   ├── FormEdit.tsx              # /admin/forms/:id/edit
│   └── ApprovalConfig.tsx        # /admin/approval-config
├── admin-panel/                  # Páginas del meta-módulo Administración (cross-cutting)
│   ├── SessionManager.tsx        # /admin-panel/sessions (700) + /admin-panel/maintenance (701)
│   └── SessionManager.css
├── tickets/                      # Páginas de Tickets
│   ├── TicketsDashboard.tsx
│   ├── CrearTicket.tsx
│   └── VerTicket.tsx
└── approval/                     # Páginas de Aprobaciones
    └── ApprovalPending.tsx
```

### Patrón de Registro de Ruta (App.tsx)

```tsx
<Suspense fallback={<BrandedSpinner />}>
  <Routes>
    {/* Standalone (sin sidebar) */}
    <Route path="/" element={<Home />} />
    <Route path="/mock-login" element={<MockLogin />} />

    {/* Workspace (con sidebar + ProtectedRoute) */}
    <Route element={<WorkspaceLayout />}>
      <Route path="/tickets" element={<ProtectedRoute pageId={100}><TicketsDashboard /></ProtectedRoute>} />
      <Route path="/tickets/crear" element={<ProtectedRoute pageId={101}><CrearTicket /></ProtectedRoute>} />
      <Route path="/tickets/ver/:id" element={<ProtectedRoute pageId={100}><VerTicket /></ProtectedRoute>} />
      <Route path="/aprobaciones" element={<ProtectedRoute pageId={3}><ApprovalPending /></ProtectedRoute>} />
      <Route path="/despacho" element={<ProtectedRoute pageId={102}><DispatcherQueue /></ProtectedRoute>} />
      {/* Tickets — Configuración de dominio (permanecen en workspace 1) */}
      <Route path="/admin/tickets" element={<ProtectedRoute pageId={106}><TicketsConfig /></ProtectedRoute>} />
      <Route path="/admin/forms" element={<ProtectedRoute pageId={107}><FormsList /></ProtectedRoute>} />
      <Route path="/admin/forms/:categoryId/edit" element={<ProtectedRoute pageId={107}><FormEdit /></ProtectedRoute>} />
      <Route path="/admin/approval-config" element={<ProtectedRoute pageId={108}><ApprovalConfig /></ProtectedRoute>} />
      {/* Administración — Centro de Control (workspace 7, transversal) */}
      <Route path="/admin-panel/master-data" element={<ProtectedRoute pageId={703}><GeneralConfig /></ProtectedRoute>} />
      <Route path="/admin-panel/db-reset" element={<ProtectedRoute pageId={704}><DatabaseReset /></ProtectedRoute>} />
      {/* Retrocompatibilidad */}
      <Route path="/admin/general" element={<Navigate to="/admin-panel/master-data" replace />} />
      <Route path="/admin/db-reset" element={<Navigate to="/admin-panel/db-reset" replace />} />
    </Route>
  </Routes>
</Suspense>
```

## Best Practices

1. **Consistency First**: All views must use the unified `App` container grid system.
2. **Dynamic Menu Loading**: Check `session.permissions` to dynamically show/hide menu choices.
3. **No Inline Styling**: Enforce Tailwind v4 semantic utility classes instead of React style properties (`style={{...}}`).
4. **Theme Transitions**: Ensure smooth transitions when shifting from light to dark mode.
5. **No Native Dialogues**: Never use browser-native alerts, confirm dialogs, or prompt popups. They disrupt user flow, look unprofessional, and are not accessible. Utilize custom React modals (`Modal`) or in-page alerts.
6. **Dynamic Workspace Resolution**: Workspaces and configurations must resolve automatically using user-authorized pages and path comparisons. Manual fallback mappings (like checking specific routes in the frontend) are strictly forbidden.
7. **Cross-Cutting Components**: Los componentes `SocketContext.tsx` y `MaintenanceBanner.tsx` son componentes globales que se montan en `App.tsx` fuera de `WorkspaceLayout`. No son específicos de un workspace — afectan a toda la app. Nuevos componentes cross-cutting requieren autorización explícita y deben documentarse aquí.

---

### [2026-05-19] Stack Update: React 19 SPA UX Pivot

- Completely replaced Python Dash layout rules with React 19 layout, state routing, and `Header`/`Sidebar` architectures.
- Formalized mandatory context switching using `/api/auth/session` dynamic loading.
- Added strict permission checks for page components.

---

### [2026-07-02] Improvement: Estructura Real de Rutas de Logistech
- Documentado el catálogo completo de rutas de App.tsx (10 rutas: standalone + workspace).
- Agregada tabla con pageIds (100, 101, 102, 103, 106, 107, 108, 3) y su mapeo a componentes.
- Documentado patrón `lazyWithRetry` + `<WorkspaceLayout>` + `<ProtectedRoute pageId>`.
- Agregada estructura de carpetas real de `client/src/pages/` (admin/, tickets/, approval/).

---

### [2026-07-28] Improvement: Dynamic Workspaces and Routing Resolution
- Replaced manual path-to-workspace fallbacks in `WorkspaceNavigationContext` with a dynamic backend-queried list of user authorized pages.
- Enforced strict database-driven workspace mapping in both frontend contexts and backend router rules, ensuring modular extensibility without code edits.

---

### [2026-09-21] Improvement: Module Homogeneity Enforcement

**Issue:** Divergencia visual entre módulos — algunos páginas usaban `<h1>` manual en lugar de `PageHeader`, headers con `text-rgb(...)` inválido, uso de `alert()` nativo y barras de progreso con estilos heterogéneos. No existía auditoría automática.

**User Feedback:** "no veo en el plan cambios en las skills o reglas para evitar que esto pase nuevamente"

**Root Cause:** `epiroc-ux` no listaba explícitamente homogeneidad como trigger y carecía de checklist de auditoría pre-entrega.

**Fix Applied:**
- Añadido trigger "Auditing module homogeneity" y keywords `homogeneidad`, `PageHeader`, `módulo homogéneo`.
- Referencia cruzada a nueva Regla 19 en `rules.md` con 4 comandos `Select-String` bloqueantes para CI.
- Sincronizado con `epiroc-ecosystem` (Mandatory Orchestrator Sync).

**Impact:** Futuras páginas serán rechazadas en QA si no usan `PageHeader` o violan paleta/component lock.
