import fs from "node:fs";
import path from "node:path";

/**
 * Script de compilación y publicación de documentos corporativos Epiroc
 * Transforma un archivo Markdown con Frontmatter YAML a HTML maquetado con estilos Epiroc
 * listo para imprimir como PDF o transformar a DOCX.
 *
 * Uso: npx tsx .agents/skills/epiroc-doc-publisher/scripts/export_doc.ts <archivo.md> [--lang=es|en|pt] [--format=html|pdf]
 */

interface DocHistoryEntry {
  version: string;
  date: string;
  author: string;
  changes: string;
}

interface DocMetadata {
  title: string;
  subtitle?: string;
  system?: string;
  module?: string;
  workspace_id?: number | string;
  doc_type?: string;
  version?: string;
  language?: string;
  date?: string;
  author?: string;
  author_email?: string;
  author_role?: string;
  reviewer?: string;
  reviewer_email?: string;
  reviewer_role?: string;
  classification?: string;
  history?: DocHistoryEntry[];
}

interface I18nLabels {
  system: string;
  module: string;
  workspace: string;
  preparedBy: string;
  reviewedBy: string;
  version: string;
  date: string;
  classification: string;
  historyTitle: string;
  colVersion: string;
  colDate: string;
  colAuthor: string;
  colChanges: string;
  footerDept: string;
  footerRights: string;
  footerConfidential: string;
}

const LOCALES: Record<string, I18nLabels> = {
  es: {
    system: "Sistema",
    module: "Módulo",
    workspace: "Workspace ID",
    preparedBy: "Elaborado Por",
    reviewedBy: "Revisado Por",
    version: "Versión",
    date: "Fecha de Emisión",
    classification: "Clasificación",
    historyTitle: "Control de Revisiones y Cambios",
    colVersion: "Versión",
    colDate: "Fecha",
    colAuthor: "Autor / Revisor",
    colChanges: "Resumen de Modificaciones",
    footerDept: "Epiroc Chile • Dirección de Tecnología y Procesos",
    footerRights: "Confidencial • Todos los derechos reservados",
    footerConfidential: "Documento de Uso Interno Confidencial",
  },
  en: {
    system: "System",
    module: "Module",
    workspace: "Workspace ID",
    preparedBy: "Prepared By",
    reviewedBy: "Reviewed By",
    version: "Version",
    date: "Issue Date",
    classification: "Classification",
    historyTitle: "Revision History & Change Control",
    colVersion: "Version",
    colDate: "Date",
    colAuthor: "Author / Reviewer",
    colChanges: "Summary of Changes",
    footerDept: "Epiroc • Global Technology & Process Excellence",
    footerRights: "Confidential • All rights reserved",
    footerConfidential: "Confidential - Internal Use Only",
  },
  pt: {
    system: "Sistema",
    module: "Módulo",
    workspace: "Workspace ID",
    preparedBy: "Elaborado Por",
    reviewedBy: "Revisado Por",
    version: "Versão",
    date: "Data de Emissão",
    classification: "Classificação",
    historyTitle: "Histórico de Revisões e Alterações",
    colVersion: "Versão",
    colDate: "Data",
    colAuthor: "Autor / Revisor",
    colChanges: "Resumo das Modificações",
    footerDept: "Epiroc Brasil • Diretoria de Tecnologia e Processos",
    footerRights: "Confidencial • Todos os direitos reservados",
    footerConfidential: "Documento de Uso Interno Confidencial",
  },
};

