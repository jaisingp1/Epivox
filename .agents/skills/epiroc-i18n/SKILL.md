---
name: epiroc-i18n
description: Gestiona la internacionalización multilingüe de Logistech (inglés, español, portugués, sueco). Define cómo se almacenan textos multilingües en la base de datos (columnas name_en/name_es/name_pt/name_sv), cómo se selecciona el idioma del usuario (tabla languages + users.language_id), y cómo se muestran etiquetas localizadas en la UI. Se activa al crear tablas con datos maestros que requieran traducciones, mostrar textos en múltiples idiomas, o trabajar con la tabla languages y columnas _en/_es/_pt/_sv.
---

# Epiroc i18n Skill (Internationalization EN/ES/PT/SV)

Esta skill define el modelo de internacionalización de Logistech, una aplicación Epiroc multilingüe que soporta 4 idiomas corporativos: inglés (EN), español (ES), portugués (PT) y sueco (SV, idioma corporativo de Epiroc).

## When to use this skill

- Crear tablas de datos maestros que requieran traducciones (`countries`, `ticket_priorities`, `ticket_status_actions`, etc.).
- Mostrar textos localizados en la UI basados en el idioma del usuario.
- Trabajar con la tabla `languages` o el campo `users.language_id`.
- Diseñar etiquetas de estados o acciones con campos i18n en `ticket_status_actions`.
- Implementar selección de idioma en el perfil de usuario.
- Manejar convenciones de formato (fechas, monedas, números) por locale.
- **Trigger keywords**: i18n, idioma, language, traducción, translation, multilingüe, multilang, EN, ES, PT, SV, english, spanish, portuguese, swedish, locale, name_en, name_es, name_pt, name_sv, languages table.

## Dependencies

Esta skill coordina con:
- **epiroc-coding**: Para la estructura de tipos TypeScript con campos multilingües.
- **epiroc-mockup-data**: Para seeds de la tabla `languages` y datos maestros con traducciones.
- **epiroc-workflows**: Para etiquetas de estados y acciones de tickets (`ticket_status_actions`).
- **epiroc-ui**: Para direccionalidad del texto y tipografía Raleway (soporte multi-script).

## Idiomas Soportados

| Código | Idioma | Locale | Notas |
|--------|--------|--------|-------|
| `EN` | English | `en-US` / `en-GB` | Idioma por defecto / fallback |
| `ES` | Español | `es-ES` / `es-419` | Latinoamérica y España |
| `PT` | Português | `pt-BR` / `pt-PT` | Brasil y Portugal |
| `SV` | Svenska | `sv-SE` | **Idioma corporativo Epiroc** |

> [!IMPORTANT]
> El **sueco (SV)** es el idioma corporativo de Epiroc (sede en Örebro, Suecia). Todo dato maestro corporativo DEBE incluir traducción al sueco. El inglés (EN) es el fallback universal.

## Modelo de Datos

### Tabla `languages`

Tabla maestra de idiomas soportados:

```sql
CREATE TABLE languages (
  id INTEGER PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,  -- 'EN', 'ES', 'PT', 'SV'
  name_en VARCHAR(50) NOT NULL,
  name_native VARCHAR(50) NOT NULL   -- 'English', 'Español', 'Português', 'Svenska'
);
```

### Campo de Preferencia en `users`

```sql
-- En la tabla users
language_id INTEGER REFERENCES languages(id)
```

El usuario selecciona su idioma preferido. La sesión carga este valor y el frontend lo usa para seleccionar la columna correcta.

### Patrón de Columnas Multilingües

Las tablas con datos maestros que requieren traducción usan el sufijo del código de idioma:

```sql
CREATE TABLE countries (
  id INTEGER PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,        -- 'CHL', 'SWE', 'BRA', 'USA'
  name_en VARCHAR(100) NOT NULL,          -- 'Chile'
  name_es VARCHAR(100) NOT NULL,          -- 'Chile'
  name_pt VARCHAR(100) NOT NULL,          -- 'Chile'
  name_sv VARCHAR(100) NOT NULL           -- 'Chile'
);

CREATE TABLE ticket_priorities (
  id INTEGER PRIMARY KEY,
  name_en VARCHAR(50) NOT NULL,           -- 'High'
  name_es VARCHAR(50) NOT NULL,           -- 'Alta'
  name_pt VARCHAR(50) NOT NULL,           -- 'Alta'
  name_sv VARCHAR(50) NOT NULL,           -- 'Hög'
  color_code VARCHAR(20),
  weight INTEGER
);
```

## Selección Dinámica de Idioma (Backend)

### Query Adaptativa por Idioma

El backend debe seleccionar la columna correcta según el idioma del usuario:

```typescript
// service: obtiene el nombre localizado
async function getCountryName(countryId: number, lang: string): Promise<string> {
  const langLower = lang.toLowerCase(); // 'en', 'es', 'pt', 'sv'
  const rows = await query(
    `SELECT name_${langLower} AS name FROM countries WHERE id = $1`,
    [countryId]
  );
  return rows[0]?.name ?? rows[0]?.name_en; // Fallback a inglés
}
```

