import type { Config } from "dompurify";

export const EXPORT_SVG_PURIFY_CONFIG: Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

export const EXPORT_PURIFY_CONFIG: Config = {
  ADD_ATTR: [
    "data-mermaid-index",
    "data-pdf-math",
    "style",
    "class",
    "aria-hidden",
    "viewBox",
    "width",
    "height",
    "d",
    "fill",
    "stroke",
    "xmlns",
  ],
  ADD_TAGS: [
    "svg",
    "path",
    "g",
    "rect",
    "line",
    "polygon",
    "text",
    "defs",
    "clipPath",
    "use",
    "math",
    "semantics",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msub",
    "msup",
    "mfrac",
    "msqrt",
    "mroot",
    "mtext",
    "mspace",
    "mover",
    "munder",
    "munderover",
    "mtable",
    "mtr",
    "mtd",
    "annotation",
  ],
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOW_DATA_ATTR: true,
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "link", "meta", "base"],
  FORBID_ATTR: ["srcset"],
};

const hooked = new WeakSet<object>();

export interface PurifyLike {
  addHook(entryPoint: string, hookFunction: (node: Element) => void): void;
  sanitize(html: string, config: Config): string;
}

export function isSafeDataImage(src: string): boolean {
  return /^data:image\/(?:png|jpe?g|gif|webp|bmp|svg\+xml)(?:;charset=[^;]+)?;base64,/i.test(
    src.trim()
  );
}

export function dropUnsafeResourceAttrs(node: Element): void {
  const tag = node.tagName.toLowerCase();

  if (tag === "img" || tag === "source" || tag === "image") {
    const src =
      node.getAttribute("src") ??
      node.getAttribute("href") ??
      node.getAttribute("xlink:href") ??
      "";
    if (!src || !isSafeDataImage(src)) {
      node.removeAttribute("src");
      node.removeAttribute("href");
      node.removeAttribute("srcset");
      node.removeAttribute("xlink:href");
    }
  }

  if (tag === "a") {
    const href = node.getAttribute("href") ?? "";
    if (/^\s*(?:javascript|data|vbscript|file):/i.test(href)) {
      node.removeAttribute("href");
    }
  }
}

function installHooks(purify: PurifyLike): void {
  if (!hooked.has(purify)) {
    purify.addHook("afterSanitizeAttributes", dropUnsafeResourceAttrs);
    hooked.add(purify);
  }
}

export function sanitizeExportHtml(purify: PurifyLike, html: string): string {
  installHooks(purify);
  return String(purify.sanitize(html, EXPORT_PURIFY_CONFIG));
}

export function sanitizeExportSvg(purify: PurifyLike, svg: string): string {
  installHooks(purify);
  return String(purify.sanitize(svg, EXPORT_SVG_PURIFY_CONFIG));
}
