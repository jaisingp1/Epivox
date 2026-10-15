---
name: epiroc-workflows
description: Diseña, implementa y mantiene los flujos de negocio centrales de Logistech (sistema de tickets y motor de aprobaciones multi-nivel). Cubre el ciclo de vida completo de tickets (creación, ruteo POOL_LIDER/DIRECTO_RESOLUTOR, despacho, SLA, escalamiento) y el motor de aprobaciones (delegación, límites por niveles 1-3, conversión de moneda a SEK, snapshots de datos). Se activa al crear o modificar cualquier endpoint, servicio, controlador, tabla o pantalla relacionada con tickets, aprobaciones, despacho, SLA o flujos de estado.
---

# Epiroc Workflows Skill (Tickets & Approval Engine)

Esta skill gobierna los dos flujos de negocio centrales de Logistech: el **sistema de tickets** y el **motor de aprobaciones multi-nivel**. Define reglas, tablas, estados y patrones para que cualquier cambio sea consistente con el modelo de negocio de Epiroc.

## When to use this skill

- Crear/modificar tablas relacionadas con tickets: `ticket_header`, `ticket_categories`, `ticket_status_actions`, `ticket_timeline`, `ticket_comments`, `ticket_attachments`, `ticket_audit_log`.
- Implementar ruteo de tickets (`POOL_LIDER` vs `DIRECTO_RESOLUTOR`).
- Construir lógica del despacho (dispatcher queue) o asignación de tickets.
- Implementar reglas de SLA (`ticket_sla_definitions`, `ticket_country_holidays`, `ticket_country_business_hours`).
- Trabajar con el motor de aprobaciones: `approval_requests`, `approval_limits`, `approval_delegations`, `approval_amount_fields`, `approval_history`.
- Crear/modificar servicios o controladores en `server/services/` o `server/controllers/` que toquen estos flujos.
- Diseñar pantallas de tickets o aprobaciones en `client/src/pages/`.
- **Trigger keywords**: ticket, workflow, aprobación, approval, despacho, dispatch, SLA, ruteo, delegación, escalado, estado, transición, POOL_LIDER, DIRECTO_RESOLUTOR, approval engine, ticket_header, ticket_code, approval_requests.

## Dependencies

Esta skill coordina con:
- **epiroc-coding**: Para estándares TypeScript, controladores y servicios.
- **epiroc-api**: Para patrones REST de los endpoints de tickets/aprobaciones.
- **epiroc-security**: Para validación de permisos ABAC y verificación del actor (por ID, nunca por email).
- **epiroc-i18n**: Para etiquetas bilingües de estados y acciones en `ticket_status_actions`.
- **epiroc-mockup-data**: Para seed de categorías, estados y límites de aprobación.

## Modelo de Datos Central

### Roles de Tickets

- Las verificaciones de autorización usan `role_id`, siempre junto con `entity_code` cuando el permiso es por entidad.
- IDs vigentes: `1` Admin global, `3` Tickets Dispatcher, `4` Tickets Resolver y `6` Tickets Admin. Los IDs `2` Requestor y `5` Approver identifican sus roles de Tickets.
- `roles.name` solo es texto visible. No filtrar usuarios ni autorizar acciones con comparaciones de nombres.
- Tickets Admin (ID 6) administra Tickets, pero no obtiene `is_admin` ni permisos de Administración general (workspace 7).

### Tablas del Sistema de Tickets (schema.sql)

| Tabla | Propósito |
|-------|-----------|
| `ticket_categories` | Categorías con `routing_type` (`POOL_LIDER` o `DIRECTO_RESOLUTOR`) y flag `approve_required`. |
| `ticket_user_category_roles` | Matriz ABAC: usuario + entidad + categoría + rol. |
| `ticket_entity_category` | Vincula categorías a entidades. |
| `ticket_routing` | Mapea entidad + categoría a usuarios despachadores. |
| `ticket_formularios_config` | Formularios dinámicos por categoría, versionados, con `schema_json`. |
| `ticket_priorities` | Niveles de prioridad con nombres bilingües, colores y pesos (1-4). |
| `ticket_header` | Tabla principal: `ticket_code` (formato `TKT-2025-0001`), SLA, `data_json`, asignación. |
| `ticket_comments` | Comentarios con flag `internal/external`. |
| `ticket_attachments` | Adjuntos del ticket. |
| `ticket_timeline` | Audit trail de eventos del ticket. |
| `ticket_status_actions` | **Máquina de estados**: mapea cada estado a acciones permitidas (con etiquetas i18n, iconos, variantes). |

### Tablas del Motor de Aprobaciones (schema.sql)

