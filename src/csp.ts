function assertCspNonce(nonce: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(nonce)) {
    throw new Error("Invalid CSP nonce");
  }
}

export function webviewCsp(nonce: string, cspSource: string): string {
  assertCspNonce(nonce);

  return [
    "default-src 'none'",
    "img-src data:",
    `style-src 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `script-src 'nonce-${nonce}' ${cspSource}`,
    `font-src data: ${cspSource}`,
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "worker-src 'none'",
  ].join("; ");
}

/**
 * Mermaid (and other SVG) inserts `<style>` nodes after render. style-src is
 * nonce-only, so every style element — including nested defs / nested svg —
 * must carry the page nonce before the markup is attached to the document.
 */
export function applyNonceToStyleElements(root: ParentNode, nonce: string): number {
  assertCspNonce(nonce);

  const styles = root.querySelectorAll("style");
  styles.forEach((style) => {
    style.setAttribute("nonce", nonce);
  });
  return styles.length;
}
