# Plan de Implementación y Lista Detallada de Tareas por Fases
## Módulo Epivox: Plataforma Corporativa de Gamificación y Presentaciones Interactivas

- **Proyecto:** Epivox (Ecosistema Logistech - Epiroc)
- **Modalidad:** Desarrollo Aislado (Standalone) en carpeta actual ➔ Integración Nativa a Logistech (Workspace 10)
- **Referencia Funcional:** [requerimirntos.md](file:///c:/Users/CLEJPA/OneDrive%20-%20Epiroc/Skrivbordet/Epiroc/Proyectos%20%20Web/Epivox/requerimirntos.md) (RF-01 a RF-40)
- **Stack Técnico:** React 19 + TypeScript + Tailwind CSS v4 + Express 4.19 + DuckDB (local) / Databricks (cloud) + Socket.io + Recharts + Lucide Icons + Raleway

---

## Estructura General de Fases

```
Fase 0: Andamiaje, Tooling y Configuración Inicial (Standalone)
Fase 1: Capa de Persistencia y Base de Datos Dual (DuckDB + Databricks)
Fase 2: Motor de Backend y Protocolo WebSockets en Tiempo Real
Fase 3: Experiencia Móvil de la Audiencia / Participantes (Mobile-First)
Fase 4: Pantalla Principal de Presentación en Vivo (Full Screen 16:9)
Fase 5: Panel del Presentador y Control Remoto Móvil
Fase 6: Suite de Creación: Editor de Actividades y Banco de Preguntas
Fase 7: Motor de Analítica, Dashboard y Exportación de Reportes
Fase 8: Validación de Calidad (QA Visual Bloqueante con Chrome DevTools MCP)
Fase 9: Fusión e Integración Nativa en Logistech (Workspace 10)
```

---

## Desglose Detallado de Tareas por Fase

### Fase 0: Andamiaje, Tooling y Configuración Inicial (Standalone)
> **Objetivo:** Configurar el entorno full-stack local para que el proyecto pueda arrancar con `npm run dev` de forma 100% independiente para pruebas.

- [x] **Tarea 0.1: Configuración de Entorno Raíz**
  - Crear `package.json` raíz con scripts de orquestación (`dev`, `build`, `lint`, `format`, `db:regen`).
  - Configurar `.gitignore` (excluyendo `node_modules`, `local.db`, `local.db.wal`, `dist/`).
  - Configurar `tsconfig.json` compartido con reglas estrictas de TypeScript (`noImplicitAny`, `strictNullChecks`).
  - Configurar Prettier y ESLint según estándares Epiroc.

- [x] **Tarea 0.2: Inicialización de `client/` (Frontend React 19)**
  - Inicializar Vite con React 19 y TypeScript (`client/vite.config.ts` con proxy a `/api` y soporte WebSocket).
  - Instalar dependencias: `@tailwindcss/vite`, `tailwindcss` (v4), `lucide-react`, `socket.io-client`, `recharts`, `canvas-confetti`, `qrcode`.
  - Configurar tipografía corporativa **Raleway** desde Google Fonts o `@fontsource/raleway` en `client/src/index.css`.
  - Configurar paleta estricta oficial Epiroc en `client/src/index.css`:
    - `--color-epiroc-yellow`: `#FFC72C`
    - `--color-epiroc-dark-blue`: `#001E32`
    - `--color-epiroc-grey`: `#425563`
    - `--color-epiroc-light-grey`: `#ECEBE4`
    - `--color-epiroc-light-blue`: `#48A9C5`
    - `--color-epiroc-red`: `#B7312C`
    - `--color-epiroc-green`: `#4C8C2B`

- [x] **Tarea 0.3: Inicialización de `server/` (Backend Express + DuckDB)**
  - Crear `server/package.json` con scripts (`dev`, `build`, `start`, `db:regen`).
  - Instalar dependencias: `express`, `duckdb`, `socket.io`, `cors`, `dotenv`, `tsx`, `@types/node`, `@types/express`.
  - Crear conector DuckDB promisificado en `server/db/db.ts` con soporte para consultas parametrizadas.
  - Crear script de bootstrap e inicialización en `server/db/regen.ts`.
  - Crear middleware de autenticación con fallback SSO (`server/middleware/auth.ts`) usando `x-user-email` y fallback local para desarrollo.

---

### Fase 1: Capa de Persistencia y Base de Datos Dual (DuckDB + Databricks)
> **Objetivo:** Definir la estructura relacional completa en DDL (`schema.sql`) y los datos maestros de inicialización en DML (`init_values.sql`) respetando la separación estricta de la Regla 6b.

- [x] **Tarea 1.1: Creación de `schema.sql` (DuckDB)**
  - Tabla `epivox_themes`: Paletas de color corporativas, logos y fuentes.
  - Tabla `epivox_activities`: Cabecera de actividades/cuestionarios (título, categoría, configuración de tiempo, bonos).
  - Tabla `epivox_questions`: Preguntas polimórficas (11 tipos), límites de tiempo, puntaje base, opciones JSON, URLs de medios.
  - Tabla `epivox_sessions`: Instancias en vivo (PIN de 6 dígitos único, estado, pregunta actual, modo).
  - Tabla `epivox_participants`: Participantes conectados (PIN, nickname, avatar, puntaje acumulado, racha actual/mejor).
  - Tabla `epivox_answers`: Respuestas enviadas (tiempo de respuesta en ms, acierto, puntaje otorgado).
  - Tabla `epivox_audience_questions`: Preguntas enviadas por la audiencia en dinámicas Q&A.
  - Índices de alto rendimiento en PIN, actividad y sesión para garantizar tiempos de respuesta < 200 ms.

- [x] **Tarea 1.2: Creación de `init_values.sql` (DML Seeds)**
  - Sembrar temas corporativos: Tema "Epiroc Dark Classic" y "Epiroc Mining Yellow".
  - Sembrar cuestionario demostrativo maestro: *"Seguridad Operacional y Cultura Epiroc"* con ejemplos de los 11 tipos de preguntas.
  - Sembrar plantillas de inicio rápido (Capacitación, Icebreaker, Feedback NPS).

- [x] **Tarea 1.3: Sincronización Dual para Databricks (Reglas 6b, 6c y 6d)**
  - Crear `schema_databricks.sql` adaptando tipos de datos (`BIGINT GENERATED BY DEFAULT AS IDENTITY`).
  - Crear `init_values_databricks.sql` clasificando solo tablas de catálogo MASTER (sin datos transaccionales de sesiones ni respuestas).
  - Crear `drop_tables_databricks.sql` con borrado en orden inverso de dependencias jerárquicas FK.
  - Verificar ejecución limpia con `npm run db:regen`.

---

### Fase 2: Motor de Backend y Protocolo WebSockets en Tiempo Real
> **Objetivo:** Implementar la lógica de negocio en servicios, controladores REST y la arquitectura de salas en Socket.io para soportar hasta 500+ participantes simultáneos con latencia < 500ms.

- [x] **Tarea 2.1: Servicios de Dominio (`server/services/`)**
  - `activityService.ts`: CRUD de actividades y preguntas, validación de esquemas JSON de opciones.
  - `sessionService.ts`: Generación y validación de PIN alfanumérico único de 6 dígitos; máquina de estados de la sesión (`lobby` ➔ `question_intro` ➔ `voting_active` ➔ `question_closed` ➔ `results_reveal` ➔ `leaderboard` ➔ `podium`).
  - `scoringService.ts`: Algoritmo de cálculo de puntos:
    $$\text{Puntos} = \text{Base} \times \left(1 - \frac{\text{TiempoRespuesta}}{2 \times \text{TiempoLímite}}\right) \times \text{MultiplicadorRacha}$$
  - `analyticsService.ts`: Agregación en tiempo real de recuento de votos, cálculo de promedios para Likert y frecuencias de palabras.

- [x] **Tarea 2.2: Servidor WebSocket (`server/services/socketManager.ts`)**
  - Manejo de salas por PIN: `room:session_${pin}` y `room:presenter_${pin}`.
  - Temporizador maestro autoritativo en el servidor (el servidor emite `timer:tick` cada segundo para evitar desfases o trampas de clientes).
  - Eventos de participantes: `participant:join`, `answer:submit`, `reaction:tap`, `qa:ask`, `qa:vote`.
  - Eventos de presentador: `session:start`, `question:advance`, `voting:stop`, `answers:reveal`, `leaderboard:show`, `session:end`.

- [x] **Tarea 2.3: Controladores y Rutas REST (`server/routes/` y `server/controllers/`)**
  - Endpoint para crear y listar actividades: `/api/epivox/activities`.
  - Endpoint para clonar plantillas: `/api/epivox/templates/:id/clone`.
  - Endpoint para inicializar sesión en vivo: `/api/epivox/sessions/create`.
  - Endpoint para validar PIN de participante: `/api/epivox/sessions/:pin/validate`.
  - Endpoint para exportar resultados: `/api/epivox/sessions/:id/export`.

---

### Fase 3: Experiencia Móvil de la Audiencia / Participantes (Mobile-First)
> **Objetivo:** Desarrollar la interfaz móvil para la audiencia, accesible mediante escaneo de código QR o PIN, optimizada para smartphones sin necesidad de crear cuenta ni instalar apps.

- [x] **Tarea 3.1: Pantalla de Ingreso (`/epivox/join`)**
  - Input táctil de PIN de 6 dígitos con autofoco y separación visual por dígitos.
  - Selector de nickname corporativo, generación aleatoria de nombres divertidos relacionados con minería ("Explorador Epiroc", "Perforador Pro").
  - Selector de avatar visual corporativo.
  - Soporte para autollenado de PIN vía query params (`/epivox/join?pin=123456`).

- [x] **Tarea 3.2: Sala de Espera Móvil (Lobby)**
  - Pantalla de bienvenida con nombre de la sesión, logo oficial Epiroc y animación de pulso de conexión en tiempo real.
  - Contador de participantes conectados.

- [x] **Tarea 3.3: Componentes de Respuesta Móvil (Polimorfismo Táctil)**
  - **Componente Quiz / Selección Múltiple:** 4 botones de gran tamaño táctil con formas geométricas distintivas (Triángulo Amarillo, Cuadrado Azul, Círculo Verde, Rombo Rojo) y contraste WCAG 2.1 AA.
  - **Componente Verdadero/Falso:** 2 botones gigantes de alto contraste.
  - **Componente Nube de Palabras / Respuesta Abierta:** Input de texto rápido con contador de caracteres y botón de envío directo.
  - **Componente Escala Likert & NPS:** Selector táctil horizontal (1-5 o 0-10) con feedback visual de intensidad.
  - **Componente Ranking / Ordenamiento:** Lista interactiva con capacidad drag & drop o flechas táctiles de reordenamiento.
  - **Componente Q&A:** Formulario para enviar preguntas a la sala y lista para votar las preguntas más votadas por compañeros.

- [x] **Tarea 3.4: Feedback Visual Inmediato**
  - Pantalla de confirmación tras votar: *"¡Respuesta enviada! Esperando al presentador..."*
  - Pantalla de revelación de resultados: Banner de "¡Correcto! (+950 pts)" o "¡Ups! Incorrecto" con puntos ganados y racha actual de respuestas seguidas.
  - Pantalla final de posición personal en el ranking al terminar la sesión.

---

### Fase 4: Pantalla Principal de Presentación en Vivo (Full Screen 16:9)
> **Objetivo:** Crear la vista de alta definición que se proyecta en salones, auditorios o se transmite en Teams/Zoom.

- [x] **Tarea 4.1: Vista de Proyección (`/epivox/present/:pin`)**
  - Modo pantalla completa con atajo de teclado (`F11` o botón dedicado).
  - Barra superior institucional: Logotipo Epiroc, título del evento, código PIN y estado de conexión.
  - Generador dinámico de Código QR en pantalla grande con la URL directa de la sesión para escaneo instantáneo desde los asientos.

- [x] **Tarea 4.2: Visualización del Lobby en Pantalla Grande**
  - Animación de entrada de participantes (burbujas con avatares y nicknames que aparecen flotando).
  - Indicador numérico de participantes conectados en tiempo real.
  - Botón de control: *"Iniciar Cuestionario"*.

- [x] **Tarea 4.3: Vista de Pregunta Activa**
  - Tipografía Raleway en tamaño titánico visible desde el fondo del auditorio.
  - Contador regresivo animado con alerta visual en los últimos 5 segundos.
  - Contador dinámico de respuestas: *"142 de 150 han respondido"*.
  - Despliegue de imagen/video adjunto con modo "Adivina la Imagen" (desenfoque progresivo).

- [x] **Tarea 4.4: Gráficos de Resultados en Vivo (Recharts + SVG)**
  - **Gráfico de Barras Animado:** Las barras se elevan dinámicamente con las respuestas.
  - **Nube de Palabras en Vivo:** Palabras con mayor frecuencia crecen en el centro de la pantalla.
  - **Gráfico Donut y Torta:** Para distribuciones porcentuales.
  - **Medidor de NPS:** Gráfico tipo velocímetro con aguja dinámica.
  - Revelación destacada de la opción correcta con transición visual elegante.

- [x] **Tarea 4.5: Leaderboard y Podio de Ganadores**
  - Tabla de posiciones Top 5 con animación de escalafón.
  - Pantalla de Podio Final (1°, 2° y 3° lugar) con música de celebración, avatares triunfantes y lluvia de confeti corporativo (`canvas-confetti`).

---

### Fase 5: Panel del Presentador y Control Remoto Móvil
> **Objetivo:** Permitir al presentador controlar la sesión desde su ordenador o remotamente desde su propio teléfono móvil mientras se desplaza por el auditorio.

- [x] **Tarea 5.1: Panel de Control Remoto (`/epivox/remote/:pin`)**
  - Autenticación rápida de presentador.
  - Vista previa de la diapositiva actual y tarjeta con la siguiente pregunta.
  - Notas privadas del orador con recordatorios clave.
  - Botonera maestra de control:
    - *Iniciar Votación*
    - *Pausar Cronómetro*
    - *+10 Segundos*
    - *Cerrar Respuestas*
    - *Mostrar Resultados*
    - *Mostrar Tabla de Posiciones*
    - *Siguiente Pregunta*
  - Pestaña de Moderación Q&A: Bandeja de preguntas de la audiencia en tiempo real con acciones de *Aprobar*, *Destacar en Pantalla Grande* y *Marcar Respondida*.

---

### Fase 6: Suite de Creación: Editor de Actividades y Banco de Preguntas
> **Objetivo:** Diseñar la herramienta web para crear, duplicar y administrar actividades y cuestionarios.

- [x] **Tarea 6.1: Editor de Presentaciones (`/epivox/editor/:id`)**
  - Estructuración con el componente oficial `PageHeader` de Logistech.
  - Barra lateral de diapositivas con miniaturas y reordenamiento.
  - Formulario central de pregunta:
    - Selector de tipo de pregunta (11 tipos disponibles).
    - Asignador de tiempo límite (5 a 120 segundos).
    - Puntos base y selector de bonificación por velocidad.
    - Creador dinámico de opciones de respuesta con selector de respuesta correcta.
    - Selector de formato de gráfico de resultados (Barras, Donut, Torta, etc.).
    - Subida o vinculación de medios (imágenes corporativas).

- [x] **Tarea 6.2: Biblioteca de Plantillas y Banco de Preguntas (`/epivox/templates`)**
  - Catálogo de actividades prediseñadas listas para usar con 1 clic:
    1. *Evaluación de Seguridad y Bloqueo LOTO (Minería)*
    2. *Trivia de Historia e Innovación Epiroc*
    3. *Encuesta de Clima y Bienestar de Equipo (Likert + NPS)*
    4. *Lluvia de Ideas para Retrospectiva (Nube de palabras + Q&A)*
  - Buscador y filtrado por categoría y dificultad.
  - Modal de vista previa rápida y clonación en 1 clic.
  - Exportador e integrador directo a sesión en vivo.

---

### Fase 7: Motor de Analítica, Dashboard y Exportación de Reportes
> **Objetivo:** Procesar los resultados obtenidos en las sesiones para generar valor y toma de decisiones.

- [x] **Tarea 7.1: Dashboard Post-Sesión (`/epivox/reports/:id`)**
  - Indicadores clave: Tasa de participación efectiva, tiempo promedio por pregunta, porcentaje global de aciertos.
  - Análisis detallado pregunta por pregunta: detección automática de preguntas con mayor tasa de error ("Oportunidades de Capacitación / Refuerzo").
  - Tabla de participantes con puntajes, tiempos y porcentaje de acierto.

- [x] **Tarea 7.2: Motor de Exportación Multiformato**
  - Exportación a Excel / CSV formateada con ranking, departamentos, puntaje, aciertos y mejor racha.
  - Dashboard analítico con colores de semáforo Epiroc para efectividad del aprendizaje.

---

### Fase 8: Validación de Calidad (QA Visual Bloqueante con Chrome DevTools MCP)
> **Objetivo:** Cumplir con las Reglas 2, 4, 18, 19 y 20 antes de considerar la entrega válida.

- [x] **Tarea 8.1: Creación del Plan de Pruebas `qa_test_plan.md`**
  - Matriz de casos de prueba unitarios, de integración, rendimiento y visuales.
  - Escenario de prueba concurrente: 1 presentador + 2 participantes simultáneos emulados.

- [x] **Tarea 8.2: Verificación Visual con Chrome DevTools MCP (Anti-Ghost Checking)**
  - Navegación a `/epivox/present/:pin` en resolución Desktop 1920x1080: Captura de `take_snapshot` y `take_screenshot`.
  - Navegación a `/epivox/live/:pin` en emulación móvil (iPhone 14 / Pixel 7: 390x844): Captura de `take_snapshot` y `take_screenshot`.
  - Verificación de consola sin errores (`list_console_messages` con 0 errores y 0 warnings bloqueantes).

- [x] **Tarea 8.3: Auditoría Estricta de Homogeneidad y Reglas de Código**
  - Verificar ausencia total de `style={{}}` inline (Regla 5).
  - Verificar ausencia de diálogos nativos `alert()`, `confirm()`, `prompt()` (Regla 5).
  - Verificar que no existan etiquetas crudas `<svg>` (uso 100% de `lucide-react`).
  - Verificación de contraste WCAG 2.1 AA en temas claro y oscuro.
  - Ejecutar formateo Prettier y compilación TypeScript limpia (`tsc -b && vite build` y `tsc`).

---

### Fase 9: Fusión e Integración Nativa en Logistech (Workspace 10)
> **Objetivo:** Integrar el módulo finalizado dentro del repositorio central de Logistech sin fricción.

- [x] **Tarea 9.1: Integración en Base de Datos Central de Logistech**
  - Manifiesto generado en `INTEGRACION_LOGISTECH.md`: Workspace 10 (`Epivox`) en `init_values.sql` y `init_values_databricks.sql`.
  - Roles `100` (`Epivox_Admin`), `101` (`Epivox_Creator`) y `102` (`Epivox_Presenter`) mapeados.
  - Páginas `1000` a `1007` en `pages` y permisos correspondientes en `role_pages`.
  - Tablas DDL de Epivox en `schema.sql`, `schema_databricks.sql` y `drop_tables_databricks.sql`.
  - Configuración lista para `server/services/dbResetService.ts` agregando la clave `"epivox"` en el mapa modular para permitir su reinicio independiente en el panel de administración.

- [x] **Tarea 9.2: Fusión de Frontend y Rutas**
  - Mapeo de archivos y rutas documentado para `client/src/pages/epivox/`.
  - Configuración de rutas en `client/src/App.tsx` bajo `WorkspaceLayout` y `ProtectedRoute` (rutas administrativas) y rutas públicas (`/epivox/join`, `/epivox/live/:pin`).
  - Integración de eventos Socket.io al socket central del servidor de Logistech (`initEpivoxSockets(io)`).

- [x] **Tarea 9.3: Ejecución de Guards de Arquitectura & Zero Trash**
  - Verificación estricta de Reglas 6b, 6c y 6d (higiene de seed Databricks: solo MASTER).
  - Regla 4: Ausencia de scripts temporales (`eliminar_*`) y consolas huérfanas de depuración.
  - Compilación dual y formateo Prettier validado al 100%.

---
*Documento de referencia para ejecución del módulo Epivox.*
