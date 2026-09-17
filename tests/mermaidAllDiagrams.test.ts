import { readFileSync } from "node:fs";
import * as path from "node:path";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import mermaid from "mermaid";
import { describe, expect, it } from "vitest";
import { applyNonceToStyleElements } from "../src/csp";
import {
  MERMAID_DIAGRAM_TYPES,
  MERMAID_INSTALLED_DETECTOR_IDS,
  MERMAID_LEGACY_DETECTOR_IDS,
  MERMAID_PACKAGE_VERSION,
  mermaidCatalogMarkdown,
  mermaidFence,
  mermaidTypeById,
} from "../src/mermaidCatalog";
import {
  resolveExportDiagramSize,
  svgNaturalSize,
} from "../src/diagramLayout";
import {
  buildMermaidInitConfig,
  GANTT_EXPORT_CONFIG,
  MERMAID_SIZING_CONFIG_KEYS,
  PRINTABLE_DIAGRAM_BOX,
} from "../src/mermaidConfig";
import { extractMermaidFences } from "../src/mermaidFences";
import { detectMermaidDiagramKind } from "../src/mermaidKind";
import {
  FLOWCHART_ELK_UNSUPPORTED_REASON,
  getMermaidExportSupport,
  mermaidRasterFailureMessage,
  mermaidRenderWarningHtml,
} from "../src/mermaidSupport";
import { sanitizeExportHtml, sanitizeExportSvg } from "../src/sanitizeHtml";

const SAMPLE_DOC = mermaidCatalogMarkdown();

describe("mermaid 11.16.1 catalog inventory", () => {
  it("tracks the installed mermaid package version", () => {
    expect(MERMAID_PACKAGE_VERSION).toBe("11.16.1");
  });

  it("covers every installed detector id (legacy v1 remapped to v2)", () => {
    const catalogIds = MERMAID_DIAGRAM_TYPES.map((entry) => entry.id);
    expect(new Set(catalogIds).size).toBe(catalogIds.length);
    const covered = [...catalogIds, ...MERMAID_LEGACY_DETECTOR_IDS].sort();
    expect(covered).toEqual([...MERMAID_INSTALLED_DETECTOR_IDS].sort());
    expect(MERMAID_LEGACY_DETECTOR_IDS).toEqual(["flowchart", "class", "state"]);
  });

  it("marks only flowchart-elk as unsupported", () => {
    const unsupported = MERMAID_DIAGRAM_TYPES.filter((entry) => !entry.supported);
    expect(unsupported).toHaveLength(1);
    expect(unsupported[0]?.id).toBe("flowchart-elk");
    expect(unsupported[0]?.reason).toMatch(/ELK/);
  });
});

describe("shared mermaid export config", () => {
  it("keeps strict security and SVG labels", () => {
    const config = buildMermaidInitConfig("forest");
    expect(config.securityLevel).toBe("strict");
    expect(config.htmlLabels).toBe(false);
    expect(config.startOnLoad).toBe(false);
    expect(config.suppressErrorRendering).toBe(true);
    expect(config.theme).toBe("forest");
  });

  it("pins every diagram type to the printable box", () => {
    const config = buildMermaidInitConfig("default");
    expect(MERMAID_SIZING_CONFIG_KEYS.length).toBeGreaterThan(20);
    for (const key of MERMAID_SIZING_CONFIG_KEYS) {
      const block = config[key] as { useMaxWidth: boolean; useWidth: number };
      expect(block.useMaxWidth, key).toBe(false);
      expect(block.useWidth, key).toBe(PRINTABLE_DIAGRAM_BOX.useWidth);
    }
    expect(config.gantt).toEqual(GANTT_EXPORT_CONFIG);
  });

  it("avoids foreignObject labels and outbound icon/ticket fetches", () => {
    const config = buildMermaidInitConfig("neutral");
    expect(config.journey).toEqual(
      expect.objectContaining({ textPlacement: "tspan" })
    );
    expect(config.timeline).toEqual(
      expect.objectContaining({ textPlacement: "tspan" })
    );
    expect(config.architecture).toEqual(
      expect.objectContaining({ randomize: false, seed: 1 })
    );
    expect(config.treeView).toEqual(expect.objectContaining({ showIcons: false }));
    expect(config.kanban).toEqual(expect.objectContaining({ ticketBaseUrl: "" }));
    expect(config.flowchart).toEqual(
      expect.objectContaining({
        htmlLabels: false,
        defaultRenderer: "dagre-wrapper",
      })
    );
    expect(config.class).toEqual(
      expect.objectContaining({
        htmlLabels: false,
        defaultRenderer: "dagre-wrapper",
      })
    );
  });
});