function parseFrontmatter(rawContent: string): {
  metadata: DocMetadata;
  body: string;
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = rawContent.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: {
        title: "Documento Logistech",
        version: "1.0",
        date: new Date().toISOString().split("T")[0],
        author: "Epiroc Team",
        classification: "Uso Interno Epiroc",
      },
      body: rawContent,
    };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const metadata: Partial<DocMetadata> = {};

  const lines = yamlBlock.split(/\r?\n/);
  let currentListKey: string | null = null;
  let currentListItem: Record<string, string> | null = null;
  const historyList: DocHistoryEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Check history list
    if (trimmed.startsWith("history:")) {
      currentListKey = "history";
      continue;
    }

    if (currentListKey === "history") {
      if (trimmed.startsWith("- ")) {
        if (currentListItem) {
          historyList.push(currentListItem as unknown as DocHistoryEntry);
        }
        currentListItem = {};
        const rest = trimmed.substring(2).trim();
        const colonIdx = rest.indexOf(":");
        if (colonIdx > 0) {
          const k = rest.substring(0, colonIdx).trim();
          const v = rest
            .substring(colonIdx + 1)
            .trim()
            .replace(/^['"](.*)['"]$/, "$1");
          currentListItem[k] = v;
        }
        continue;
      } else if (
        trimmed.startsWith("version:") ||
        trimmed.startsWith("date:") ||
        trimmed.startsWith("author:") ||
        trimmed.startsWith("changes:")
      ) {
        const colonIdx = trimmed.indexOf(":");
        const k = trimmed.substring(0, colonIdx).trim();
        const v = trimmed
          .substring(colonIdx + 1)
          .trim()
          .replace(/^['"](.*)['"]$/, "$1");
        if (currentListItem) {
          currentListItem[k] = v;
        }
        continue;
      } else if (!line.startsWith(" ") && !line.startsWith("\t")) {
        currentListKey = null;
        if (currentListItem) {
          historyList.push(currentListItem as unknown as DocHistoryEntry);
          currentListItem = null;
        }
      }
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const key = trimmed.substring(0, colonIdx).trim();
      const val = trimmed
        .substring(colonIdx + 1)
        .trim()
        .replace(/^['"](.*)['"]$/, "$1");
      (metadata as Record<string, unknown>)[key] = val;
    }
  }

  if (currentListItem) {
    historyList.push(currentListItem as unknown as DocHistoryEntry);
  }

  if (historyList.length > 0) {
    metadata.history = historyList;
  }

  return {
    metadata: {
      title: metadata.title || "Documentación Logistech",
      subtitle: metadata.subtitle || "",
      system: metadata.system || "Logistech Enterprise Suite",
      module: metadata.module || "General",
      version: metadata.version || "1.0",
      language: metadata.language || "es",
      date: metadata.date || new Date().toISOString().split("T")[0],
      author: metadata.author || "Epiroc Systems Team",
      author_email: metadata.author_email || "",
      reviewer: metadata.reviewer || "Eduardo Acuña",
      reviewer_email: metadata.reviewer_email || "",
      classification: metadata.classification || "Uso Interno Epiroc",
      history: metadata.history || [
        {
          version: metadata.version || "1.0",
          date: metadata.date || new Date().toISOString().split("T")[0],
          author: metadata.author || "Epiroc Systems Team",
          changes: "Emisión inicial",
        },
      ],
    },
    body,
  };
}

function markdownToHtml(md: string): string {
  // Convert standard elements
  let html = md;

  // Escape basic script tags
  html = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Alert Callouts (> [!NOTE], > [!TIP], etc.)
  html = html.replace(
    />\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\r?\n((?:>[^\r\n]*\r?\n?)+)/gi,
    (_match, type, content) => {
      const cleanContent = content.replace(/^>\s?/gm, "").trim();
      const typeLower = type.toLowerCase();
      const label = type.toUpperCase();
      return `<div class="alert-box ${typeLower}"><div class="alert-title">${label}</div><p>${cleanContent}</p></div>\n`;
    },
  );

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline Code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Code Blocks
  html = html.replace(
    /```([a-z0-9_-]*)\r?\n([\s\S]*?)```/gim,
    (_m, lang, code) => {
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
    },
  );

  // Markdown Tables
  html = html.replace(/((?:\|[^\r\n]+\|\r?\n)+)/g, (tableBlock) => {
    const rows = tableBlock
      .trim()
      .split(/\r?\n/)
      .filter((r) => r.trim().startsWith("|"));
    if (rows.length < 2) return tableBlock;

    let res = "<table>\n";
    let isHeader = true;

    for (const row of rows) {
      // Check if it's separator row (|---|---|)
      if (/^\|(\s*[-:]+\s*\|)+$/.test(row.trim())) {
        isHeader = false;
        continue;
      }

      const cells = row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (isHeader) {
        res += "  <thead>\n    <tr>\n";
        cells.forEach((cell) => {
          res += `      <th>${cell}</th>\n`;
        });
        res += "    </tr>\n  </thead>\n  <tbody>\n";
      } else {
        res += "    <tr>\n";
        cells.forEach((cell) => {
          res += `      <td>${cell}</td>\n`;
        });
        res += "    </tr>\n";
      }
    }
    res += "  </tbody>\n</table>\n";
    return res;
  });

  // Unordered Lists
  html = html.replace(/^\s*-\s+(.*)$/gim, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\r?\n?)+)/g, "<ul>\n$1</ul>\n");

  // Ordered Lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="ol-item">$1</li>');
  html = html.replace(
    /((?:<li class="ol-item">.*<\/li>\r?\n?)+)/g,
    "<ol>\n$1</ol>\n",
  );
  html = html.replace(/class="ol-item"/g, "");

  // Paragraphs for remaining text lines
  const lines = html.split(/\r?\n\r?\n/);
  const formatted = lines.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<table") ||
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("<div") ||
      trimmed.startsWith("---")
    ) {
      return trimmed;
    }
    if (trimmed === "---") {
      return '<hr style="border:0; border-top:1.5px solid #ECEBE4; margin: 24px 0;" />';
    }
    return `<p>${trimmed.replace(/\r?\n/g, "<br/>")}</p>`;
  });

  return formatted.join("\n\n");
}

