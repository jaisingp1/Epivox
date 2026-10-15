---
title: "Manual de Usuario: [Nombre de la Funcionalidad]"
subtitle: "Guía Operativa Paso a Paso para Usuarios Finales"
system: "Logistech"
module: "[Nombre del Módulo]"
workspace_id: 1
doc_type: "manual_usuario"
version: "1.0"
author: "[Nombre del Autor]"
author_email: "[email@epiroc.com]"
reviewer: "[Nombre del Revisor / Líder Operativo]"
reviewer_email: "[email@epiroc.com]"
date: "YYYY-MM-DD"
classification: "Uso Interno Epiroc"
history:
  - version: "1.0"
    date: "YYYY-MM-DD"
    author: "[Nombre del Autor]"
    changes: "Creación inicial del manual paso a paso"
---

# Manual de Usuario: [Nombre de la Funcionalidad]

**Módulo**: [Nombre del Módulo, ej: Tickets / DIFOT / Redistribuciones]  
**Audiencia**: [Usuarios Finales / Planificadores / Aprobadores / Operaciones]  
**Versión del Sistema**: Logistech v1.0  
**Fecha de Actualización**: YYYY-MM-DD  

---

## 1. Introducción y Objetivo

### ¿Para qué sirve esta funcionalidad?
[Explicación clara en palabras sencillas sobre el beneficio práctico que obtiene el usuario con esta pantalla o proceso].

### ¿Quiénes pueden utilizarla?
Esta función está disponible para los colaboradores que cuenten con el rol de **[Nombre amigable del rol]**. Si al ingresar no visualiza esta opción en su menú lateral, por favor comuníquese con el administrador del sistema para solicitar la habilitación correspondiente.

---

## 2. ¿Cómo Ingresar a la Pantalla?

Siga esta ruta de navegación paso a paso:
1. Abra el sistema **Logistech** en su navegador web.
2. En la pantalla inicial de bienvenida, haga clic sobre la tarjeta del módulo **[Nombre del Módulo]**.
3. En la barra de menú lateral izquierda:
   - Haga clic en el grupo **[Nombre del Menú Padre, ej: Gestión]**.
   - Luego seleccione la opción **[Nombre de la Pantalla]**.
4. La pantalla principal cargará mostrando en la parte superior el título **[Título de PageHeader]** y las opciones disponibles.

---

## 3. Descripción de la Pantalla Principal

Al ingresar, observará los siguientes elementos principales:
- **Barra de Acciones Superior**:
  - Botón **[+ Nuevo Registro]**: Permite iniciar una nueva solicitud.
  - Filtros de Búsqueda: Permiten acotar la lista por fecha, estado o centro de costo.
- **Tabla de Registros**:
  - Muestra el listado de elementos existentes ordenados cronológicamente.
  - Cada fila cuenta con botones de acción al costado derecho (ver detalle, editar, exportar).

---

## 4. Guía Operativa Paso a Paso

### 4.1. Crear un Nuevo Registro
1. En la esquina superior derecha, haga clic en el botón **[+ Nuevo ...]**.
2. Se desplegará una ventana emergente (modal) titulada **[Título de la Ventana]**.
3. Complete los campos del formulario según las siguientes indicaciones:
   - **[Nombre del Campo 1]** *(Obligatorio)*: Seleccione una opción del listado desplegable.
   - **[Nombre del Campo 2]** *(Obligatorio)*: Escriba el valor requerido. El sistema no permitirá ingresar letras si es un campo numérico.
   - **[Observaciones / Comentarios]** *(Opcional)*: Escriba notas relevantes para el equipo revisor.
4. Revise que no existan campos marcados con borde rojo de advertencia.
5. Haga clic en el botón **[Guardar / Enviar]**.
6. Aparecerá una notificación verde en pantalla confirmando que la acción se completó con éxito.
7. La ventana se cerrará automáticamente y el nuevo registro aparecerá en el listado.

### 4.2. [Acción Secundaria: Modificar / Aprobar / Exportar]
1. Localice el registro que desea gestionar en la tabla.
2. Haga clic en el botón **[Ver / Editar / Aprobar]** ubicado al final de la fila.
3. Se abrirá la vista con el detalle completo.
4. Realice los cambios necesarios y presione **[Actualizar]**.

---

## 5. Estados y Notificaciones del Sistema

### 5.1. Significado de los Estados
| Indicador Visual | Estado | Significado para el Usuario |
|---|---|---|
| 🟡 Etiqueta Amarilla | **Pendiente** | Su solicitud fue ingresada y está esperando revisión por parte del líder. |
| 🟢 Etiqueta Verde | **Aprobado / Completado** | El proceso finalizó con éxito y se encuentra en ejecución. |
| 🔴 Etiqueta Roja | **Rechazado** | La solicitud fue devuelta. Abra el detalle para leer el motivo indicado. |

### 5.2. Mensajes del Sistema
- **Notificación Verde (Éxito)**: Su acción se procesó correctamente y los datos están guardados de forma segura.
- **Notificación Roja (Error)**: Ocurrió un problema de conexión o un dato no cumple las condiciones del negocio. Lea el texto explicativo para corregirlo.

---

## 6. Preguntas Frecuentes y Solución de Dudas

- **¿Qué hago si el botón de guardar no responde o aparece deshabilitado?**  
  Asegúrese de haber completado todos los campos obligatorios señalados con un asterisco (*).
- **¿Puedo anular o editar una solicitud ya enviada?**  
  Solo mientras se encuentre en estado **Pendiente**. Una vez aprobada, debe comunicarse con su supervisor.
- **¿A quién contacto en caso de inconsistencia con los datos mostrados?**  
  Contacte al equipo de soporte de Logistech o a su administrador de contrato correspondiente.
