# Guía de Integración Llave en Mano: Módulo Epivox en Logistech (Workspace 10)

Esta guía documenta el procedimiento exacto paso a paso para incorporar el módulo **Epivox** dentro del repositorio central de **Logistech** (`C:\Users\CLEJPA\OneDrive - Epiroc\Skrivbordet\Epiroc\Proyectos  Web\logistech`).

---

## 1. Resumen de Identificadores y Constantes

- **Workspace ID:** `10`
- **Código / Ruta del Módulo:** `/epivox`
- **Nombre:** `Epivox`
- **Roles:**
  - `100`: `Epivox_Admin` (Gestión completa, temas, plantillas, configuración y analítica)
  - `101`: `Epivox_Creator` (Creación y edición de actividades y diapositivas)
  - `102`: `Epivox_Presenter` (Lanzamiento y moderación de presentaciones y control remoto)
  - *(Nota: El rol global `1` (`Administrador`) tiene acceso automático a todas las páginas de Epivox)*
- **Rango de Páginas:** `1000` a `1010`
- **Rutas Públicas (sin SSO / sin login):** `/epivox/join` y `/epivox/live/:pin`

---

## 2. Base de Datos Dual (DuckDB + Databricks)

### 2.1. Estructura DDL en Logistech (`schema.sql` y `schema_databricks.sql`)

Agregar al final de `schema.sql` (DuckDB):

```sql
-- ============================================================================
-- MÓDULO EPIVOX (WORKSPACE 10) - DDL DUCKDB
-- ============================================================================

CREATE TABLE IF NOT EXISTS epivox_themes (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  primary_color VARCHAR NOT NULL DEFAULT '#FFC72C',
  secondary_color VARCHAR NOT NULL DEFAULT '#001E32',
  background_color VARCHAR NOT NULL DEFAULT '#001E32',
  card_color VARCHAR NOT NULL DEFAULT '#193750',
  text_color VARCHAR NOT NULL DEFAULT '#FFFFFF',
  accent_color VARCHAR NOT NULL DEFAULT '#48A9C5',
  font_family VARCHAR NOT NULL DEFAULT 'Raleway, sans-serif',
  logo_url VARCHAR,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_activities (
  id INTEGER PRIMARY KEY,
  title VARCHAR NOT NULL,
  description VARCHAR,
  category VARCHAR NOT NULL DEFAULT 'Capacitación',
  activity_type VARCHAR NOT NULL DEFAULT 'quiz',
  theme_id INTEGER REFERENCES epivox_themes(id),
  created_by_user_id INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  default_time_limit INTEGER NOT NULL DEFAULT 30,
  default_points INTEGER NOT NULL DEFAULT 1000,
  speed_bonus_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  negative_points_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_questions (
  id INTEGER PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES epivox_activities(id),
  sort_order INTEGER NOT NULL DEFAULT 1,
  question_text VARCHAR NOT NULL,
  question_type VARCHAR NOT NULL,
  time_limit INTEGER NOT NULL DEFAULT 30,
  points_base INTEGER NOT NULL DEFAULT 1000,
  media_type VARCHAR DEFAULT 'none',
  media_url VARCHAR,
  reveal_step_count INTEGER NOT NULL DEFAULT 1,
  chart_type VARCHAR NOT NULL DEFAULT 'bar',
  options_json VARCHAR NOT NULL DEFAULT '[]',
  correct_answer_value VARCHAR,
  explanation_text VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_sessions (
  id INTEGER PRIMARY KEY,
  pin VARCHAR NOT NULL UNIQUE,
  activity_id INTEGER NOT NULL REFERENCES epivox_activities(id),
  presenter_user_id INTEGER NOT NULL DEFAULT 1,
  status VARCHAR NOT NULL DEFAULT 'lobby',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  current_step VARCHAR NOT NULL DEFAULT 'question',
  session_mode VARCHAR NOT NULL DEFAULT 'live',
  anonymous_mode BOOLEAN NOT NULL DEFAULT FALSE,
  max_participants INTEGER NOT NULL DEFAULT 500,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_participants (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES epivox_sessions(id),
  nickname VARCHAR NOT NULL,
  avatar_seed VARCHAR NOT NULL DEFAULT 'default',
  email VARCHAR,
  department VARCHAR,
  team_name VARCHAR,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  socket_id VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_answers (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES epivox_sessions(id),
  question_id INTEGER NOT NULL REFERENCES epivox_questions(id),
  participant_id INTEGER NOT NULL REFERENCES epivox_participants(id),
  answer_payload VARCHAR NOT NULL,
  is_correct BOOLEAN,
  time_taken_ms INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_audience_questions (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES epivox_sessions(id),
  participant_id INTEGER NOT NULL REFERENCES epivox_participants(id),
  question_text VARCHAR NOT NULL,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_epivox_sessions_pin ON epivox_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_epivox_participants_session ON epivox_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_epivox_answers_session_question ON epivox_answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_epivox_questions_activity ON epivox_questions(activity_id);
```

