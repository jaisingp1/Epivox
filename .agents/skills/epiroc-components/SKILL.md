---
name: epiroc-components
description: Creates and maintains reusable UI components for Epiroc React 19 and TypeScript applications. Mantiene el catálogo oficial de componentes de Logistech (Header, Sidebar, Modal, Table, Stepper, FormBuilder, TicketActions, PersonSelect, etc.) bajo client/src/components/. Ensures all components follow Epiroc branding, have strict TypeScript interfaces, follow consistent naming conventions, and work seamlessly together. Automatically activates when creating new components or modifying existing ones to prevent duplication and ensure consistency.
---

# Epiroc Components Skill

Creates, maintains, and documents reusable React UI components for Epiroc full-stack applications following corporate brand guidelines, Tailwind CSS v4, and TypeScript standards.

## When to use this skill

- Creating a new reusable React component under `client/src/components/`
- Modifying an existing component (like `Sidebar.tsx` or `Header.tsx`)
- Enforcing strict TypeScript type definitions for component interfaces
- Ensuring full component accessibility (focus rings, skip links, ARIA labels)
- Removing or refactoring hardcoded UI elements into reusable components
- Trigger keywords: component, button, card, table, modal, stepper, input, form, select, header, sidebar, props, interface, type, tsx

## Dependencies

This skill must coordinate with:
- **epiroc-ui**: For styling, Tailwind CSS v4 variables, and brand colors
- **epiroc-ux**: For layout structure, grid systems, and spacing patterns
- **epiroc-coding**: For folder structure, lint checks, and Prettier formatting

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

## Catálogo de Componentes Existentes (client/src/components/)

> [!IMPORTANT]
> **REGLA CRÍTICA**: Antes de crear un componente nuevo, VERIFICAR si ya existe en este catálogo. **NO DUPLICAR**. Si existe, reusarlo o extenderlo.

### Layout & Navegación

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `PageHeader` | `PageHeader.tsx` | **Header estandarizado de página**: título `h1`, descripción, breadcrumbs (`lucide-react: ChevronRight, Home`), badge y slot `actions`/`children`. Uso **obligatorio** en toda nueva vista bajo `client/src/pages/`. Soporta Light/Dark (WCAG 2.1 AA). |
| `Header` | `Header.tsx` | Header global: identidad, theme toggle (Light/Dark), selectores Entity/Role |
| `Sidebar` | `Sidebar.tsx` | Navegación lateral con tabs dinámicos según permisos de sesión |
| `WorkspaceLayout` | `WorkspaceLayout.tsx` | Layout wrapper para rutas de workspace (sidebar + header + content) |
| `ProtectedRoute` | `ProtectedRoute.tsx` | Valida acceso por `pageId` contra permisos de sesión |
| `UserSessionContext` | `UserSessionContext.tsx` | Provider de sesión SSO (carga `/api/auth/session`) |
| `SocketContext` | `SocketContext.tsx` | **Global cross-cutting**: provider socket.io-client — presencia + `maintenance` en tiempo real (fuera de `WorkspaceLayout`) |
| `MaintenanceBanner` | `MaintenanceBanner.tsx` | **Global cross-cutting**: banner/countdown de mantenimiento (naranja/rojo) renderizado en `App.tsx` |
| `WorkspaceNavigationContext` | `WorkspaceNavigationContext.tsx` | Context de navegación por workspace |

### Formulario & Inputs

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `Input` | `Input.tsx` | Input de texto base con label y validación |
| `TextArea` | `TextArea.tsx` | Textarea multilinea |
| `Select` | `Select.tsx` | Select básico |
| `SearchableSelect` | `SearchableSelect.tsx` | Select con búsqueda (para listas largas) |
| `Checkbox` | `Checkbox.tsx` | Checkbox individual |
| `RadioGroup` | `RadioGroup.tsx` | Grupo de radio buttons |
| `Switch` | `Switch.tsx` | Toggle switch (booleano) |
| `DatePicker` | `DatePicker.tsx` | Selector de fecha |
| `FileUpload` | `FileUpload.tsx` | Upload de adjuntos (para `ticket_attachments`) |
| `PersonSelect` | `PersonSelect.tsx` | Selector de persona (usuario) - usa `users.id` INTEGER |
| `PersonValueDisplay` | `PersonValueDisplay.tsx` | Display del valor persona seleccionada |

### Form Builder (Formularios Dinámicos)

