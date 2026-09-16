export function webviewCsp(nonce: string, cspSource: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(nonce)) {
    throw new Error("Invalid CSP nonce");
  }

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