| Tabla | Propósito |
|-------|-----------|
| `approval_delegations` | Delegación temporal de autoridad (rango de fechas, con CHECK para evitar auto-delegación). |
| `approval_limits` | Umbrales monetarios multi-nivel (1-3) por workspace/entidad/categoría. |
| `approval_amount_fields` | Mapea qué campos JSON del ticket contienen monto y moneda. |
| `approval_requests` | Seguimiento central: nivel actual, niveles requeridos, estado, monto original y convertido a SEK, exchange rate, `data_snapshot`. |
| `approval_history` | Historial completo de acciones de aprobación por nivel: actor, info de delegación, cambios de monto/moneda (old/new), comentarios. |

## Flujo 1: Sistema de Tickets

### 1.1 Creación de Ticket

```
1. Usuario crea ticket desde /tickets/crear
   │  (formulario dinámico desde ticket_formularios_config.schema_json)
   ▼
2. POST /api/tickets
   │  - Genera ticket_code: TKT-{AÑO}-{SECUENCIA}
   │  - Persiste data_json con los campos del formulario
   ▼
3. Determinar routing_type desde ticket_categories
   ├── POOL_LIDER → ticket entra en cola de líder de pool
   └── DIRECTO_RESOLUTOR → asignación directa al resolutor
   ▼
4. Calcular SLA (ticket_sla_definitions + business hours + holidays)
   ▼
5. Registrar evento en ticket_timeline
```

### 1.2 Máquina de Estados (ticket_status_actions)

Los estados NO son hardcoded. Se definen en la tabla `ticket_status_actions` que mapea:
- `status_name` + `status_category` → lista de `actions` permitidas.
- Cada acción tiene: label (i18n EN/ES), icono, variante visual.

> [!IMPORTANT]
> **Regla estricta**: Las transiciones de estado válidas DEBEN consultarse desde `ticket_status_actions`, no asumirse en el código. Un estado solo puede transicionar a otro si existe una acción registrada.

### 1.3 Tipos de Ruteo

| routing_type | Comportamiento |
|-------------|----------------|
| `POOL_LIDER` | El ticket entra en la cola del líder de pool, quien lo asigna a un resolutor. Endpoint: `/api/tickets/dispatcher-queue`. |
| `DIRECTO_RESOLUTOR` | Asignación directa al resolutor determinado por `ticket_routing`. |

### 1.4 SLA Calculation

El SLA se calcula considerando:
- `ticket_sla_definitions`: tiempos objetivo de respuesta y resolución por prioridad/categoría/entidad.
- `ticket_country_business_hours`: horario laboral por país y día de la semana.
- `ticket_country_holidays`: feriados por país (días excluidos del cómputo).

> [!CAUTION]
> El SLA NO debe calcularse en el cliente React. Toda la lógica de negocio horario/feriados vive en servicios del backend (`server/services/`).

## Flujo 2: Motor de Aprobaciones Multi-Nivel

### 2.1 Ciclo de Vida de una Aprobación

```
1. Ticket con approve_required=true es enviado a aprobación
   │  POST /api/tickets/:id/submit-to-approval
   ▼
2. Sistema crea approval_request
   │  - Calcula monto desde approval_amount_fields (lee data_json del ticket)
   │  - Convierte monto a SEK usando conversion_rates
   │  - Guarda data_snapshot en el momento de la solicitud
   │  - Determina niveles requeridos según approval_limits
   ▼
3. Iteración por niveles (1 → 2 → 3)
   │  Cada nivel tiene su approver designado en approval_limits
   │  Se respeta approval_delegations (delegación temporal activa)
   ▼
4. Acción por nivel (approval_history)
   ├── APROBAR → avanza al siguiente nivel (o finaliza si era el último)
   ├── RECHAZAR → cierra la aprobación como rechazada
   └── SOLICITAR_INFO → vuelve el ticket al solicitante
   ▼
5. Cierre de approval_request con estado final
```

### 2.2 Reglas de Conversión de Moneda

- Todo monto se almacena en su moneda original Y convertido a **SEK** (coronas suecas, moneda corporativa de Epiroc).
- El `exchange_rate` y la fecha de conversión se guardan en `approval_requests`.
- Las tablas `conversion_rates` proveen los factores de conversión.
- Montos almacenados como `DECIMAL(18, 2)` para precisión financiera.

### 2.3 Delegación de Aprobación

- `approval_delegations` permite delegar temporalmente la autoridad de aprobación.
- Constraints CHECK previenen: auto-delegación (`from_user = to_user`) y rangos inválidos (`start_date > end_date`).
- Al evaluar un aprobador, el sistema DEBE verificar si existe una delegación activa y usar al delegado.

### 2.4 Niveles de Aprobación (1-3)

| Nivel | Condición |
|-------|-----------|
| Nivel 1 | Monto ≤ límite nivel 1 |
| Nivel 2 | Límite 1 < Monto ≤ límite 2 |
| Nivel 3 | Límite 2 < Monto ≤ límite 3 |

- Los límites se definen por combinación workspace/entidad/categoría en `approval_limits`.
- Cada nivel tiene su propio approver designado.