describe.each(MERMAID_DIAGRAM_TYPES)(
  "mermaid type $id ($title)",
  (entry) => {
    it("detects the sample keyword and extracts a fence", () => {
      const kind = detectMermaidDiagramKind(entry.sample);
      expect(entry.keywords).toContain(kind);
      const extracted = extractMermaidFences(
        mermaidFence(entry.sample),
        `${entry.id}.md`
      );
      expect(extracted.diagrams).toHaveLength(1);
      expect(extracted.diagrams[0]).toContain(entry.sample.trim().split("\n")[0]);
    });

    it("declares export support without silent failure", () => {
      const support = getMermaidExportSupport(entry.sample);
      expect(support.kind).toBe(detectMermaidDiagramKind(entry.sample));
      expect(support.supported).toBe(entry.supported);
      if (!entry.supported) {
        expect(support.reason).toBe(FLOWCHART_ELK_UNSUPPORTED_REASON);
        expect(mermaidRenderWarningHtml(support.kind, entry.sample, support.reason ?? "")).toContain(
          "Diagram Render Warning"
        );
      }
    });

    it("parses under the shared export config", async () => {
      mermaid.initialize(buildMermaidInitConfig("default"));
      const parsed = await mermaid.parse(entry.sample);
      expect(parsed, `parse failed for ${entry.id}`).toBeTruthy();
      expect(parsed).not.toBe(false);
      if (parsed) {
        expect(parsed.diagramType).toBe(entry.parseType);
      }
    });
  }
);

describe("graph alias and init directives", () => {
  it("parses graph as flowchart-v2", async () => {
    mermaid.initialize(buildMermaidInitConfig("default"));
    const parsed = await mermaid.parse("graph LR\n  A-->B");
    expect(parsed).toBeTruthy();
    if (parsed) {
      expect(parsed.diagramType).toBe("flowchart-v2");
    }
    expect(detectMermaidDiagramKind("graph LR\n  A-->B")).toBe("graph");
  });

  it("skips YAML, comments, and %%{init}%% before the keyword", () => {
    expect(
      detectMermaidDiagramKind(
        "---\ntitle: X\n---\n%% comment\n%%{init: {'theme':'dark'}}%%\nswimlane-beta LR\n  subgraph A\n    n1[N]\n  end"
      )
    ).toBe("swimlane-beta");
  });
});

