import { detectMermaidDiagramKind } from "./mermaidKind";

/**
 * flowchart-elk is registered by mermaid@11.16.1 but the ELK layout
 * loader is not shipped in this package. Bundling @mermaid-js/layout-elk
 * would add a second layout engine (and potentially a worker) we do not
 * want in the offline webview.
 */
export const FLOWCHART_ELK_UNSUPPORTED_REASON =
  "flowchart-elk needs the ELK layout engine (@mermaid-js/layout-elk), which mermaid@11.16.1 does not bundle. This exporter stays on the packaged dagre layout. Use `flowchart` or `graph` instead.";

export interface MermaidExportSupport {
  supported: boolean;
  kind: string;
  reason?: string;
}

export function getMermaidExportSupport(source: string): MermaidExportSupport {
  const kind = detectMermaidDiagramKind(source);
  if (kind === "flowchart-elk") {
    return {
      supported: false,
      kind,
      reason: FLOWCHART_ELK_UNSUPPORTED_REASON,
    };
  }
  return { supported: true, kind };
}

export function mermaidRenderWarningHtml(
  kind: string,
  source: string,
  message: string
): string {
  return (
    "<pre><code>" +
    escapeHtml(source) +
    "</code></pre>" +
    '<p class="mermaid-diagram-warning">Diagram Render Warning (' +
    escapeHtml(kind) +
    "): " +
    escapeHtml(message) +
    "</p>"
  );
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