function loadLogos(): { yellowSvg: string; greySvg: string } {
  const publicDir = path.resolve(process.cwd(), "client", "public");
  const yellowLogoPath = path.join(publicDir, "1. 1 Logo Epiroc amarillo.svg");
  const greyLogoPath = path.join(publicDir, "1.2 Logo Epiroc Gris.svg");

  const yellowSvg = fs.existsSync(yellowLogoPath)
    ? fs.readFileSync(yellowLogoPath, "utf8")
    : "";
  const greySvg = fs.existsSync(greyLogoPath)
    ? fs.readFileSync(greyLogoPath, "utf8")
    : "";

  return { yellowSvg, greySvg };
}

function buildFullHtml(
  metadata: DocMetadata,
  bodyHtml: string,
  cssContent: string,
  targetLang = "es",
): string {
  const langKey = LOCALES[targetLang] ? targetLang : "es";
  const labels = LOCALES[langKey];
  const { greySvg } = loadLogos();
  const brandLogoHtml = greySvg
    ? greySvg.replace(
        /<svg\b/i,
        '<svg style="height: 42px; width: auto; max-width: 220px;"',
      )
    : "EPIROC";

  const historyRows = (metadata.history || [])
    .map(
      (h) => `
    <tr>
      <td><strong>${h.version}</strong></td>
      <td>${h.date}</td>
      <td>${h.author}</td>
      <td>${h.changes}</td>
    </tr>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${langKey}">
<head>
  <meta charset="UTF-8">
  <title>${metadata.title} - Epiroc Logistech</title>
  <style>
${cssContent}
  </style>
</head>
<body>

  <!-- ==================== PORTADA CORPORATIVA ==================== -->
  <div class="cover-page">
    <div class="cover-accent-top"></div>

    <div class="cover-header">
      <div class="cover-header-brand">${brandLogoHtml}</div>
      <div class="cover-header-system">${metadata.system || "Logistech Enterprise Suite"} &bull; ${labels.module} ${metadata.module || ""}</div>
    </div>

    <div class="cover-body">
      <h1 class="cover-title">${metadata.title}</h1>
      ${metadata.subtitle ? `<div class="cover-subtitle">${metadata.subtitle}</div>` : ""}

      <table class="cover-metadata-table">
        <tr>
          <th>${labels.system}</th>
          <td>${metadata.system || "Logistech"}</td>
          <th>${labels.module}</th>
          <td>${metadata.module || "General"} (${labels.workspace}: ${metadata.workspace_id || "1"})</td>
        </tr>
        <tr>
          <th>${labels.preparedBy}</th>
          <td>${metadata.author}${metadata.author_role ? ` (${metadata.author_role})` : ""}</td>
          <th>${labels.reviewedBy}</th>
          <td>${metadata.reviewer}${metadata.reviewer_role ? ` (${metadata.reviewer_role})` : ""}</td>
        </tr>
        <tr>
          <th>${labels.version}</th>
          <td><strong>v${metadata.version}</strong></td>
          <th>${labels.date}</th>
          <td>${metadata.date}</td>
        </tr>
        <tr>
          <th>${labels.classification}</th>
          <td colspan="3"><span style="color:#B7312C; font-weight:700;">&bull;</span> ${metadata.classification}</td>
        </tr>
      </table>
    </div>

    <div class="cover-footer">
      <div>${labels.footerDept}</div>
      <div>${labels.footerRights}</div>
    </div>
  </div>

  <!-- ==================== CONTROL DE REVISIONES ==================== -->
  <div class="history-section">
    <div class="history-title">${labels.historyTitle}</div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">${labels.colVersion}</th>
          <th style="width: 15%;">${labels.colDate}</th>
          <th style="width: 25%;">${labels.colAuthor}</th>
          <th>${labels.colChanges}</th>
        </tr>
      </thead>
      <tbody>
        ${historyRows}
      </tbody>
    </table>
  </div>

  <!-- ==================== CUERPO DEL DOCUMENTO ==================== -->
  <div class="doc-body">
    ${bodyHtml}
  </div>

</body>
</html>`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Uso: npx tsx .agents/skills/epiroc-doc-publisher/scripts/export_doc.ts <ruta-archivo.md> [--lang=es|en|pt] [--format=html|pdf]

Argumentos:
  <ruta-archivo.md>   Ruta al archivo Markdown que contiene los metadatos YAML.
  --lang              Idioma del documento: 'es' (Español), 'en' (Inglés), 'pt' (Portugués).
  --format            Formato de salida deseado: 'html' (por defecto) o 'pdf'.
    `);
    process.exit(0);
  }

  const inputPath = path.resolve(args[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: No existe el archivo "${inputPath}"`);
    process.exit(1);
  }

  // Parse arguments
  let targetLang = "es";
  const langArg = args.find((a: string) => a.startsWith("--lang="));
  if (langArg) {
    targetLang = langArg.split("=")[1].toLowerCase();
  }

  const rawContent = fs.readFileSync(inputPath, "utf8");
  const { metadata, body } = parseFrontmatter(rawContent);

  if (!langArg && metadata.language) {
    targetLang = metadata.language.toLowerCase();
  }

  // Read Epiroc Theme CSS
  const cssPath = path.resolve(
    process.cwd(),
    ".agents",
    "skills",
    "epiroc-doc-publisher",
    "resources",
    "epiroc_doc_theme.css",
  );
  const cssContent = fs.existsSync(cssPath)
    ? fs.readFileSync(cssPath, "utf8")
    : "";

  const bodyHtml = markdownToHtml(body);
  const fullHtml = buildFullHtml(metadata, bodyHtml, cssContent, targetLang);

  // Ensure export directory exists
  const exportDir = path.resolve(process.cwd(), "docs", "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outHtmlPath = path.join(exportDir, `${baseName}_${targetLang}.html`);

  fs.writeFileSync(outHtmlPath, fullHtml, "utf8");
  console.log(
    `\nDocumento HTML maquetado con estilo Epiroc generado con éxito:`,
  );
  console.log(`   Ruta: ${outHtmlPath}`);
  console.log(
    `   Idioma: ${targetLang.toUpperCase()} (${targetLang === "en" ? "English" : targetLang === "pt" ? "Português" : "Español"})`,
  );
  console.log(`   Título: ${metadata.title} (v${metadata.version})`);
  console.log(`   Autor: ${metadata.author}`);
  console.log(`   Listo para imprimir como PDF o abrir en navegador/Word.\n`);
}

main().catch((err) => {
  console.error("Error durante la exportación:", err);
  process.exit(1);
});
