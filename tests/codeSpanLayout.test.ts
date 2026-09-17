import { readFileSync } from "node:fs";
import * as path from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  lineBreakOffsets,
  offsetsForWrappingInline,
  splitWrappingInlineCode,
} from "../src/codeSpanLayout";
import { DOCUMENT_CSS } from "../src/documentCss";

function articleWith(html: string): HTMLElement {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  return dom.window.document.body;
}

describe("DOCUMENT_CSS inline code wrapping", () => {
  it("clones inline code box decoration per line fragment", () => {
    expect(DOCUMENT_CSS).toMatch(/box-decoration-break:\s*clone/);
    expect(DOCUMENT_CSS).toMatch(/-webkit-box-decoration-break:\s*clone/);
  });

  it("keeps a background highlight on inline code", () => {
    expect(DOCUMENT_CSS).toMatch(/code\s*\{[^}]*background:\s*#f1f5f9/s);
  });

  it("does not keep fenced code on a single opaque inline box", () => {
    expect(DOCUMENT_CSS).toMatch(/pre code\s*\{[^}]*background:\s*transparent/s);
  });

  it("keeps a wrapping inline-code regression in test-sample.md", () => {
    const sample = readFileSync(
      path.join(__dirname, "..", "test-sample.md"),
      "utf8"
    );
    expect(sample).toContain("Inline code wrapping (regression)");
    expect(sample).toContain(
      "`abcdefghijklmnopqrstuvwxyz-wrap-test-token-one-two-three-four-five-six-seven-eight-nine-ten`"
    );
  });
});

describe("lineBreakOffsets", () => {
  it("returns only the start offset for a single line", () => {
    expect(
      lineBreakOffsets(6, () => ({ top: 10, height: 16 }))
    ).toEqual([0]);
  });

  it("records a new offset when the glyph jumps to the next line", () => {
    expect(
      lineBreakOffsets(8, (index) => ({
        top: index < 5 ? 10 : 28,
        height: 16,
      }))
    ).toEqual([0, 5]);
  });

  it("skips unmeasured characters", () => {
    expect(
      lineBreakOffsets(4, (index) => (index === 1 ? null : { top: 0, height: 10 }))
    ).toEqual([0]);
  });
});

describe("splitWrappingInlineCode", () => {
  it("splits a wrapping inline code span so sibling text is not covered by one box", () => {
    const root = articleWith(
      `<p>before <code>aaaaabbbbb</code> after</p>`
    );

    const changed = splitWrappingInlineCode(root, () => [0, 5]);
    const codes = [...root.querySelectorAll("code")].map((el) => el.textContent);

    expect(changed).toBe(1);
    expect(codes).toEqual(["aaaaa", "bbbbb"]);
    expect(root.textContent).toBe("before aaaaabbbbb after");
  });

  it("does not split single-line inline code", () => {
    const root = articleWith(`<p>keep <code>short</code> intact</p>`);
    expect(splitWrappingInlineCode(root, () => [0])).toBe(0);
    expect(root.querySelectorAll("code")).toHaveLength(1);
  });

  it("does not split fenced code inside pre", () => {
    const root = articleWith(`<pre><code>line one line two</code></pre>`);
    expect(splitWrappingInlineCode(root, () => [0, 9])).toBe(0);
    expect(root.querySelectorAll("code")).toHaveLength(1);
  });

  it("splits wrapping nested markup into plain text fragments", () => {
    const root = articleWith(`<p><code><span>abcdef</span></code></p>`);
    expect(splitWrappingInlineCode(root, () => [0, 3])).toBe(1);
    expect([...root.querySelectorAll("code")].map((el) => el.textContent)).toEqual([
      "abc",
      "def",
    ]);
  });

  it("preserves nested markup when the span does not wrap", () => {
    const root = articleWith(`<p>keep <code><strong>foo</strong></code> intact</p>`);
    expect(splitWrappingInlineCode(root, () => [0])).toBe(0);
    const code = root.querySelector("code");
    expect(code?.querySelector("strong")?.textContent).toBe("foo");
    expect(code?.innerHTML).toContain("<strong>foo</strong>");
  });

  it("preserves nested markup when default wrap detection finds a single line", () => {
    const root = articleWith(`<p>keep <code><strong>foo</strong></code> intact</p>`);
    expect(splitWrappingInlineCode(root)).toBe(0);
    expect(root.querySelector("code strong")?.textContent).toBe("foo");
  });

  it("ignores empty code and detached-offset input", () => {
    const root = articleWith(`<p><code></code><code>xy</code></p>`);
    expect(splitWrappingInlineCode(root, () => [8, -1])).toBe(0);
  });

  it("treats a missing leading zero as the start of the span", () => {
    const root = articleWith(`<p><code>abcdef</code></p>`);
    expect(splitWrappingInlineCode(root, () => [3])).toBe(1);
    expect([...root.querySelectorAll("code")].map((el) => el.textContent)).toEqual([
      "abc",
      "def",
    ]);
  });
});

describe("offsetsForWrappingInline", () => {
  it("returns [0] when layout boxes are empty (jsdom default)", () => {
    const root = articleWith(`<p><code>wraps-here</code></p>`);
    const code = root.querySelector("code");
    expect(code).not.toBeNull();
    expect(offsetsForWrappingInline(code as Element)).toEqual([0]);
  });

  it("records wrap offsets from Range boxes when the DOM provides them", () => {
    const root = articleWith(`<p><code>abcdefgh</code></p>`);
    const code = root.querySelector("code") as Element;
    const createRange = code.ownerDocument.createRange.bind(code.ownerDocument);
    code.ownerDocument.createRange = () => {
      const range = createRange();
      let start = 0;
      range.setStart = ((_node: Node, offset: number) => {
        start = offset;
      }) as typeof range.setStart;
      range.setEnd = (() => undefined) as typeof range.setEnd;
      range.getBoundingClientRect = () =>
        ({
          top: start < 4 ? 0 : 20,
          height: 16,
          width: 8,
          bottom: 0,
          left: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      return range;
    };
    expect(offsetsForWrappingInline(code)).toEqual([0, 4]);
  });

  it("treats zero-size Range boxes as unmeasured", () => {
    const root = articleWith(`<p><code>abcd</code></p>`);
    const code = root.querySelector("code") as Element;
    const createRange = code.ownerDocument.createRange.bind(code.ownerDocument);
    code.ownerDocument.createRange = () => {
      const range = createRange();
      range.getBoundingClientRect = () =>
        ({
          top: 0,
          height: 0,
          width: 0,
          bottom: 0,
          left: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      return range;
    };
    expect(offsetsForWrappingInline(code)).toEqual([0]);
  });

  it("returns [0] for empty code", () => {
    const root = articleWith(`<p><code></code></p>`);
    expect(offsetsForWrappingInline(root.querySelector("code") as Element)).toEqual([
      0,
    ]);
  });

  it("does not flatten nested markup when measuring a single-line span", () => {
    const root = articleWith(`<p><code><strong>foo</strong> bar</code></p>`);
    const code = root.querySelector("code") as Element;
    expect(offsetsForWrappingInline(code)).toEqual([0]);
    expect(code.querySelector("strong")?.textContent).toBe("foo");
    expect(code.innerHTML).toContain("<strong>foo</strong>");
  });

  it("measures wrap offsets across nested child text nodes without flattening first", () => {
    const root = articleWith(`<p><code><strong>abcd</strong>efgh</code></p>`);
    const code = root.querySelector("code") as Element;
    const createRange = code.ownerDocument.createRange.bind(code.ownerDocument);
    code.ownerDocument.createRange = () => {
      const range = createRange();
      let startNode: Node | null = null;
      let start = 0;
      range.setStart = ((node: Node, offset: number) => {
        startNode = node;
        start = offset;
      }) as typeof range.setStart;
      range.setEnd = (() => undefined) as typeof range.setEnd;
      range.getBoundingClientRect = () => {
        const global =
          startNode && startNode.parentElement?.tagName === "STRONG"
            ? start
            : start + 4;
        return {
          top: global < 4 ? 0 : 20,
          height: 16,
          width: 8,
          bottom: 0,
          left: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      };
      return range;
    };

    expect(offsetsForWrappingInline(code)).toEqual([0, 4]);
    expect(code.querySelector("strong")).not.toBeNull();
  });

  it("builds the text-node index once per span instead of walking from the start for every character", () => {
    const root = articleWith(
      `<p><code><b>ab</b><i>cd</i><u>ef</u><em>gh</em></code></p>`
    );
    const code = root.querySelector("code") as Element;
    const document = code.ownerDocument;
    const createTreeWalker = document.createTreeWalker.bind(document);
    let walkerCalls = 0;
    document.createTreeWalker = ((...args: Parameters<typeof createTreeWalker>) => {
      walkerCalls += 1;
      return createTreeWalker(...args);
    }) as typeof document.createTreeWalker;

    expect(offsetsForWrappingInline(code)).toEqual([0]);
    expect(walkerCalls).toBe(1);
    expect(code.querySelectorAll("b, i, u, em")).toHaveLength(4);
  });

  it("resolves wrap offsets across many nested text nodes from a reused index", () => {
    const root = articleWith(
      `<p><code>${["a", "b", "c", "d", "e", "f", "g", "h"]
        .map((ch) => `<span>${ch}</span>`)
        .join("")}</code></p>`
    );
    const code = root.querySelector("code") as Element;
    const createRange = code.ownerDocument.createRange.bind(code.ownerDocument);
    code.ownerDocument.createRange = () => {
      const range = createRange();
      let startNode: Node | null = null;
      let start = 0;
      range.setStart = ((node: Node, offset: number) => {
        startNode = node;
        start = offset;
      }) as typeof range.setStart;
      range.setEnd = (() => undefined) as typeof range.setEnd;
      range.getBoundingClientRect = () => {
        const spans = [...code.querySelectorAll("span")];
        const spanIndex = spans.findIndex((span) => span.firstChild === startNode);
        const global = spanIndex >= 0 ? spanIndex + start : start;
        return {
          top: global < 4 ? 0 : 20,
          height: 16,
          width: 8,
          bottom: 0,
          left: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      };
      return range;
    };

    expect(offsetsForWrappingInline(code)).toEqual([0, 4]);
    expect(code.querySelectorAll("span")).toHaveLength(8);
  });

  it("falls back to the first text child when TreeWalker is unavailable", () => {
    const root = articleWith(`<p><code>abcdefgh</code></p>`);
    const code = root.querySelector("code") as Element;
    const document = code.ownerDocument;
    (document as { createTreeWalker?: unknown }).createTreeWalker = undefined;
    const createRange = document.createRange.bind(document);
    document.createRange = () => {
      const range = createRange();
      let start = 0;
      range.setStart = ((_node: Node, offset: number) => {
        start = offset;
      }) as typeof range.setStart;
      range.setEnd = (() => undefined) as typeof range.setEnd;
      range.getBoundingClientRect = () =>
        ({
          top: start < 4 ? 0 : 20,
          height: 16,
          width: 8,
          bottom: 0,
          left: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      return range;
    };

    expect(offsetsForWrappingInline(code)).toEqual([0, 4]);
  });
});