## Patrones de Implementación Obligatorios

### Pattern 1: Referencia de Usuario por ID

> [!CAUTION]
> **NUNCA** referenciar usuarios por email en tablas operativas. Siempre por `INTEGER` referenciando `users(id)`. Columnas: `requested_by_id`, `resolved_by_id`, `approver_id`, `actor_id`, `assigned_to_id`.

### Pattern 2: Auditoría Obligatoria

Toda transición de estado o acción de aprobación DEBE generar un registro de auditoría:
- `ticket_timeline`: para eventos del ticket.
- `approval_history`: para acciones de aprobación.
- `ticket_audit_log`: para cambios de datos (con old/new values).

### Pattern 3: Safe JSON Parsing (Híbrido DuckDB/PostgreSQL)

Los campos `data_json`, `schema_json` y `data_snapshot` requieren parsing defensivo:

```typescript
const formData =
  typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json;
```

### Pattern 4: Endpoints del Flujo

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `POST` | `/api/tickets` | Crear ticket |
| `GET` | `/api/tickets/:id` | Ver detalle |
| `POST` | `/api/tickets/:id/action` | Ejecutar acción de estado |
| `GET` | `/api/tickets/dispatcher-queue` | Cola de despacho |
| `POST` | `/api/tickets/:id/assign` | Asignar ticket |
| `POST` | `/api/tickets/:id/submit-to-approval` | Enviar a aprobación |
| `GET` | `/api/approval/pending` | Aprobaciones pendientes |

## Decision Tree

```
¿La tarea involucra tickets?
├── Sí, crear/modificar tickets → Revisar ticket_categories.routing_type
│   ├── POOL_LIDER → Implementar cola + asignación por líder
│   └── DIRECTO_RESOLUTOR → Asignación automática vía ticket_routing
├── Sí, cambiar estados → Consultar ticket_status_actions (no hardcodear)
└── Sí, SLA → Usar ticket_sla_definitions + business hours + holidays

¿La tarea involucra aprobaciones?
├── Crear solicitud → approval_request + conversión SEK + snapshot
├── Acción sobre nivel → approval_history + verificar delegación
└── Configurar límites → approval_limits por entidad/categoría

¿Se referencia a un usuario?
└── SIEMPRE por INTEGER id, usando el principal resuelto por el middleware compartido
```

### Pattern 5: Atomicidad de acciones de negocio

- La creacion de un ticket y sus registros obligatorios relacionados (timeline, enlaces, adjuntos o solicitud de aprobacion que formen parte de la misma operacion) deben confirmar o revertir juntos.
- Una accion de aprobacion que sincroniza `approval_requests`, `ticket_header`, `ticket_timeline` y `approval_history` debe ejecutarse como una unidad atomica en la misma conexion.
- No reemplazar una transaccion con varias llamadas independientes a `query()`. Primero debe existir una interfaz transaccional probada para DuckDB y PostgreSQL/Lakebase.
- Emitir notificaciones o eventos Socket.IO solo despues del commit; una transaccion revertida no debe anunciar un cambio que no existe.
- Las pruebas deben inyectar errores entre escrituras y verificar estado, historial, auditoria y ausencia de efectos externos antes del commit, sin cambiar contratos ni reglas de workflow.

## Best Practices

1. **Estados dinámicos**: Nunca asumir estados válidos en el código; consultar siempre la tabla.
2. **Auditoría completa**: Todo cambio de estado, asignación o acción de aprobación genera registro.
3. **Lógica de negocio en backend**: SLA, ruteo y cálculos de aprobación viven en servicios, no en React.
4. **Snapshots inmutables**: `data_snapshot` en aprobaciones preserva el estado del ticket al momento de la solicitud.
5. **Delegación verificada**: Siempre evaluar delegaciones activas antes de requerir al aprobador titular.
6. **Monto dual**: Guardar siempre monto original + conversión a SEK con su exchange rate.
7. **Atomicidad**: Proteger cada accion multi-escritura con transaccion y prueba de rollback en ambos motores; enviar efectos externos solo tras commit.

---

### [2026-07-02] Skill Creation
- Skill nueva creada para documentar los flujos de negocio centrales de Logistech.
- Cubre sistema de tickets (routing, despacho, SLA) y motor de aprobaciones multi-nivel.
- Define patrones obligatorios: referencias por ID, auditoría, safe JSON parsing.

### [2026-09-29] Workflow Atomicity Guardrail
- **Issue:** Ticket creation and approval processing persist related state across independent database calls, allowing partial workflow state after an intermediate failure.
- **User Feedback:** Add detailed phases and persistent rules/skills to prevent architecture findings from recurring.
- **Fix Applied:** Require a shared transaction for related writes, rollback/failure-injection tests on both DB engines, and post-commit notifications.
- **Impact:** Preserves workflow invariants without changing existing state transitions or API contracts.