| Componente | Carpeta | Propósito |
|-----------|---------|-----------|
| `FormBuilder` | `FormBuilder/` | Construye formularios dinámicos desde `ticket_formularios_config.schema_json` |
| `RichText` | `RichText.tsx` | Editor de texto rico (para comentarios de ticket) |
| `Likert` | `Likert.tsx` | Escala Likert (campos tipo rating) |
| `Rating` | `Rating.tsx` | Rating por estrellas/puntos |
| `Tooltip` | `Tooltip.tsx` | Tooltip informativo |

### Display & Data

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `Table` | `Table.tsx` | Tabla de datos genérica |
| `Card` | `Card.tsx` | Contenedor de tarjeta |
| `Grid` | `Grid.tsx` | Grid layout responsivo |
| `Section` | `Section.tsx` | Sección agrupadora con título |
| `Badge` | `Badge.tsx` | Badge/etiqueta de estado (usar para `ticket_status`) |
| `Tabs` | `Tabs.tsx` | Navegación por pestañas |
| `Spinner` | `Spinner.tsx` | Loader (Epiroc yellow border) |
| `Stepper` | `Stepper.tsx` | Stepper de pasos (para flujos de aprobación multi-nivel) |

### Acciones & Modales

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `Button` | `Button.tsx` | Botón base (variantes: primary, secondary, danger) |
| `Modal` | `Modal.tsx` | **Modal premium** - ÚNICO permitido (prohibido `alert`/`confirm`/`prompt`) |
| `TicketActions` | `TicketActions.tsx` | Botones de acción de ticket (mapeados desde `ticket_status_actions`) |

## Component Coding Rules

### 1. TypeScript Props Interfaces
All React components MUST declare explicit interfaces for their props. The use of `any` is strictly prohibited.

```typescript
// Header.tsx Props Example
export interface HeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  session: Session | null;
  onEntityRoleChange: (entityCode: string, roleId: number) => void;
}
```

### 2. Prohibición de Estilos Inline
All React components must completely avoid the use of the `style` attribute (`style={{ ... }}`). Instead, they must rely on Tailwind CSS v4 utility classes and central variables declared in `client/src/index.css`.

### 3. Modularity and Reusability
Keep components small, focused, and reusable. Avoid building monolithic page views; instead, extract logical blocks into dedicated sub-components.

### 4. Reutilización sobre Duplicación
ANTES de crear un componente nuevo, buscar en el catálogo anterior. Si existe uno similar, extenderlo en lugar de duplicar.

### 5. Regla Estándar de Íconos — `lucide-react` Obligatorio
- **PROHIBIDO** incrustar etiquetas `<svg>` crudas directamente en JSX (`<svg>...</svg>`). Toda iconografía DEBE importarse como componente desde `lucide-react` (ej. `import { Plus, Search, ChevronRight, Home } from "lucide-react"`).
- `lucide-react` ya está declarado en `client/package.json` (`^1.16.0`). No instalar otra librería de íconos.
- `PageHeader` es el **único** header permitido para vistas de módulo: todo título `h1`, descripción, breadcrumbs y acciones superiores deben pasar por `<PageHeader>` (no replicar `<h1>` manual + `<p>` en páginas).
- Verificar que los íconos hereden color por `currentColor` y sean visibles en Light y Dark.

## Component Verification Workflow

1. **Verify Interface**: Ensure all parameters and state items are strictly typed.
2. **Theme Check**: Verify that the component displays flawlessly in both Light and Dark themes.
3. **Accessibility Check**: Ensure that keyboard focus works (`focus-visible:ring-2`) and labels are clear.
4. **Linter & Code Format**: Run `npm run lint` and `npm run format` after completing or editing any component.

---

### [2026-05-19] Stack Update: React 19 Component Pivot
- Replaced Python/Dash registry patterns with pure React 19 + TypeScript component guidelines.
- Standardized strict typing for props and session structures.
- Added strict Tailwind v4 styling mandates.

---

### [2026-07-02] Improvement: Catálogo Real de Componentes de Logistech
- Documentado el inventario completo de componentes existentes bajo `client/src/components/`.
- Agregado catálogo con 30+ componentes: Header, Sidebar, Modal, Table, Stepper, FormBuilder, TicketActions, PersonSelect, Badge, Tabs, Switch, FileUpload, etc.
- Regla nueva: Reutilización sobre duplicación - verificar catálogo antes de crear.
- Vinculación de componentes con tablas del negocio (Modal ↔ prohibición de alert, TicketActions ↔ ticket_status_actions, PersonSelect ↔ users.id).
