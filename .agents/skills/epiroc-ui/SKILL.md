---
name: epiroc-ui
description: Maintains CSS styling and visual design consistency for Epiroc React 19 applications following the official Epiroc brand guidelines and Tailwind CSS v4. Ensures all components use correct colors, typography, and visual patterns. Supports light and dark themes with proper contrast ratios. Automatically activates when creating or styling components to ensure brand compliance.
---

# Epiroc UI Skill

Maintains visual design excellence and brand consistency across all Epiroc applications by enforcing strict styling systems, brand guidelines, typography standards, and Tailwind CSS v4 patterns.

## When to use this skill

- Creating, modifying, or reviewing CSS stylesheets or Tailwind classes
- Applying colors, backgrounds, or themes to React components
- Designing layout panels, cards, or status indicators
- Verifying WCAG 2.1 AA contrast compliance
- Troubleshooting dark / light theme overrides
- Trigger keywords: CSS, style, color, theme, dark mode, light mode, branding, typography, tailwind, font, raleway

## Dependencies

This skill must coordinate with:

- **epiroc-ux**: For App shell structures and grid layouts
- **epiroc-components**: For reusable component styling
- **epiroc-coding**: For file organization, tsx classes, and folder rules

## Project Directory Structure

Every agent interaction must strictly respect the designated full-stack folder layout. It is **FORBIDDEN** to write scratch scripts, mock-up files, or helper scripts directly in the workspace root or key subdirectories.

```
├── .agents/                    # Agent specifications and skills (epiroc-coding, epiroc-qa, etc.)
├── client/                     # Frontend SPA React 19 Client
│   ├── public/                 # Static frontend assets
│   ├── src/                    # React frontend source files
│   │   ├── components/         # Reusable UI Components (Sidebar, Header, etc.)
│   │   ├── pages/              # SPA Pages (Dashboard, admin/Configuration, etc.)
│   │   ├── App.tsx             # Client orchestrator: routing, theme, SSO session context
│   │   ├── index.css           # Tailwind CSS v4 & Raleway configuration & custom styles
│   │   └── main.tsx            # React client entry point
│   ├── package.json            # Frontend dependencies & scripts
│   ├── tsconfig.json           # Frontend TypeScript compiler options
│   └── vite.config.ts          # Vite build config with backend proxy
├── server/                     # Backend Express API Server
│   ├── controllers/            # API Route Controllers (auth, ticket, etc.)
│   ├── db/                     # Promisified DuckDB database connection & bootstrapping
│   │   ├── db.ts               # Promised-based queries & exec connector for DuckDB
│   │   └── regen.ts            # Surgical database regeneration/bootstrap script
│   ├── routes/                 # Express REST endpoint routing
│   ├── index.ts                # Main Express server entry point
│   ├── duckdb.d.ts             # Safe TypeScript module typings for duckdb package
│   ├── package.json            # Server runtime dependencies
│   └── tsconfig.json           # Server TypeScript compiler options
├── public/                     # General public assets, logos, and icons
├── schema.sql                  # Structural DDL table definitions (strictly no DML data)
├── init_values.sql             # Reference master data & seeding DML inserts (strictly no DDL)
├── local.db                    # Promisified persistent local DuckDB file
├── .eslintrc.json              # Central eslint rule configuration for the project
├── package.json                # Root package for concurrently starting client and server
└── tsconfig.json               # Root shared TypeScript compiler options
```

## Epiroc Brand Colors (STRICT PALETTE)

> [!IMPORTANT]
> It is strictly FORBIDDEN to use any color hex or RGB values that are not part of the official Epiroc palette.

### Brand Colors Matrix

| CSS Theme Token              | RGB Value            | Purpose                                    |
| ---------------------------- | -------------------- | ------------------------------------------ |
| `--color-epiroc-grey`        | `rgb(66, 85, 99)`    | Primary text, titles, deep borders         |
| `--color-epiroc-yellow`      | `rgb(255, 199, 44)`  | Corporate yellow accent, CTAs, hover rings |
| `--color-epiroc-dark-blue`   | `rgb(0, 30, 50)`     | Deep primary containers, buttons text      |
| `--color-epiroc-dark-grey`   | `rgb(119, 116, 110)` | Muted copy, secondary details              |
| `--color-epiroc-medium-grey` | `rgb(180, 180, 170)` | Standard border lines                      |
| `--color-epiroc-light-grey`  | `rgb(236, 235, 228)` | Cool backgrounds, cards                    |
| `--color-epiroc-red`         | `rgb(183, 49, 44)`   | Error indicators, critical states          |
| `--color-epiroc-orange`      | `rgb(216, 96, 24)`   | Warnings, pending labels                   |
| `--color-epiroc-green`       | `rgb(76, 140, 43)`   | Success indicators, approved states        |
| `--color-epiroc-light-blue`  | `rgb(72, 169, 197)`  | Links, active headers                      |
| `--color-epiroc-violet`      | `rgb(97, 44, 81)`    | Special entity identifiers                 |

