import * as path from "path";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { describe, expect, it } from "vitest";
import { applyNonceToStyleElements, webviewCsp } from "../src/csp";
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
  isSafeFragmentHref,
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

describe("applyNonceToStyleElements", () => {
  const nonce = "nOnce_123";

  it("stamps the nonce on nested Mermaid style nodes, including defs and nested svg", () => {
    const { window } = new JSDOM("<!doctype html>");
    const root = window.document.createElement("div");
    root.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <style>.root { color: red; }</style>
        <defs>
          <style>.defs { color: blue; }</style>
        </defs>
        <g>
          <svg>
            <style>.nested { color: green; }</style>
          </svg>
        </g>
      </svg>
      <style>.sibling { color: black; }</style>
    `;

    expect(applyNonceToStyleElements(root, nonce)).toBe(4);
    const styles = [...root.querySelectorAll("style")];
    expect(styles).toHaveLength(4);
    for (const style of styles) {
      expect(style.getAttribute("nonce")).toBe(nonce);
    }
  });

  it("does not miss style nodes that are not direct svg children", () => {
    const { window } = new JSDOM("<!doctype html>");
    const root = window.document.createElement("div");
    root.innerHTML = `<div><svg><g><style id="deep">.x{}</style></g></svg></div>`;

    applyNonceToStyleElements(root, nonce);
    expect(root.querySelector("#deep")?.getAttribute("nonce")).toBe(nonce);
  });

  it("rejects a nonce that could break out of the policy", () => {
    const { window } = new JSDOM("<!doctype html>");
    expect(() =>
      applyNonceToStyleElements(window.document.body, "abc; img-src *")
    ).toThrow(/Invalid CSP nonce/);
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

  it("classifies fragment hrefs used by SVG <use>", () => {
    expect(isSafeFragmentHref("#marker")).toBe(true);
    expect(isSafeFragmentHref("#foo-bar_1")).toBe(true);
    expect(isSafeFragmentHref("https://evil.example/x.svg#icon")).toBe(false);
    expect(isSafeFragmentHref("javascript:alert(1)")).toBe(false);
    expect(isSafeFragmentHref("#foo:bar")).toBe(false);
  });

  it("validates href and xlink:href independently on SVG image mixed pairs", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const { window } = new JSDOM("<!doctype html>");
    const xlinkNs = "http://www.w3.org/1999/xlink";
    const svgNs = "http://www.w3.org/2000/svg";

    const hrefAttrs = (el: Element) =>
      [...el.attributes]
        .filter((attr) => attr.localName === "href" || attr.name === "xlink:href")
        .map((attr) => ({ ns: attr.namespaceURI, value: attr.value }));

    const safeHrefUnsafeXlink = window.document.createElementNS(svgNs, "image");
    safeHrefUnsafeXlink.setAttribute("href", png);
    safeHrefUnsafeXlink.setAttributeNS(xlinkNs, "href", "https://evil.example/x.png");
    dropUnsafeResourceAttrs(safeHrefUnsafeXlink);
    expect(hrefAttrs(safeHrefUnsafeXlink)).toEqual([{ ns: null, value: png }]);

    const unsafeHrefSafeXlink = window.document.createElementNS(svgNs, "image");
    unsafeHrefSafeXlink.setAttribute("href", "https://evil.example/x.png");
    unsafeHrefSafeXlink.setAttributeNS(xlinkNs, "href", png);
    dropUnsafeResourceAttrs(unsafeHrefSafeXlink);
    expect(hrefAttrs(unsafeHrefSafeXlink)).toEqual([{ ns: xlinkNs, value: png }]);

    const bothUnsafe = window.document.createElementNS(svgNs, "image");
    bothUnsafe.setAttribute("href", "https://evil.example/a.png");
    bothUnsafe.setAttribute("xlink:href", "https://evil.example/b.png");
    dropUnsafeResourceAttrs(bothUnsafe);
    expect(hrefAttrs(bothUnsafe)).toEqual([]);
  });

  it("validates href and xlink:href independently on SVG use mixed pairs", () => {
    const { window } = new JSDOM("<!doctype html>");
    const xlinkNs = "http://www.w3.org/1999/xlink";
    const svgNs = "http://www.w3.org/2000/svg";

    const use = window.document.createElementNS(svgNs, "use");
    use.setAttribute("href", "#arrow");
    use.setAttributeNS(xlinkNs, "href", "https://evil.example/sprite.svg#icon");
    dropUnsafeResourceAttrs(use);
    expect(use.getAttribute("href")).toBe("#arrow");
    expect(use.getAttributeNS(xlinkNs, "href")).toBeNull();

    const remoteUse = window.document.createElementNS(svgNs, "use");
    remoteUse.setAttribute("href", "https://evil.example/sprite.svg#icon");
    remoteUse.setAttribute("xlink:href", "#local");
    dropUnsafeResourceAttrs(remoteUse);
    expect(remoteUse.getAttribute("href")).toBeNull();
    expect(remoteUse.getAttribute("xlink:href")).toBe("#local");
  });

  it("drops a remote xlink:href on SVG image even when href is a safe data URI", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const purify = DOMPurify(new JSDOM("<!doctype html>").window);
    const svg = sanitizeExportSvg(
      purify,
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10"><image href="${png}" xlink:href="https://evil.example/x.png" width="10" height="10"/></svg>`
    );
    expect(svg).toContain(png);
    expect(svg).not.toContain("https://evil.example");
  });

  it("keeps fragment-only <use> hrefs and drops remote mixed pairs through SVG sanitization", () => {
    const purify = DOMPurify(new JSDOM("<!doctype html>").window);
    const svg = sanitizeExportSvg(
      purify,
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="arrow" d="M0 0"/></defs><use href="#arrow" xlink:href="https://evil.example/sprite.svg#icon"/></svg>`
    );
    expect(svg).toMatch(/href="#arrow"/);
    expect(svg).not.toContain("https://evil.example");
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
