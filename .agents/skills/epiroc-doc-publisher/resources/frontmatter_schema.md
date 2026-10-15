# Estándar de Metadatos YAML para Documentos Epiroc

Para que un archivo Markdown (`.md`) pueda ser transformado en un documento corporativo DOCX o PDF con su portada, encabezados y control de versiones, debe contener el siguiente bloque YAML en las primeras líneas del archivo:

```yaml
---
# Información Principal
title: "Manual de Usuario: Gestión de Tickets"
subtitle: "Guía Operativa Paso a Paso para Creación, Despacho y Aprobación"
system: "Logistech Enterprise Logistics"
module: "Tickets"
workspace_id: 1
doc_type: "manual_usuario" # Valores: manual_usuario | especificacion_tecnica | plan_qa | reporte_arquitectura

# Control de Versión, Idioma y Estado
version: "1.0"
language: "es" # Valores soportados: es (Español) | en (Inglés) | pt (Portugués)
date: "2026-10-02"
classification: "Uso Interno Confidencial" # Valores: Público | Uso Interno Epiroc | Confidencial

# Responsables (Identidad Institucional)
author: "Jaising Pasten"
author_email: "jaising.pasten@epiroc.com"
author_role: "Lead Systems Architect"

reviewer: "Eduardo Acuña"
reviewer_email: "eduardo.acuna@epiroc.com"
reviewer_role: "Business Operations Manager"

# Historial de Revisiones (Sección de Control de Cambios)
history:
  - version: "1.0"
    date: "2026-10-02"
    author: "Jaising Pasten"
    changes: "Emisión inicial tras auditoría de código y UI"
  - version: "1.1"
    date: "2026-10-15"
    author: "Jaising Pasten"
    changes: "Inclusión de nuevas reglas de aprobación multinivel"
---
```

## Campos Obligatorios vs Opcionales
| Campo | Obligatorio | Descripción | Fallback si no está presente |
|---|---|---|---|
| `title` | **Sí** | Título principal del documento | Primer encabezado `#` del archivo |
| `module` | **Sí** | Módulo de Logistech | "Logistech" |
| `version` | **Sí** | Versión semántica del documento | "1.0" |
| `date` | **Sí** | Fecha en formato YYYY-MM-DD | Fecha actual del sistema |
| `author` | **Sí** | Nombre del autor/creador | "Epiroc Systems Team" |
| `author_email` | No | Correo corporativo del autor | Vacío |
| `reviewer` | No | Nombre del aprobador/revisor | "Pendiente de Revisión" |
| `classification` | No | Nivel de confidencialidad | "Uso Interno Epiroc" |
| `history` | No | Lista de cambios por versión | Fila única con versión inicial |
