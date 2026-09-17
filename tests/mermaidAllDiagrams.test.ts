import { readFileSync } from "node:fs";
import * as path from "node:path";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import mermaid from "mermaid";
import { describe, expect, it } from "vitest";
import { applyNonceToStyleElements } from "../src/csp";
import {
  MERMAID_DIAGRAM_TYPES,
  MERMAID_PACKAGE_VERSION,
  mermaidCatalogMarkdown,
  mermaidFence,
  mermaidTypeById,
} from "../src/mermaidCatalog";
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
  mermaidRenderWarningHtml,
} from "../src/mermaidSupport";
import { sanitizeExportHtml, sanitizeExportSvg } from "../src/sanitizeHtml";

const SAMPLE_DOC = mermaidCatalogMarkdown();

describe("mermaid 11.16.1 catalog inventory", () => {
  it("tracks the installed mermaid package version", () => {
    expect(MERMAID_PACKAGE_VERSION).toBe("11.16.1");
  });

  it("does not invent detector ids", () => {
    const ids = MERMAID_DIAGRAM_TYPES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "flowchart-v2",
        "flowchart-elk",
        "sequence",
        "gantt",
        "mindmap",
        "architecture",
        "swimlane",
        "radar",
        "treeView",
        "venn",
        "wardley",
        "cynefin",
        "railroad",
        "railroadEbnf",
        "railroadAbnf",
        "railroadPeg",
        "eventmodeling",
        "ishikawa",
        "treemap",
      ])
    );
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
