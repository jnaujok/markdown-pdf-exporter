/**
 * html2canvas paints one getBoundingClientRect() background per element.
 * A wrapping inline <code> therefore covers sibling text in the union box.
 * Split those spans into per-line fragments before capture.
 */

export interface CharBox {
  top: number;
  height: number;
}

export type CharBoxFn = (index: number) => CharBox | null;
export type LineOffsetFn = (el: Element) => number[];

export function lineBreakOffsets(length: number, charBox: CharBoxFn): number[] {
  const offsets = [0];
  let lastTop: number | undefined;

  for (let i = 0; i < length; i++) {
    const box = charBox(i);
    if (!box) {
      continue;
    }
    if (lastTop === undefined) {
      lastTop = box.top;
      continue;
    }
    if (box.top - lastTop > box.height * 0.5) {
      offsets.push(i);
      lastTop = box.top;
    }
  }

  return offsets;
}

interface TextNodeIndexEntry {
  node: Text;
  start: number;
  end: number;
}

export function offsetsForWrappingInline(el: Element): number[] {
  const text = el.textContent ?? "";
  if (text.length === 0) {
    return [0];
  }

  const index = buildTextNodeIndex(el);
  const range = el.ownerDocument.createRange();
  return lineBreakOffsets(text.length, (charIndex) => {
    const located = locateChar(index, charIndex);
    if (!located) {
      return null;
    }
    range.setStart(located.node, located.offset);
    range.setEnd(located.node, located.offset + 1);
    if (typeof range.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }
    return { top: rect.top, height: rect.height };
  });
}

export function splitWrappingInlineCode(
  root: ParentNode,
  getOffsets: LineOffsetFn = offsetsForWrappingInline
): number {
  const nodes = Array.from(root.querySelectorAll("code")).filter(
    (el) => !el.closest("pre")
  );
  let changed = 0;

  for (const el of nodes) {
    if (applyLineSplits(el, getOffsets(el))) {
      changed += 1;
    }
  }

  return changed;
}

function applyLineSplits(el: Element, offsets: number[]): boolean {
  const text = el.textContent ?? "";
  const unique = [...new Set(offsets)]
    .filter((offset) => offset >= 0 && offset < text.length)
    .sort((a, b) => a - b);

  if (unique[0] !== 0) {
    unique.unshift(0);
  }
  if (unique.length <= 1) {
    return false;
  }

  const parent = el.parentNode;
  if (!parent) {
    return false;
  }

  const frag = el.ownerDocument.createDocumentFragment();
  for (let i = 0; i < unique.length; i++) {
    const start = unique[i];
    const end = i + 1 < unique.length ? unique[i + 1] : text.length;
    if (start >= end) {
      continue;
    }
    const piece = el.cloneNode(false) as Element;
    piece.textContent = text.slice(start, end);
    frag.appendChild(piece);
  }

  parent.replaceChild(frag, el);
  return true;
}

function collectTextNodes(el: Element): Text[] {
  const document = el.ownerDocument;
  if (typeof document.createTreeWalker === "function") {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode() as Text | null;
    while (current) {
      nodes.push(current);
      current = walker.nextNode() as Text | null;
    }
    return nodes;
  }

  const node = el.firstChild;
  if (node && node.nodeType === Node.TEXT_NODE) {
    return [node as Text];
  }
  return [];
}

function buildTextNodeIndex(el: Element): TextNodeIndexEntry[] {
  const index: TextNodeIndexEntry[] = [];
  let start = 0;
  for (const node of collectTextNodes(el)) {
    const length = node.data.length;
    if (length === 0) {
      continue;
    }
    index.push({ node, start, end: start + length });
    start += length;
  }
  return index;
}

function locateChar(
  index: TextNodeIndexEntry[],
  globalIndex: number
): { node: Text; offset: number } | null {
  let lo = 0;
  let hi = index.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const entry = index[mid];
    if (globalIndex < entry.start) {
      hi = mid - 1;
    } else if (globalIndex >= entry.end) {
      lo = mid + 1;
    } else {
      return { node: entry.node, offset: globalIndex - entry.start };
    }
  }
  return null;
}