## Typography & Fonts

All texts in the application MUST use **Raleway** as the primary font family.

```css
font-family: "Raleway", sans-serif;
```

## Styling Architecture: Tailwind CSS v4 + `client/src/index.css`

The styling is compiled using Tailwind CSS v4 directly inside `client/src/index.css`. The corporate color palette is registered using Tailwind's `@theme` directive, which enables using classes like `text-epiroc-yellow`, `bg-epiroc-dark-blue`, or `border-epiroc-medium-grey`.

### Theme Registration in `index.css`

```css
@import "tailwindcss";

@theme {
  --color-epiroc-grey: rgb(66, 85, 99);
  --color-epiroc-yellow: rgb(255, 199, 44);
  --color-epiroc-dark-grey: rgb(119, 116, 110);
  --color-epiroc-medium-grey: rgb(180, 180, 170);
  --color-epiroc-light-grey: rgb(236, 235, 228);
  --color-epiroc-dark-blue: rgb(0, 30, 50);
  --color-epiroc-violet: rgb(97, 44, 81);
  --color-epiroc-light-blue: rgb(72, 169, 197);
  --color-epiroc-red: rgb(183, 49, 44);
  --color-epiroc-orange: rgb(216, 96, 24);
  --color-epiroc-green: rgb(76, 140, 43);

  --font-sans: "Raleway", sans-serif;
}
```

## Light and Dark Theme Orchestration

We use a CSS variable abstraction to manage theme state (`data-theme="dark"` on the root document).

```css
:root {
  --bg-primary: rgb(236, 235, 228);
  --bg-secondary: rgba(236, 235, 228, 0.92);
  --bg-card: #ffffff;
  --text-primary: rgb(66, 85, 99);
  --text-secondary: rgb(119, 116, 110);
  --border-color: rgb(180, 180, 170);
}

[data-theme="dark"] {
  --bg-primary: rgb(0, 30, 50);
  --bg-secondary: rgba(0, 30, 50, 0.95);
  --bg-card: rgb(11, 41, 61);
  --text-primary: rgb(236, 235, 228);
  --text-secondary: rgb(180, 180, 170);
  --border-color: rgb(66, 85, 99);
}
```

## Strict Formatting & Inline Style Prohibitions

> [!CAUTION]
> **PROHIBICIÓN DE ESTILOS INLINE**: Está estrictamente PROHIBIDO el uso de estilos en línea (`style={{ ... }}` en React/JSX). Es obligatorio utilizar los archivos y clases CSS definidos y demostrados en la guía de estilos.
>
> **PROHIBICIÓN DE DIÁLOGOS NATIVOS**: Está estrictamente **PROHIBIDO** usar diálogos nativos del navegador como `alert()`, `confirm()`, o `prompt()`. Rompen la experiencia visual premium, violan los estándares estéticos y no cumplen con la accesibilidad de la marca. Toda interacción con el usuario debe realizarse utilizando componentes UI React premium (como `<Modal />` importado de `client/src/components/Modal.tsx` o notificaciones en pantalla integradas).

All elements must use utility-first Tailwind classes (e.g. `className="bg-card text-primary p-6 rounded border border-border"`) or custom selectors defined in `index.css`.

## Contrast Guidelines (WCAG 2.1 AA)

- **Standard Text**: Ratio of at least 4.5:1. Never use light grey text on a white/light-grey background.
- **CTAs & Buttons**: Ensure button text uses dark blue (`var(--color-epiroc-dark-blue)`) over corporate yellow (`var(--color-epiroc-yellow)`) to secure high readability.

---

### [2026-05-19] Stack Update: Tailwind CSS v4 & Raleway Pivot

- Completely replaced Dash static css file maps with Tailwind CSS v4 `@theme` integrations inside `client/src/index.css`.
- Formalized React 19 inline styling prohibitions.
- Adjusted all custom scrollbar, accessibility skip links, and focus rings to compile natively in Vite.