> [!CAUTION]
> **Validación obligatoria**: El código de idioma para construir nombres de columna DEBE validarse contra una lista blanca (`['en', 'es', 'pt', 'sv']`) antes de interpolarlo en SQL. NUNCA aceptar input del usuario directamente en el nombre de columna (riesgo de inyección).

```typescript
const ALLOWED_LANGS = ["en", "es", "pt", "sv"] as const;
type Lang = (typeof ALLOWED_LANGS)[number];

function safeLang(lang: string): Lang {
  return ALLOWED_LANGS.includes(lang.toLowerCase() as Lang)
    ? (lang.toLowerCase() as Lang)
    : "en";
}
```

## Mostrar Textos en el Frontend (React)

### Hook de Selección

```tsx
function useLocalizedField<T extends { name_en: string; name_es?: string; name_pt?: string; name_sv?: string }>(
  item: T,
  lang: string
): string {
  const field = `name_${lang.toLowerCase()}` as keyof T;
  return (item[field] as string) || item.name_en; // Fallback a inglés
}

// Uso:
const countryName = useLocalizedField(country, session.language);
```

### Patrón con Map

```tsx
const LANG_FIELDS = {
  en: "name_en",
  es: "name_es",
  pt: "name_pt",
  sv: "name_sv",
} as const;

function localize(item: Record<string, unknown>, lang: string): string {
  const field = LANG_FIELDS[lang.toLowerCase() as keyof typeof LANG_FIELDS] ?? "name_en";
  return (item[field] as string) || (item.name_en as string);
}
```

## Etiquetas de Estados y Acciones

La tabla `ticket_status_actions` almacena etiquetas i18n directamente:

```sql
INSERT INTO ticket_status_actions (status_name, action_key, label_en, label_es, icon, variant)
VALUES ('OPEN', 'assign', 'Assign', 'Asignar', 'user-plus', 'primary');
```

El frontend renderiza `label_en` o `label_es` según el idioma activo.

## Convenciones de Formato por Locale

### Fechas

| Locale | Formato | Ejemplo |
|--------|---------|---------|
| `en-US` | MM/DD/YYYY | 07/02/2026 |
| `es-419` | DD/MM/YYYY | 02/07/2026 |
| `pt-BR` | DD/MM/YYYY | 02/07/2026 |
| `sv-SE` | YYYY-MM-DD | 2026-07-02 |

Usar `Intl.DateTimeFormat` con el locale del usuario:

```typescript
new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
```

### Monedas

| Moneda | Código | Locale | Ejemplo |
|--------|--------|--------|---------|
| Corona sueca | SEK | `sv-SE` | 1 234,56 kr (moneda corporativa) |
| Dólar | USD | `en-US` | $1,234.56 |
| Peso chileno | CLP | `es-CL` | $1.234 |

```typescript
new Intl.NumberFormat(locale, { style: "currency", currency: "SEK" }).format(amount);
```

## Reglas Obligatorias

> [!CAUTION]
> **REGLAS CRÍTICAS:**

1. **4 idiomas siempre**: Toda tabla maestra traducible DEBE tener las 4 columnas (`_en`, `_es`, `_pt`, `_sv`).
2. **Inglés como fallback**: Si falta una traducción, siempre existe `name_en`.
3. **Sueco obligatorio**: Por ser idioma corporativo Epiroc, el sueco NUNCA debe quedar vacío en datos maestros.
4. **Validación de whitelist**: Al construir nombres de columna dinámicos, validar el código de idioma contra `['en','es','pt','sv']`.
5. **No hardcodear strings en UI**: Textos del usuario deben venir del modelo de datos o un diccionario de traducciones.

## Decision Tree

```
¿La tabla necesita traducciones?
└── Sí → Agregar name_en, name_es, name_pt, name_sv

¿Cómo selecciono el campo correcto?
└── Validar lang contra whitelist → construir name_${lang} → fallback a name_en

¿Qué idioma usa el usuario?
└── Consultar users.language_id → languages.code

¿Falta una traducción?
└── Fallback SIEMPRE a inglés (name_en)

¿Formateo fechas/monedas?
└── Usar Intl con el locale correspondiente al idioma
```

## Best Practices

1. **Completitud**: Nunca dejar columnas `_sv` o `_pt` vacías en seeds.
2. **Validación defensiva**: Whitelist de códigos antes de interpolar en SQL.
3. **Fallback graceful**: Si la traducción falta, mostrar inglés, no romper.
4. **Internacionalización de formatos**: Usar `Intl` para fechas, monedas y números.
5. **Auditoría de cobertura**: Al seedear datos maestros, verificar las 4 columnas.

---

### [2026-07-02] Skill Creation
- Skill nueva para el modelo multilingüe de Logistech (EN/ES/PT/SV).
- Documenta patrón de columnas `_en/_es/_pt/_sv`, tabla `languages` y selección dinámica.
- Incluye convenciones de formato (Intl) y reglas de validación para prevenir inyección SQL.
