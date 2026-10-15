---
name: databricks-cost-saver
description: Ejecutar análisis de ahorro en Databricks. Úsala después de escribir/refactorizar código, debuggear o antes de modificar datos maestros. Propone particionado, clustering y buenas prácticas para optimizar costos y rendimiento.
---

# Experto en Optimización de Costos de Databricks

Esta skill permite al agente auditar y proponer optimizaciones de costos en entornos Databricks, enfocándose en el particionado eficiente, clustering líquido y configuración óptima de infraestructura.

## When to use this skill

- **Post-Código/DEBUG:** Después de generar o corregir código que lee tablas completas (sin filtros).
- **Pre-Modificación de Datos:** Cuando el usuario intente hacer `INSERT`, `UPDATE` o `MERGE` en tablas de gran volumen (> 1 TB).
- **Rendimiento:** Si el usuario menciona que una query es "lenta" o "cara".
- **Trigger keywords:** databricks cost, ahorro databricks, optimizar query databricks, partitioned by, liquid clustering.

## El Checklist de Auditoría (Reglas)

Al activarte, evalúa el contexto con estas reglas:

### Regla 1: La Regla de 1 TB (Particionado)
- **Condición:** ¿La tabla es mayor a 1TB?
- **Acción:** Sugerir `PARTITIONED BY`.
- **¿Por qué?:** Si es menor a 1TB, el overhead del particionado es contraproducente. Si es mayor, es obligatorio.
- **Buenas prácticas:**
  - Usar columnas de baja cardinalidad (fechas, regiones, categorías).
  - Cada partición debe pesar al menos 1GB.
  - Usar columnas generadas para particionar por fecha (`GENERATED ALWAYS AS (CAST(ts AS DATE))`).

### Regla 2: Clustering Líquido vs. Particionado
- **Escenario:** Si la tabla se filtra por columnas de alta cardinalidad (ej. `user_id`, `session_id`) o las particiones serían demasiado pequeñas.
- **Solución:** Usar `Liquid Clustering` en lugar de `PARTITIONED BY`.
- **Ventaja:** No necesitas reescribir datos si cambian los patrones de consulta.

### Regla 3: Zero Idle Compute (Ahorro Instantáneo)
- **Revisión del Código:** Si el código crea un `Cluster` interactivo para un job, debe ser rechazado.
- **Sugerencia:** Usar **Job Clusters** (destrucción automática al terminar).
- **Configuración Crítica:** `auto_stop_mins = 10` (o menos) para SQL Warehouses y Clusters de desarrollo.

### Regla 4: Photon y Formatos
- **Siempre recomendar:**
  - Formato: `DELTA` (nunca Parquet/CSV plano).
  - Engine: Habilitar `Photon` para workloads de SQL y ETL pesado.

## Workflow de Ejecución (Ejemplo)

**Entrada:** "Voy a actualizar la tabla `ventas` con los datos de hoy."

**Respuesta estructurada:**

1.  **Diagnóstico:** "Voy a auditar la estructura de `ventas` para aplicar la **Saving Skill**."
2.  **Propuesta de Particionado:**
    *"La tabla `ventas` excede 1TB. Te propongo particionar por `fecha_transaccion`. Cada partición tendrá ~5GB, lo que permite poda de particiones."*
    ```sql
    CREATE TABLE ventas_optimizada
    USING DELTA
    PARTITIONED BY (fecha_transaccion)
    AS SELECT * FROM ventas;
    ```
3.  **Propuesta de Infraestructura:**
    *"Para la actualización, no uses un Cluster compartido. Usa este Job Cluster que se apaga solo:"*
    ```json
    {
      "num_workers": 4,
      "runtime_engine": "PHOTON",
      "autotermination_minutes": 15
    }
    ```
4.  **Alternativa (Liquid Cluster):**
    *"Si consultas mucho por user_id, te sugiero Liquid Clustering en lugar de particionado estático:"*
    ```sql
    CREATE TABLE ventas
    USING DELTA
    CLUSTER BY (user_id, fecha);
    ```

## Buenas Prácticas Clave

### A. El Dilema del Particionado vs. Clustering
- **Particionado (`PARTITIONED BY`):** Solo es mágico cuando la cardinalidad es baja y el volumen es brutal. Evitar en columnas de alta cardinalidad (ej. IDs únicos) para evitar el problema de *small files*.
- **Liquid Clustering:** Recomendado para tablas grandes donde las columnas de filtro cambian frecuentemente. No requiere mantenimiento pesado.

### B. Infraestructura como Código de Ahorro
- **Cluster Policies:** Sugerir políticas que prohíban clusters sin auto-terminación.
- **Instance Types:** Usar instancias spot para workers (si el workload lo soporta) y on-demand para el driver.
- **SQL Warehouses:** Usar escalado automático con auto-stop agresivo (10 minutos).

### C. Optimización de Consultas (El "Anti-Patrón")
- **Evitar `SELECT *`** en tablas anchas.
- **Uso de `TABLESAMPLE`:** Para exploración, recomendar `... TABLESAMPLE (1 PERCENT)` antes de un full scan.
- **Z-Ordering:** Si no se usa Liquid Clustering, recomendar `OPTIMIZE table ZORDER BY col_filtrada`.
