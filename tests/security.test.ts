import * as path from "path";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { describe, expect, it } from "vitest";
import { webviewCsp } from "../src/csp";
import {
  hasUriScheme,
  imageMimeType,
  isInsideAnyRoot,
  isInsideRoot,
  resolveLocalImagePath,
} from "../src/imagePath";
import { extractMermaidFences } from "../src/mermaidFences";
import { createNonce } from "../src/nonce";
import {
  dropUnsafeResourceAttrs,
  EXPORT_PURIFY_CONFIG,
  isSafeDataImage,
  sanitizeExportHtml,
  sanitizeExportSvg,
} from "../src/sanitizeHtml";

describe("webview CSP", () => {
  const csp = webviewCsp("nOnce_123", "https://example.vscode-cdn.net");

  it("blocks default loads, eval, network, and frames", () => {
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("worker-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/style-src [^;]*unsafe-inline/);
  });

  it("allows only nonce scripts plus the webview source", () => {
    expect(csp).toContain("script-src 'nonce-nOnce_123' https://example.vscode-cdn.net");
    expect(csp).toContain("style-src 'nonce-nOnce_123'");
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).toContain("img-src data:");
  });

  it("rejects a nonce that could break out of the policy", () => {
    expect(() => webviewCsp("abc; img-src *", "https://x")).toThrow(/Invalid CSP nonce/);
  });
});

describe("createNonce", () => {
  it("returns unique base64url values", () => {
    const values = new Set(Array.from({ length: 12 }, () => createNonce()));
    expect(values.size).toBe(12);
    for (const value of values) {
      expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(value.length).toBeGreaterThanOrEqual(22);
    }
  });

  it("enforces a minimum byte length", () => {
    expect(createNonce(1).length).toBe(createNonce(16).length);
  });
});

describe("image path confinement", () => {
  const workspace = path.resolve("/workspace/project");
  const docs = path.resolve("/workspace/project/docs");

  it("resolves a relative image inside the document directory", () => {
    expect(resolveLocalImagePath("./logo.png", docs, [docs, workspace])).toBe(
      path.resolve(docs, "logo.png")
    );
  });

  it("rejects path traversal outside allowed roots", () => {
    expect(
      resolveLocalImagePath("../../.ssh/id_rsa.png", docs, [docs, workspace])
    ).toBeUndefined();
  });

  it("rejects remote, file, and protocol-relative URLs", () => {
    expect(resolveLocalImagePath("https://evil.example/x.png", docs, [docs])).toBeUndefined();
    expect(resolveLocalImagePath("file:///etc/passwd.png", docs, [docs])).toBeUndefined();
    expect(resolveLocalImagePath("//evil.example/x.png", docs, [docs])).toBeUndefined();
    expect(resolveLocalImagePath("javascript:alert(1)", docs, [docs])).toBeUndefined();
  });

  it("rejects null bytes, bad encoding, and unknown extensions", () => {
    expect(resolveLocalImagePath("logo.png\0.txt", docs, [docs])).toBeUndefined();
    expect(resolveLocalImagePath("%E0%A4%A", docs, [docs])).toBeUndefined();
    expect(resolveLocalImagePath("notes.md", docs, [docs])).toBeUndefined();
    expect(resolveLocalImagePath("   ", docs, [docs])).toBeUndefined();
  });

  it("strips query strings before resolving", () => {
    expect(resolveLocalImagePath("logo.png?raw=1#hash", docs, [docs, workspace])).toBe(
      path.resolve(docs, "logo.png")
    );
  });

  it("rejects percent-encoded schemes and empty decoded targets", () => {
    expect(
      resolveLocalImagePath("https%3A%2F%2Fevil.example%2Fa.png", docs, [docs])
    ).toBeUndefined();
    expect(resolveLocalImagePath("?only-query", docs, [docs])).toBeUndefined();
  });

  it("accepts an absolute path that stays inside an allowed root", () => {
    const absolute = path.resolve(docs, "nested", "logo.png");
    expect(resolveLocalImagePath(absolute, docs, [docs, workspace])).toBe(absolute);
  });

  it("classifies Windows drive letters as paths, not URI schemes", () => {
    expect(hasUriScheme("C:\\\\images\\\\a.png")).toBe(false);
    expect(hasUriScheme("https://example.com/a.png")).toBe(true);
  });

  it("maps image extensions and reports containment", () => {
    expect(imageMimeType("a.PNG")).toBe("image/png");
    expect(imageMimeType("a.jpg")).toBe("image/jpeg");
    expect(imageMimeType("a.jpeg")).toBe("image/jpeg");
    expect(imageMimeType("a.gif")).toBe("image/gif");
    expect(imageMimeType("a.webp")).toBe("image/webp");
    expect(imageMimeType("a.svg")).toBe("image/svg+xml");
    expect(imageMimeType("a.bmp")).toBe("image/bmp");
    expect(imageMimeType("a.txt")).toBeUndefined();
    expect(isInsideRoot(path.join(docs, "a.png"), docs)).toBe(true);
    expect(isInsideAnyRoot(path.resolve("/etc/passwd.png"), [workspace])).toBe(false);
  });
});

