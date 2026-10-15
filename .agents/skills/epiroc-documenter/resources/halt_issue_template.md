# 🛑 Reporte de Parada Obligatoria (HALT Report)

**Fecha**: YYYY-MM-DD HH:MM:SS  
**Módulo / Funcionalidad Auditada**: [Nombre de la funcionalidad / Módulo]  
**Auditor**: epiroc-documenter  
**Estado**: 🛑 EJECUCIÓN DETENIDA (Pendiente de corrección por epiroc-debugging)  

---

## 1. Identificación del Hallazgo

- **Archivo Afectado**: `[Ruta absoluta o relativa del archivo]`
- **Líneas**: `[Línea inicio - Línea fin]`
- **Componente / Función**: `[Nombre de la función, hook, controlador o endpoint]`
- **Clasificación de la Falla**:
  - [ ] Inconsistencia UI vs Backend (campos fantasma, tipos discordantes)
  - [ ] Error de Lógica / Cálculo Matemático (división por 0, NaN, moneda errónea)
  - [ ] Falla de Seguridad / Autorización (bypass de roles, uso de string en vez de ROLE_ID)
  - [ ] Violación de Arquitectura Logistech (SQL directo en controller, alertas nativas, estilos inline)
  - [ ] Estado / UI Colgada (catch vacío, spinner infinito, promesa no capturada)

---

## 2. Descripción Detallada del Problema

### ¿Qué hace el código actualmente?
```typescript
// Código o fragmento problemático observado
```

### ¿Qué debería hacer según las reglas y la lógica de negocio?
```typescript
// Comportamiento esperado
```

### Evidencia de Inconsistencia
[Explicar exactamente dónde discrepa el frontend del backend o dónde se incumple la regla del sistema].

---

## 3. Impacto Operativo y de Integridad

- **Impacto en el Usuario Final**: [Ej: El usuario presiona guardar y la pantalla se queda congelada sin aviso].
- **Impacto en Base de Datos / Sistema**: [Ej: Quedan registros huérfanos o fallan los reportes consolidados].
- **Riesgo de Seguridad**: [Ej: Un usuario con rol operador podría saltarse la validación consumiendo directamente la API].

---

## 4. Instrucción de Handoff para Debugging

> [!IMPORTANT]
> **ACCIONES INMEDIATAS REQUERIDAS:**
> 1. Activar la skill **`epiroc-debugging`** para reproducir el bug mediante pruebas y aislar la causa raíz.
> 2. Implementar la corrección siguiendo **`epiroc-coding`** con un cambio quirúrgico (mínimo diff).
> 3. Verificar que la app compila y no arroja errores de consola ni de linting (`npx eslint <archivo> --fix`).
> 4. Una vez validada la solución, reanudar la ejecución de **`epiroc-documenter`** para finalizar el documento `.md`.
