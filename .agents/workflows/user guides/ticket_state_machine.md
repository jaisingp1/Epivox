# Ticket State Machine User Guide

## 1. Overview
The **Ticket State Machine** is a strict, database-driven workflow engine that controls the lifecycle of every ticket in the system. It defines 8 sequential states and a configurable **Action Matrix** that determines which operations are available at each stage. The entire configuration lives in SQL tables — no code changes are required to add, remove, or modify states or actions.

## 2. Ticket States

The lifecycle follows a linear flow with two terminal branches:

```
Borrador → Enviado → En Aprobación → Aceptado → En Proceso → Cerrado
                                    ↘ Rechazado → Cerrado
                         (any non-terminal) → Cancelado
```

| ID | Estado | Descripción | Tipo |
|----|--------|-------------|------|
| 1 | **Borrador** | Ticket recién creado, editable por el creador | Inicial |
| 2 | **Enviado** | Ticket enviado al flujo de gestión | Transitorio |
| 3 | **En Aprobación** | Ticket en proceso de aprobación multinivel | Transitorio |
| 4 | **Aceptado** | Ticket aceptado por los aprobadores | Transitorio |
| 5 | **Rechazado** | Ticket rechazado por el aprobador | Especial |
| 6 | **En Proceso** | Ticket en ejecución operativa | Transitorio |
| 7 | **Cerrado** | Ticket finalizado y cerrado | Terminal |
| 8 | **Cancelado** | Ticket cancelado por el usuario | Terminal |

## 3. Action Matrix

The action matrix defines which buttons appear in the "Acciones" column of the tickets dashboard. Each row maps a `status_id` to a permitted `action_key`.

### 3.1. Default Configuration

| Estado | Editar | Clonar | Cancelar | Cerrar |
|--------|--------|--------|----------|--------|
| Borrador (1) | ✅ | ✅ | ✅ | — |
| Enviado (2) | — | ✅ | ✅ | — |
| En Aprobación (3) | — | ✅ | ✅ | — |
| Aceptado (4) | — | ✅ | ✅ | — |
| **Rechazado (5)** | — | ✅ | — | ✅ |
| En Proceso (6) | — | ✅ | ✅ | — |
| Cerrado (7) | — | ✅ | — | — |
| Cancelado (8) | — | ✅ | — | — |

> **Caso Crítico — Rechazado**: Un ticket rechazado no puede ser editado ni cancelado. Solo puede ser clonado (para reintentarlo) o cerrado definitivamente.

### 3.2. Action Properties

Each action in the `ticket_status_actions` table contains:

| Columna | Propósito | Ejemplo |
|---------|-----------|---------|
| `action_key` | Identificador único de la acción | `edit`, `clone`, `cancel`, `close` |
| `label_es` / `label_en` | Texto del tooltip en español/inglés | `Editar` / `Edit` |
| `icon_name` | Nombre del icono de `lucide-react` | `Pencil`, `Copy`, `XCircle`, `Lock` |
| `variant` | Estilo visual del botón | `primary`, `neutral`, `danger` |
| `sort_order` | Orden de aparición (izquierda a derecha) | `1`, `2`, `3` |
| `is_active` | Permite desactivar una acción sin eliminarla | `TRUE` / `FALSE` |

### 3.3. Visual Variants (Epiroc Brand)

- **`primary`**: Fondo amarillo corporativo, texto azul oscuro (`bg-epiroc-yellow text-epiroc-dark-blue`). Usado para la acción principal (Editar).
- **`neutral`**: Fondo gris claro, texto gris (`bg-epiroc-light-grey text-epiroc-grey`). Usado para acciones secundarias (Clonar, Cerrar).
- **`danger`**: Fondo rojo, texto blanco (`bg-epiroc-red text-white`). Usado para acciones destructivas (Cancelar).

## 4. How to Configure (Without Code)

### 4.1. Agregar un nuevo estado

