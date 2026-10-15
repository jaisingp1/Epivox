# Guía de Configuración: Categorías y Enrutamiento de Tickets

## 1. Visión General
El módulo de administración de Tickets permite gestionar dinámicamente las **Categorías de Tickets** y el **Enrutamiento de Despacho (Routing)**. Esto permite definir qué tipos de tickets existen en el sistema, si requieren aprobación antes de ser procesados, y quién es el usuario responsable (Despachador/Resolutor) asignado a recibir y gestionar esos tickets, segmentado por Entidad Legal.

Toda esta configuración se administra desde la ruta: `/admin/tickets` (menú **Configuración > Módulo Tickets**).

## 2. Gestión de Categorías (`ticket_categories`)

Las categorías clasifican los tipos de solicitudes que los usuarios pueden crear.

### 2.1. Propiedades de una Categoría

- **Nombre**: Título visible de la categoría.
- **Descripción**: Detalle del propósito de la categoría.
- **Requiere Aprobación Inicial (`approve_required`)**: Si está activo (`true`), los tickets creados bajo esta categoría entrarán automáticamente al estado "En Aprobación" y pasarán por el flujo de aprobaciones definido para esa entidad/categoría antes de llegar al Resolutor o Despachador. Si está inactivo, pasan directamente al estado "Enviado" o "En Proceso" (según la configuración).
- **Categoría Activa (`is_active`)**: Permite deshabilitar categorías antiguas o temporales. Al desactivar una categoría, ya no aparecerá en los selectores de creación de tickets para los usuarios, pero se mantendrá el registro histórico de los tickets asociados.

### 2.2. Flujo de Edición

La interfaz centralizada permite:
1. Ver un listado con un filtro rápido para **"Mostrar solo activas"** (activado por defecto).
2. Hacer clic en "Editar" en cualquier categoría para modificar su nombre, descripción o cambiar los switches de *Aprobación* y *Estado Activo*. Todo se actualiza en tiempo real sin necesidad de tocar código.

---

## 3. Enrutamiento de Despacho (`ticket_routing`)

El enrutamiento define "quién" se encarga de resolver o despachar un ticket dependiendo de:
1. **La Entidad** (País/Compañía donde se crea el ticket, ej: `PER`, `CLN`).
2. **La Categoría** del ticket.

### 3.1. Arquitectura de Base de Datos

La tabla `ticket_routing` no utiliza un ID artificial (autoincremental). Su clave primaria es una **Clave Compuesta** por tres campos:
- `entity_code`
- `category_id`
- `user_id`

> **Importante**: Al utilizar `user_id` como parte de la clave primaria, el sistema técnicamente permite asignar *múltiples* usuarios responsables a la misma combinación de Entidad y Categoría.

### 3.2. Gestión desde la Interfaz

Desde la pestaña de "Enrutamiento de Despacho":

- **Añadir Regla**: Al crear una nueva regla, se selecciona una Entidad, una Categoría y un Usuario de la lista de usuarios activos del sistema.
- **Editar Regla**: Para facilitar el mantenimiento, la interfaz incluye un botón **Editar**. Al usarlo, la Entidad y la Categoría se muestran deshabilitadas (pues definen el contexto de la regla actual) y solo se permite cambiar al "Usuario Despachador / Resolutor". Internamente, el sistema realiza un `UPDATE` apuntando a la clave compuesta original.
- **Eliminar Regla**: Remueve permanentemente al usuario responsable de esa Entidad y Categoría.

### 3.3. Relación con Roles

La regla de enrutamiento **solo asocia un usuario a un flujo**. Sin embargo, las acciones que ese usuario podrá ejecutar sobre el ticket (ej. Aceptar, Rechazar, Cerrar) dependen estrictamente de los permisos que le otorgue su Rol (`DISPATCHER`, `RESOLVER`, etc.) a través de la matriz de estados. 

El panel de Enrutamiento no filtra usuarios por rol (carga todos los usuarios del sistema) para permitir máxima flexibilidad (por ejemplo, asignar a un `ADMIN` o un `MANAGER` temporalmente).

---

## 4. Endpoints del API

Los endpoints que soportan esta configuración en el Backend (bajo `/api/admin/`) son:

- `GET /admin/tickets-config`: Obtiene la lista conjunta de Categorías, Reglas de Enrutamiento, Usuarios y Entidades para poblar las tablas.
- `PUT /admin/tickets/categories/:id`: Actualiza la metadata de una categoría (incluyendo `is_active` y `approve_required`).
- `POST /admin/routing`: Crea una nueva regla de enrutamiento.
- `PUT /admin/routing`: Modifica el usuario asignado en una regla existente (recibe `old_user_id` y `new_user_id`).
- `DELETE /admin/routing`: Elimina una regla específica utilizando la clave primaria compuesta (`entity_code`, `category_id`, `user_id`) enviada en el cuerpo de la solicitud (Body).