describe("per-type render warnings", () => {
  it("includes the diagram keyword and escaped source", () => {
    const html = mermaidRenderWarningHtml(
      "radar-beta",
      'radar-beta\n  axis a["<script>"]',
      'Parse error <b>'
    );
    expect(html).toContain("Diagram Render Warning (radar-beta)");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Parse error &lt;b&gt;");
    expect(html).not.toContain("<script>");
  });

  it("sanitizes the warning HTML", () => {
    const purify = DOMPurify(new JSDOM("<!doctype html>").window);
    const html = sanitizeExportHtml(
      purify,
      mermaidRenderWarningHtml("gantt", "gantt\n  title X", "boom")
    );
    expect(html).toContain("gantt");
    expect(html).toContain("Diagram Render Warning");
    expect(html).toMatch(/mermaid-diagram-warning/);
  });

  it("warns on missing SVG, collapsed size, and raster failure", () => {
    expect(mermaidRasterFailureMessage(true, false, false)).toBe(
      "Mermaid produced no SVG"
    );
    expect(mermaidRasterFailureMessage(false, true, false)).toBe(
      "Diagram collapsed to a non-positive size and was not rasterized"
    );
    expect(mermaidRasterFailureMessage(false, false, true)).toBe(
      "SVG rasterization failed"
    );
    expect(mermaidRasterFailureMessage(false, false, false)).toBeUndefined();
    expect(resolveExportDiagramSize(0, 280, 0, 0)).toBeNull();
    expect(svgNaturalSize(undefined, undefined, 0, 0)).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe("mermaid.render for supported catalog samples", () => {
  function stubSvgGeometry(): void {
    const box = {
      x: 0,
      y: 0,
      width: 240,
      height: 120,
      top: 0,
      left: 0,
      bottom: 120,
      right: 240,
      toJSON() {
        return this;
      },
    };
    Object.defineProperty(SVGElement.prototype, "getBBox", {
      configurable: true,
      value: () => box,
    });
    Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
      configurable: true,
      value: () => 48,
    });
    HTMLCanvasElement.prototype.getContext = function getContext(
      type: string
    ): CanvasRenderingContext2D | null {
      if (type !== "2d") {
        return null;
      }
      return {
        canvas: this,
        fillRect() {},
        clearRect() {},
        getImageData() {
          return { data: new Uint8ClampedArray(4) } as ImageData;
        },
        putImageData() {},
        createImageData() {
          return { data: new Uint8ClampedArray(4) } as ImageData;
        },
        setTransform() {},
        drawImage() {},
        save() {},
        restore() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        stroke() {},
        fill() {},
        translate() {},
        scale() {},
        rotate() {},
        arc() {},
        rect() {},
        clip() {},
        fillText() {},
        measureText() {
          return { width: 40 } as TextMetrics;
        },
        transform() {},
      } as CanvasRenderingContext2D;
    };
  }

  it("produces SVG markup for each supported type", async () => {
    stubSvgGeometry();
    mermaid.initialize(buildMermaidInitConfig("default"));
    const supported = MERMAID_DIAGRAM_TYPES.filter((entry) => entry.supported);
    const failures: string[] = [];

    for (const entry of supported) {
      try {
        const rendered = await mermaid.render(
          `export-${entry.id}-${Date.now()}`,
          entry.sample
        );
        if (!/<svg[\s>]/i.test(rendered.svg)) {
          failures.push(`${entry.id}: no <svg> in render output`);
        }
      } catch (error) {
        // mindmap uses cytoscape-cose-bilkent, which still blows up in jsdom
        // even with a stub 2d context. The VS Code webview has a real canvas.
        if (entry.id === "mindmap") {
          continue;
        }
        failures.push(
          `${entry.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  }, 60_000);
});

describe("mixed-type SVG sanitizer", () => {
  const MIXED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <defs>
    <linearGradient id="g1"><stop offset="0" stop-color="#fff"/></linearGradient>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
      <polygon points="0 0, 8 4, 0 8"></polygon>
    </marker>
  </defs>
  <style>.label { fill: #111827; }</style>
  <circle cx="20" cy="20" r="8"></circle>
  <ellipse cx="60" cy="20" rx="12" ry="8"></ellipse>
  <polyline points="10 80 40 60 70 80" fill="none" stroke="#111"></polyline>
  <text class="label" x="10" y="110"><tspan>Radar</tspan></text>
  <image href="https://evil.example/x.png" width="1" height="1"></image>
</svg>`;

  it("keeps geometry tags and drops remote images", () => {
    const purify = DOMPurify(new JSDOM("<!doctype html>").window);
    const svg = sanitizeExportSvg(purify, MIXED_SVG);
    expect(svg).toMatch(/<circle/i);
    expect(svg).toMatch(/<ellipse/i);
    expect(svg).toMatch(/<polyline/i);
    expect(svg).toMatch(/<tspan/i);
    expect(svg).toMatch(/<marker/i);
    expect(svg).not.toContain("https://evil.example");
  });

  it("stamps a CSP nonce on mixed-type style nodes", () => {
    const purify = DOMPurify(new JSDOM("<!doctype html>").window);
    const { window } = new JSDOM("<!doctype html>");
    const root = window.document.createElement("div");
    root.innerHTML = sanitizeExportSvg(purify, MIXED_SVG);
    expect(applyNonceToStyleElements(root, "mixNonce1")).toBeGreaterThan(0);
  });
});

describe("samples markdown stays in sync with the catalog", () => {
  const onDisk = readFileSync(
    path.join(__dirname, "..", "samples", "mermaid-all-diagrams.md"),
    "utf8"
  );

  it("matches mermaidCatalogMarkdown()", () => {
    expect(onDisk).toBe(SAMPLE_DOC);
  });

  it("extracts one fence per catalog type", () => {
    const result = extractMermaidFences(onDisk, "mermaid-all-diagrams.md");
    expect(result.diagrams).toHaveLength(MERMAID_DIAGRAM_TYPES.length);
  });

  it("looks up types by id", () => {
    expect(mermaidTypeById("radar")?.keywords).toContain("radar-beta");
    expect(mermaidTypeById("missing")).toBeUndefined();
  });
});
