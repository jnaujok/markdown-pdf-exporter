/**
 * First diagram keyword after YAML front-matter / %% comments / %%{init}%%.
 * Used for per-type export warnings; not a substitute for mermaid.parse().
 */
export function detectMermaidDiagramKind(source: string): string {
  const stripped = stripPreamble(source);
  const match = stripped.match(/^([A-Za-z][A-Za-z0-9_-]*)/);
  return match?.[1] ?? "unknown";
}

export function stripPreamble(source: string): string {
  let text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  if (text.startsWith("---")) {
    const closed = text.match(/^---\n[\s\S]*?\n(?:---|\.\.\.)(?:\n|$)/);
    if (closed) {
      text = text.slice(closed[0].length);
    }
  }

  let previous = "";
  while (text !== previous) {
    previous = text;
    text = text
      .replace(/^\s*%%\{[\s\S]*?\}%%[ \t]*/u, "")
      .replace(/^\s*%%(?!\{)[^\n]*\n?/, "")
      .replace(/^\s+/, "");
  }

  return text;
}
