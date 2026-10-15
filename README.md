# Epivox ⚡

Plataforma corporativa de **gamificación y presentaciones interactivas en vivo** para Epiroc y el ecosistema Logistech (inspirada en la dinámica interactiva de Kahoot! + Mentimeter).

---

## 🌟 Características Principales

- **Proyección en Vivo 16:9 4K (`/present/:pin`):**
  - Código QR dinámico para conexión instantánea desde teléfonos móviles.
  - Sala de espera interactiva con burbujas de participantes en vivo.
  - Gráficos animados (Barras, Donas, etc.) revelando votos en tiempo real.
  - Podio 3D con confeti institucional en colores Epiroc (`#FFC72C`, `#001E32`, `#48A9C5`).
- **Experiencia de Audiencia Mobile-First (`/join` y `/live/:pin`):**
  - Acceso inmediato con PIN de 6 dígitos sin necesidad de registro ni SSO.
  - Generador automático de apodos y avatares corporativos.
  - Botones táctiles de respuesta ultrarrápida (Quiz 4 opciones geométricas, V/F, Escala Likert, Nube de palabras).
  - Temporizador autoritativo sincronizado por WebSockets (< 500 ms de latencia).
  - Reacciones flotantes de audiencia en tiempo real (❤️, 👏, 🔥, 💡).
- **Control Remoto del Presentador (`/remote/:pin`):**
  - Panel privado táctil para el smartphone del expositor.
  - Vista previa de la diapositiva actual y siguiente, con notas del orador.
  - Acciones rápidas: +10s al temporizador, pausar votación, cerrar respuestas y lanzar podio.
- **Suite de Creación y Edición (`/editor/:id`):**
  - Organizador de diapositivas con arrastre visual y previsualización de miniaturas.
  - Configuración granular de tiempos, puntajes base y bonificaciones por velocidad.
- **Banco de Plantillas Corporativas (`/templates`):**
  - Catálogo de actividades listas para clonar en 1 clic (Seguridad y Bloqueo LOTO, Cultura Epiroc, Clima Laboral y Retrospectivas).
- **Business Intelligence Post-Evento (`/reports/:id`):**
  - Resumen de KPIs: Participación efectiva, tiempo de respuesta y acierto promedio.
  - Detección automática de "Áreas de Refuerzo / Oportunidades de Aprendizaje" (preguntas con mayor índice de error).
  - Ranking completo de asistentes y exportación a Excel / CSV.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Recharts, Canvas Confetti, QRCode.
- **Backend:** Node.js, Express 4.19, Socket.io, TypeScript NodeNext.
- **Persistencia Dual:**
  - **Local:** DuckDB (`local.db`) para desarrollo ágil y autosuficiente.
  - **Cloud:** Databricks / PostgreSQL Lakebase (`schema_databricks.sql`).
- **Identidad Visual:** 100% apego a la paleta oficial Epiroc y tipografía institucional **Raleway**.

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Requisitos
- Node.js >= 18
- npm >= 9

### 2. Instalación de Dependencias
```bash
# Instalar dependencias raíz, cliente y servidor
npm install
npm --prefix client install
npm --prefix server install
```

### 3. Inicializar Base de Datos (Seeds Maestros)
```bash
npm run db:regen
```

### 4. Iniciar Servidores de Desarrollo
```bash
# Ejecuta en paralelo el backend (puerto 3000) y cliente Vite (puerto 5173)
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend REST & WebSockets:** `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
Epivox/
├── client/                      # Aplicación React 19 + Tailwind v4 + Vite
│   ├── src/
│   │   ├── components/          # PageHeader, Modal, componentes compartidos
│   │   ├── pages/               # Vistas (Hub, Presenter, Live, Remote, Editor, Templates, Reports)
│   │   ├── services/            # Cliente Socket.io y llamadas REST
│   │   └── index.css            # Tokens de diseño corporativo Epiroc
├── server/                      # API Express + WebSockets + Conector DuckDB
│   ├── db/                      # db.ts (DuckDB conector) y regen.ts (bootstrap)
│   ├── routes/                  # epivox.routes.ts
│   ├── services/                # activityService, sessionService, scoringService, socketManager
│   └── index.ts                 # Servidor HTTP y Socket.io
├── schema.sql                   # DDL estructural para DuckDB
├── schema_databricks.sql        # DDL compatible con Databricks Lakebase
├── init_values.sql              # Seeds maestros y demo para DuckDB
├── init_values_databricks.sql   # Seeds maestros puros para Databricks (Regla 6d)
├── drop_tables_databricks.sql   # Sentencias de borrado jerárquico FK
├── INTEGRACION_LOGISTECH.md     # Manifiesto de integración a Workspace 10 de Logistech
└── PLAN_IMPLEMENTACION.md       # Hoja de ruta completa de desarrollo y QA
```

---

## 🤝 Integración con Logistech

Epivox está diseñado para operar tanto de forma autónoma como integrado de manera nativa como **Workspace 10** en el ERP corporativo Logistech de Epiroc. Consulta la [Guía de Integración](INTEGRACION_LOGISTECH.md) para conocer las sentencias DDL/DML, roles (`100`, `101`, `102`) y el mapeo en `dbResetService.ts`.

---

© 2026 Epiroc. Todos los derechos reservados.
