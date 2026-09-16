export interface MermaidExtraction {
  markdown: string;
  diagrams: string[];
  sourceName: string;
}

export function extractMermaidFences(
  markdown: string,
  sourceName: string
): MermaidExtraction {
  const diagrams: string[] = [];
  const fencePattern = /^(`{3,}|~{3,})\s*mermaid[^\r\n]*\r?\n([\s\S]*?)^\1\s*$/gim;

  const prepared = markdown.replace(
    fencePattern,
    (_match, _fence: string, code: string) => {
      const index = diagrams.push(code.trim()) - 1;
      return `\n<div class="mermaid-pdf-diagram" data-mermaid-index="${index}"></div>\n`;
    }
  );

  return { markdown: prepared, diagrams, sourceName };
}