describe("HTML sanitizer", () => {
  const purify = DOMPurify(new JSDOM("<!doctype html>").window);

  it("does not allow unknown protocols", () => {
    expect(EXPORT_PURIFY_CONFIG.ALLOW_UNKNOWN_PROTOCOLS).toBe(false);
  });

  it("strips script tags and javascript URLs", () => {
    const html = sanitizeExportHtml(
      purify,
      `<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>`
    );
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).toMatch(/ok/);
  });

  it("drops remote images and keeps safe data URIs", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const html = sanitizeExportHtml(
      purify,
      `<img src="https://evil.example/track.png"><img src="${png}" alt="ok">`
    );
    expect(html).not.toContain("https://evil.example");
    expect(html).toContain(png);
  });

  it("sanitizes SVG without remote hrefs or scripts", () => {
    const svg = sanitizeExportSvg(
      purify,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><image href="https://evil.example/x.png"></image><rect width="10" height="10"/></svg>`
    );
    expect(svg).toMatch(/<svg/i);
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toContain("https://evil.example");
  });

  it("classifies data image URLs", () => {
    expect(isSafeDataImage("data:image/jpeg;base64,aaa")).toBe(true);
    expect(isSafeDataImage("data:image/svg+xml;charset=utf-8;base64,aaa")).toBe(true);
    expect(isSafeDataImage("data:text/html;base64,aaa")).toBe(false);
    expect(isSafeDataImage("https://x/y.png")).toBe(false);
  });

  it("drops unsafe attributes from element nodes", () => {
    const { window } = new JSDOM("<!doctype html>");
    const img = window.document.createElement("img");
    img.setAttribute("src", "https://evil.example/x.png");
    img.setAttribute("srcset", "https://evil.example/x.png 1x");
    dropUnsafeResourceAttrs(img);
    expect(img.getAttribute("src")).toBeNull();

    const anchor = window.document.createElement("a");
    anchor.setAttribute("href", " data:text/html,hi");
    dropUnsafeResourceAttrs(anchor);
    expect(anchor.getAttribute("href")).toBeNull();

    const image = window.document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("href", "https://evil.example/x.png");
    dropUnsafeResourceAttrs(image);
    expect(image.getAttribute("href")).toBeNull();

    const source = window.document.createElement("source");
    source.setAttribute("src", "https://evil.example/x.png");
    dropUnsafeResourceAttrs(source);
    expect(source.getAttribute("src")).toBeNull();
  });
});

describe("mermaid fence extraction", () => {
  it("extracts mermaid fences and leaves other markdown", () => {
    const input = [
      "# Title",
      "",
      "```mermaid",
      "graph TD",
      "  A-->B",
      "```",
      "",
      "Inline `mermaid` stays.",
      "",
      "~~~mermaid",
      "sequenceDiagram",
      "  A->>B: hi",
      "~~~",
    ].join("\n");

    const result = extractMermaidFences(input, "sample.md");
    expect(result.sourceName).toBe("sample.md");
    expect(result.diagrams).toHaveLength(2);
    expect(result.diagrams[0]).toContain("graph TD");
    expect(result.markdown).toContain('data-mermaid-index="0"');
    expect(result.markdown).toContain('data-mermaid-index="1"');
    expect(result.markdown).toContain("Inline `mermaid` stays.");
  });
});
