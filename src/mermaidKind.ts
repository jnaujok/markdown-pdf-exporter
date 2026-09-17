/**
 * First diagram keyword after YAML front-matter / %% comments.
 * Used for per-type export warnings; not a substitute for mermaid.parse().
 */
export function detectMermaidDiagramKind(source: string): string {
  const stripped = stripPreamble(source);
  const match = stripped.match(/^([A-Za-z][A-Za-z0-9_-]*)/);
  return match?.[1] ?? "unknown";
}

function stripPreamble(source: string): string {
  let text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  if (text.startsWith("---")) {
    const closed = text.match(/^---\n[\s\S]*?\n(?:---|\.\.\.)(?:\n|$)/);
    if (closed) {
      text = text.slice(closed[0].length);
    }
  }

  return text.replace(/^\s*%%(?!\{)[^\n]*\n?/gm, "").trimStart();
}