Agregar al final de `schema_databricks.sql` (PostgreSQL / Lakebase):

```sql
-- ============================================================================
-- MÓDULO EPIVOX (WORKSPACE 10) - DDL DATABRICKS / POSTGRESQL
-- ============================================================================

CREATE TABLE IF NOT EXISTS epivox_themes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  primary_color VARCHAR(50) NOT NULL DEFAULT '#FFC72C',
  secondary_color VARCHAR(50) NOT NULL DEFAULT '#001E32',
  background_color VARCHAR(50) NOT NULL DEFAULT '#001E32',
  card_color VARCHAR(50) NOT NULL DEFAULT '#193750',
  text_color VARCHAR(50) NOT NULL DEFAULT '#FFFFFF',
  accent_color VARCHAR(50) NOT NULL DEFAULT '#48A9C5',
  font_family VARCHAR(255) NOT NULL DEFAULT 'Raleway, sans-serif',
  logo_url VARCHAR(500),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_activities (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'Capacitación',
  activity_type VARCHAR(50) NOT NULL DEFAULT 'quiz',
  theme_id BIGINT REFERENCES epivox_themes(id),
  created_by_user_id BIGINT NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  default_time_limit INT NOT NULL DEFAULT 30,
  default_points INT NOT NULL DEFAULT 1000,
  speed_bonus_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  negative_points_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_questions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  activity_id BIGINT NOT NULL REFERENCES epivox_activities(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  time_limit INT NOT NULL DEFAULT 30,
  points_base INT NOT NULL DEFAULT 1000,
  media_type VARCHAR(50) DEFAULT 'none',
  media_url VARCHAR(500),
  reveal_step_count INT NOT NULL DEFAULT 1,
  chart_type VARCHAR(50) NOT NULL DEFAULT 'bar',
  options_json TEXT NOT NULL DEFAULT '[]',
  correct_answer_value TEXT,
  explanation_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_sessions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  pin VARCHAR(20) NOT NULL UNIQUE,
  activity_id BIGINT NOT NULL REFERENCES epivox_activities(id) ON DELETE CASCADE,
  presenter_user_id BIGINT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'lobby',
  current_question_index INT NOT NULL DEFAULT 0,
  current_step VARCHAR(50) NOT NULL DEFAULT 'question',
  session_mode VARCHAR(50) NOT NULL DEFAULT 'live',
  anonymous_mode BOOLEAN NOT NULL DEFAULT FALSE,
  max_participants INT NOT NULL DEFAULT 500,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_participants (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES epivox_sessions(id) ON DELETE CASCADE,
  nickname VARCHAR(100) NOT NULL,
  avatar_seed VARCHAR(100) NOT NULL DEFAULT 'default',
  email VARCHAR(255),
  department VARCHAR(100),
  team_name VARCHAR(100),
  score INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  socket_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_answers (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES epivox_sessions(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES epivox_questions(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES epivox_participants(id) ON DELETE CASCADE,
  answer_payload TEXT NOT NULL,
  is_correct BOOLEAN,
  time_taken_ms INT NOT NULL DEFAULT 0,
  points_awarded INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_audience_questions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES epivox_sessions(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES epivox_participants(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  upvotes_count INT NOT NULL DEFAULT 0,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_epivox_sessions_pin ON epivox_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_epivox_participants_session ON epivox_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_epivox_answers_session_question ON epivox_answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_epivox_questions_activity ON epivox_questions(activity_id);
```

