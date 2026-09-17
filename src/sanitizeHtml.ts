import type { Config } from "dompurify";

export const EXPORT_SVG_PURIFY_CONFIG: Config = {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: [
    "use",
    "circle",
    "ellipse",
    "polyline",
    "tspan",
    "marker",
    "textPath",
    "symbol",
    "title",
    "desc",
  ],
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

const SRC_TAGS = new Set(["img", "source", "image", "feimage"]);
const DATA_IMAGE_HREF_TAGS = new Set(["img", "image", "feimage"]);
const FRAGMENT_HREF_TAGS = new Set([
  "use",
  "pattern",
  "lineargradient",
  "radialgradient",
  "filter",
  "clippath",
  "mask",
  "textpath",
  "mpath",
  "tref",
  "altglyph",
  "glyphref",
  "cursor",
  "animate",
  "set",
  "animatetransform",
  "animatemotion",
]);

export function isSafeDataImage(src: string): boolean {
  return /^data:image\/(?:png|jpe?g|gif|webp|bmp|svg\+xml)(?:;charset=[^;]+)?;base64,/i.test(
    src.trim()
  );
}

export function isSafeFragmentHref(value: string): boolean {
  return /^#[^:\s/#?]+$/.test(value.trim());
}

function isAllowedHref(tag: string, value: string): boolean {
  if (DATA_IMAGE_HREF_TAGS.has(tag)) {
    return isSafeDataImage(value);
  }
  if (FRAGMENT_HREF_TAGS.has(tag)) {
    return isSafeFragmentHref(value);
  }
  if (tag === "a") {
    return !/^\s*(?:javascript|data|vbscript|file):/i.test(value);
  }
  return isSafeFragmentHref(value) || isSafeDataImage(value);
}

function isHrefAttr(attr: Attr): boolean {
  return attr.localName === "href" || attr.name === "href" || attr.name === "xlink:href";
}

function removeHrefAttr(node: Element, attr: Attr): void {
  if (attr.namespaceURI && typeof node.removeAttributeNS === "function") {
    node.removeAttributeNS(attr.namespaceURI, attr.localName);
    return;
  }
  node.removeAttribute(attr.name);
}

export function dropUnsafeResourceAttrs(node: Element): void {
  if (typeof node.tagName !== "string" || !node.attributes) {
    return;
  }

  const tag = node.tagName.toLowerCase();

  if (SRC_TAGS.has(tag)) {
    const src = node.getAttribute("src");
    if (src !== null && !isSafeDataImage(src)) {
      node.removeAttribute("src");
    }
    node.removeAttribute("srcset");
  }

  for (const attr of Array.from(node.attributes)) {
    if (!isHrefAttr(attr)) {
      continue;
    }
    if (!isAllowedHref(tag, attr.value)) {
      removeHrefAttr(node, attr);
    }
  }
}

function installHooks(purify: PurifyLike): void {
  if (!hooked.has(purify)) {
    purify.addHook("beforeSanitizeAttributes", dropUnsafeResourceAttrs);
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