1. Editar `init_values.sql` y agregar una fila a la tabla `statuses`:
   ```sql
   INSERT INTO statuses (status_id, status_name, status_category, description, color_class)
   VALUES (9, 'En Revisión', 'tickets', 'Ticket en revisión técnica', 'status-review');
   ```

2. Agregar las acciones permitidas para ese estado en `ticket_status_actions`:
   ```sql
   INSERT INTO ticket_status_actions (id, status_id, action_key, label_es, label_en, icon_name, variant, sort_order)
   VALUES (16, 9, 'clone', 'Clonar', 'Clone', 'Copy', 'neutral', 1);
   ```

3. Ejecutar `npm run db:regen` para aplicar los cambios.

### 4.2. Agregar una nueva acción a un estado existente

Ejemplo: permitir "Editar" en el estado "Enviado" (actualmente bloqueado):

```sql
INSERT INTO ticket_status_actions (id, status_id, action_key, label_es, label_en, icon_name, variant, sort_order)
VALUES (16, 2, 'edit', 'Editar', 'Edit', 'Pencil', 'primary', 0);
```

### 4.3. Desactivar una acción sin eliminarla

```sql
UPDATE ticket_status_actions SET is_active = FALSE WHERE status_id = 1 AND action_key = 'cancel';
```

Esto ocultará el botón "Cancelar" del estado Borrador sin eliminar el registro.

## 5. API Endpoint

El endpoint `GET /api/tickets/status-actions/:statusId` retorna las acciones permitidas para un estado dado.

**Request**: `GET /api/tickets/status-actions/1`

**Response**:
```json
[
  { "id": 1, "statusId": 1, "actionKey": "edit", "labelEs": "Editar", "labelEn": "Edit", "iconName": "Pencil", "variant": "primary", "sortOrder": 1 },
  { "id": 2, "statusId": 1, "actionKey": "clone", "labelEs": "Clonar", "labelEn": "Clone", "iconName": "Copy", "variant": "neutral", "sortOrder": 2 },
  { "id": 3, "statusId": 1, "actionKey": "cancel", "labelEs": "Cancelar", "labelEn": "Cancel", "iconName": "XCircle", "variant": "danger", "sortOrder": 3 }
]
```

## 6. Frontend Component: `TicketActions`

El componente `TicketActions.tsx` consume el endpoint dinámicamente y renderiza los botones de acción.

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `statusId` | `number` | ID del estado actual del ticket |
| `ticketId` | `number` | ID del ticket |
| `ticketCode` | `string` | Código visible del ticket (ej. `TKT-2026-0001`) |
| `onAction` | `(action, ticketId, ticketCode) => void` | Callback ejecutado al hacer click en un botón |

### Comportamiento
- Si el estado no tiene acciones registradas, el componente no renderiza nada.
- Los botones aparecen como iconos de 32×32px con tooltips al hacer hover.
- El mapping de iconos soporta: `Pencil`, `Copy`, `XCircle`, `Lock`. Para agregar nuevos iconos, registrarlos en el `iconMap` del componente.

## 7. Architecture Notes

- **Data Layer**: La tabla `ticket_status_actions` tiene FK a `statuses(status_id)` y un constraint `UNIQUE(status_id, action_key)` que previene acciones duplicadas por estado.
- **Backend Service**: `server/services/ticket-state.service.ts` contiene la función `getAvailableActions()` que realiza una query pura a la DB.
- **Controller**: `server/controllers/ticketController.ts` expone `getStatusActions` como handler HTTP.
- **Route**: `GET /api/tickets/status-actions/:statusId` registrada en `server/routes/index.ts`.
- **Frontend**: `client/src/components/TicketActions.tsx` consume la API y usa `lucide-react` para los iconos.
- **Dashboard Integration**: `client/src/pages/tickets/TicketsDashboard.tsx` integra el componente en la columna "Acciones" de la tabla, pasando `status_id` de cada ticket.