### 2.2. Borrado Jerárquico en Logistech (`drop_tables_databricks.sql`)

Agregar en `drop_tables_databricks.sql` al inicio del bloque de tablas de negocio (respetando orden inverso de FK):

```sql
DROP TABLE IF EXISTS epivox_audience_questions CASCADE;
DROP TABLE IF EXISTS epivox_answers CASCADE;
DROP TABLE IF EXISTS epivox_participants CASCADE;
DROP TABLE IF EXISTS epivox_sessions CASCADE;
DROP TABLE IF EXISTS epivox_questions CASCADE;
DROP TABLE IF EXISTS epivox_activities CASCADE;
DROP TABLE IF EXISTS epivox_themes CASCADE;
```

---

## 3. Seeds Maestros y Navegación Dinámica (`init_values.sql`)

### 3.1. En `init_values.sql` (DuckDB):

```sql
-- 1. Registrar Workspace 10
INSERT INTO workspaces (id, name, description, icon, route, is_active)
VALUES (10, 'Epivox', 'Gamificación y Presentaciones Interactivas en Vivo', 'Sparkles', '/epivox', true);

-- 2. Registrar Roles Epivox
INSERT INTO roles (id, name, description) VALUES
(100, 'Epivox_Admin', 'Administrador total de Epivox (Temas, actividades, reportes y configuración)'),
(101, 'Epivox_Creator', 'Diseñador y creador de contenidos y evaluaciones gamificadas'),
(102, 'Epivox_Presenter', 'Moderador y presentador de sesiones en tiempo real');

-- 3. Registrar Páginas de Epivox (Rango 1000 - 1010)
INSERT INTO pages (id, workspace_id, name, route, icon, sort_order) VALUES
(1000, 10, 'Epivox Hub', '/epivox', 'LayoutGrid', 1),
(1001, 10, 'Mis Actividades', '/epivox/activities', 'List', 2),
(1002, 10, 'Editor de Diapositivas', '/epivox/editor/:id', 'Edit3', 3),
(1003, 10, 'Banco de Plantillas', '/epivox/templates', 'Layers', 4),
(1004, 10, 'Proyección en Vivo (16:9)', '/epivox/present/:pin', 'Tv', 5),
(1005, 10, 'Control Remoto Móvil', '/epivox/remote/:pin', 'Smartphone', 6),
(1006, 10, 'Reportes y Analíticas', '/epivox/reports/:id', 'BarChart2', 7),
(1007, 10, 'Gestor de Temas', '/epivox/themes', 'Palette', 8);

-- 4. Matriz de Permisos (role_pages)
-- Admin Global (1) y Epivox_Admin (100) -> Acceso total
INSERT INTO role_pages (role_id, page_id) VALUES
(1, 1000), (1, 1001), (1, 1002), (1, 1003), (1, 1004), (1, 1005), (1, 1006), (1, 1007),
(100, 1000), (100, 1001), (100, 1002), (100, 1003), (100, 1004), (100, 1005), (100, 1006), (100, 1007);

-- Epivox_Creator (101) -> Creación, Plantillas y Reportes
INSERT INTO role_pages (role_id, page_id) VALUES
(101, 1000), (101, 1001), (101, 1002), (101, 1003), (101, 1006);

-- Epivox_Presenter (102) -> Hub, Presentación y Control Remoto
INSERT INTO role_pages (role_id, page_id) VALUES
(102, 1000), (102, 1001), (102, 1004), (102, 1005), (102, 1006);

-- 5. Temas Corporativos Maestros
INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES 
(1, 'Epiroc Dark Classic', '#FFC72C', '#001E32', '#001E32', '#193750', '#FFFFFF', '#48A9C5', 'Raleway, sans-serif', true),
(2, 'Epiroc Light Mining', '#001E32', '#FFC72C', '#ECEBE4', '#FFFFFF', '#001E32', '#B7312C', 'Raleway, sans-serif', false);

-- 6. Actividad Maestra Demostrativa
INSERT INTO epivox_activities (id, title, description, category, activity_type, theme_id, created_by_user_id, is_template, is_public, default_time_limit, default_points, speed_bonus_enabled)
VALUES (1, 'Seguridad Operacional y Cultura Epiroc', 'Cuestionario interactivo gamificado para inducción de seguridad, procedimientos LOTO y valores corporativos.', 'Seguridad', 'quiz', 1, 1, true, true, 30, 1000, true);
```

### 3.2. En `init_values_databricks.sql` (Databricks Lakebase)

Duplicar exclusivamente los registros maestros usando `ON CONFLICT DO NOTHING`:

```sql
INSERT INTO workspaces (id, name, description, icon, route, is_active)
VALUES (10, 'Epivox', 'Gamificación y Presentaciones Interactivas en Vivo', 'Sparkles', '/epivox', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
(100, 'Epivox_Admin', 'Administrador total de Epivox (Temas, actividades, reportes y configuración)'),
(101, 'Epivox_Creator', 'Diseñador y creador de contenidos y evaluaciones gamificadas'),
(102, 'Epivox_Presenter', 'Moderador y presentador de sesiones en tiempo real')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pages (id, workspace_id, name, route, icon, sort_order) VALUES
(1000, 10, 'Epivox Hub', '/epivox', 'LayoutGrid', 1),
(1001, 10, 'Mis Actividades', '/epivox/activities', 'List', 2),
(1002, 10, 'Editor de Diapositivas', '/epivox/editor/:id', 'Edit3', 3),
(1003, 10, 'Banco de Plantillas', '/epivox/templates', 'Layers', 4),
(1004, 10, 'Proyección en Vivo (16:9)', '/epivox/present/:pin', 'Tv', 5),
(1005, 10, 'Control Remoto Móvil', '/epivox/remote/:pin', 'Smartphone', 6),
(1006, 10, 'Reportes y Analíticas', '/epivox/reports/:id', 'BarChart2', 7),
(1007, 10, 'Gestor de Temas', '/epivox/themes', 'Palette', 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_pages (role_id, page_id) VALUES
(1, 1000), (1, 1001), (1, 1002), (1, 1003), (1, 1004), (1, 1005), (1, 1006), (1, 1007),
(100, 1000), (100, 1001), (100, 1002), (100, 1003), (100, 1004), (100, 1005), (100, 1006), (100, 1007),
(101, 1000), (101, 1001), (101, 1002), (101, 1003), (101, 1006),
(102, 1000), (102, 1001), (102, 1004), (102, 1005), (102, 1006)
ON CONFLICT DO NOTHING;

INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES 
(1, 'Epiroc Dark Classic', '#FFC72C', '#001E32', '#001E32', '#193750', '#FFFFFF', '#48A9C5', 'Raleway, sans-serif', true),
(2, 'Epiroc Light Mining', '#001E32', '#FFC72C', '#ECEBE4', '#FFFFFF', '#001E32', '#B7312C', 'Raleway, sans-serif', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO epivox_activities (id, title, description, category, activity_type, theme_id, created_by_user_id, is_template, is_public, default_time_limit, default_points, speed_bonus_enabled)
VALUES (1, 'Seguridad Operacional y Cultura Epiroc', 'Cuestionario interactivo gamificado para inducción de seguridad, procedimientos LOTO y valores corporativos.', 'Seguridad', 'quiz', 1, 1, true, true, 30, 1000, true)
ON CONFLICT (id) DO NOTHING;
```

---

## 4. Reinicio Modular de Base de Datos (`server/services/dbResetService.ts`)

En `server/services/dbResetService.ts`, registrar el módulo `epivox` en el objeto `RESET_MODULES`:

```typescript
epivox: {
  name: "Epivox (Gamificación y Presentaciones)",
  description: "Sesiones en vivo, participantes, respuestas, diapositivas y temas de presentación",
  tables: [
    "epivox_audience_questions",
    "epivox_answers",
    "epivox_participants",
    "epivox_sessions",
    "epivox_questions",
    "epivox_activities",
    "epivox_themes",
    "role_pages",
    "pages"
  ],
  reseed: true
},
```

*(Conforme a la **Regla 6c**, incluir `role_pages` y `pages` asegura que al resetear solo el módulo Epivox se re-siembre su navegación sin afectar al core de Logistech).*

---

## 5. Mapeo de Archivos Frontend y Backend

| Archivo en Epivox Standalone | Destino en Logistech |
|---|---|
| `server/services/activityService.ts` | `server/services/epivox/activityService.ts` |
| `server/services/sessionService.ts` | `server/services/epivox/sessionService.ts` |
| `server/services/scoringService.ts` | `server/services/epivox/scoringService.ts` |
| `server/services/socketManager.ts` | `server/services/epivox/socketManager.ts` |
| `server/routes/epivox.routes.ts` | `server/routes/epivox.routes.ts` |
| `client/src/pages/JoinPage.tsx` | `client/src/pages/epivox/JoinPage.tsx` |
| `client/src/pages/LiveParticipantPage.tsx` | `client/src/pages/epivox/LiveParticipantPage.tsx` |
| `client/src/pages/PresentationPage.tsx` | `client/src/pages/epivox/PresentationPage.tsx` |
| `client/src/pages/PresenterRemotePage.tsx` | `client/src/pages/epivox/PresenterRemotePage.tsx` |
| `client/src/pages/ActivityEditorPage.tsx` | `client/src/pages/epivox/ActivityEditorPage.tsx` |
| `client/src/pages/TemplatesPage.tsx` | `client/src/pages/epivox/TemplatesPage.tsx` |
| `client/src/pages/SessionReportPage.tsx` | `client/src/pages/epivox/SessionReportPage.tsx` |
| `client/src/services/socket.ts` | `client/src/services/epivoxSocket.ts` |

---

## 6. Montaje en Servidor Express (`server/index.ts`)

1. **Rutas REST:**
   ```typescript
   import epivoxRoutes from "./routes/epivox.routes.js";
   app.use("/api/epivox", epivoxRoutes);
   ```

2. **Inicialización de WebSockets:**
   ```typescript
   import { initEpivoxSockets } from "./services/epivox/socketManager.js";
   // Conectar al socketServer io existente de Logistech:
   initEpivoxSockets(io);
   ```

---

## 7. Montaje en Enrutador Frontend (`client/src/App.tsx`)

Montar las rutas de Epivox en `client/src/App.tsx`:

```tsx
// Rutas Protegidas dentro de Layout Institucional de Logistech:
<Route path="/epivox" element={<ProtectedRoute requiredWorkspaceId={10}><WorkspaceLayout><EpivoxHubPage /></WorkspaceLayout></ProtectedRoute>} />
<Route path="/epivox/activities" element={<ProtectedRoute requiredWorkspaceId={10}><WorkspaceLayout><ActivityEditorPage /></WorkspaceLayout></ProtectedRoute>} />
<Route path="/epivox/editor/:id" element={<ProtectedRoute requiredWorkspaceId={10}><WorkspaceLayout><ActivityEditorPage /></WorkspaceLayout></ProtectedRoute>} />
<Route path="/epivox/templates" element={<ProtectedRoute requiredWorkspaceId={10}><WorkspaceLayout><TemplatesPage /></WorkspaceLayout></ProtectedRoute>} />
<Route path="/epivox/reports/:id" element={<ProtectedRoute requiredWorkspaceId={10}><WorkspaceLayout><SessionReportPage /></WorkspaceLayout></ProtectedRoute>} />

// Rutas Especiales de Pantalla Completa / Operación Móvil:
<Route path="/epivox/present/:pin" element={<ProtectedRoute requiredWorkspaceId={10}><PresentationPage /></ProtectedRoute>} />
<Route path="/epivox/remote/:pin" element={<ProtectedRoute requiredWorkspaceId={10}><PresenterRemotePage /></ProtectedRoute>} />

// Rutas Públicas de Audiencia (Cero SSO / Acceso Inmediato por PIN o QR):
<Route path="/epivox/join" element={<JoinPage />} />
<Route path="/epivox/live/:pin" element={<LiveParticipantPage />} />
```

---

## 8. Verificación de Guardias de Arquitectura

Antes de entregar el PR en Logistech, ejecutar:

1. `npm run guard:databricks`: Validar que no se hayan sembrado tablas transaccionales en Databricks.
2. `npm run guard:admin`: Validar que páginas 700-799 no sean modificadas fuera del módulo de administración.
3. `npm run db:regen`: Validar regeneración dual completa sin errores.
4. `npm run build`: Validar compilación TypeScript 100% limpia.
