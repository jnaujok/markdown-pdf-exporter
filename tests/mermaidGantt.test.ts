import { readFileSync } from "node:fs";
import * as path from "node:path";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import mermaid from "mermaid";
import { describe, expect, it } from "vitest";
import { applyNonceToStyleElements } from "../src/csp";
import {
  BASE_RASTER_TIMEOUT_MS,
  fitDiagramToPage,
  MAX_RASTER_TIMEOUT_MS,
  PRINTABLE_DIAGRAM_HEIGHT,
  PRINTABLE_DIAGRAM_WIDTH,
  rasterTimeoutMs,
  svgNaturalSize,
} from "../src/diagramLayout";
import { extractMermaidFences } from "../src/mermaidFences";
import {
  buildMermaidInitConfig,
  GANTT_EXPORT_CONFIG,
} from "../src/mermaidConfig";
import { detectMermaidDiagramKind } from "../src/mermaidKind";
import { sanitizeExportSvg } from "../src/sanitizeHtml";

export const PLATFORM_GANTT = `gantt
    title Q3 Platform Delivery
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d
    tickInterval 1week
    excludes    weekends
    weekday     monday

    section Discovery
    Stakeholder interviews       :done,    disc1, 2026-07-01, 10d
    Architecture spike           :done,    disc2, after disc1, 8d

    section Build
    Auth service                 :active,  build1, 2026-07-20, 21d
    Order API                    :         build2, after disc2, 18d
    Payment adapter              :crit,    build3, after build1, 14d

    section QA
    Integration tests            :         qa1, after build2, 10d
    Load testing                 :         qa2, after build3, 7d
    Security review              :crit,    qa3, after qa1, 5d

    section Release
    Staging rollout              :         rel1, after qa3, 4d
    Production cutover           :milestone, rel2, after rel1, 0d
`;

const GANTT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 636 280" width="636" height="280">
  <style>
    .section0 { fill: #f4f4f4; }
    .task0 { fill: #4ea0d4; stroke: #2b6a94; }
    .taskText0 { fill: #111827; }
    .grid .tick { stroke: #e5e7eb; }
    .today { stroke: #ef4444; fill: none; }
  </style>
  <g>
    <rect class="section section0" x="0" y="48" width="596" height="28"></rect>
    <rect class="task task0" id="t1" rx="3" ry="3" x="120" y="50" width="180" height="22"></rect>
    <text class="taskText taskText0" x="210" y="66" font-size="12">Auth service</text>
    <g class="grid">
      <g class="tick" transform="translate(120,0)">
        <line y2="200"></line>
        <text y="-8">Jul 01</text>
      </g>
    </g>
    <line class="today" x1="400" x2="400" y1="35" y2="240"></line>
    <image href="https://evil.example/track.png" width="1" height="1"></image>
  </g>
</svg>`;

describe("mermaid gantt export config", () => {
  it("keeps strict security and SVG labels", () => {
    const config = buildMermaidInitConfig("default");
    expect(config.securityLevel).toBe("strict");
    expect(config.htmlLabels).toBe(false);
    expect(config.startOnLoad).toBe(false);
    expect(config.suppressErrorRendering).toBe(true);
    expect(config.theme).toBe("default");
    expect(buildMermaidInitConfig("forest").theme).toBe("forest");
  });

  it("pins gantt to the printable column instead of parent offsetWidth", () => {
    const config = buildMermaidInitConfig("neutral");
    expect(config.theme).toBe("neutral");
    expect(config.gantt).toEqual(GANTT_EXPORT_CONFIG);
    expect(GANTT_EXPORT_CONFIG.useMaxWidth).toBe(false);
    expect(GANTT_EXPORT_CONFIG.useWidth).toBe(PRINTABLE_DIAGRAM_WIDTH);
    expect(GANTT_EXPORT_CONFIG.leftPadding).toBeGreaterThanOrEqual(75);
  });
});

describe("detectMermaidDiagramKind", () => {
  it("reads gantt after comments and front-matter", () => {
    expect(detectMermaidDiagramKind(PLATFORM_GANTT)).toBe("gantt");
    expect(
      detectMermaidDiagramKind("---\ntitle: Plan\n---\n%% comment\ngantt\n  title X")
    ).toBe("gantt");
    expect(detectMermaidDiagramKind("flowchart TD\n  A-->B")).toBe("flowchart");
    expect(detectMermaidDiagramKind("")).toBe("unknown");
  });
});

describe("diagram layout for wide gantt", () => {
  it("scales a wide chart down to the printable box", () => {
    const fit = fitDiagramToPage(1800, 400, 636, 860);
    expect(fit.scale).toBeCloseTo(636 / 1800);
    expect(fit.width).toBe(636);
    expect(fit.height).toBe(Math.floor(400 * (636 / 1800)));
  });

  it("scales a tall chart down by printable height", () => {
    const fit = fitDiagramToPage(400, 2000);
    expect(fit.scale).toBeCloseTo(PRINTABLE_DIAGRAM_HEIGHT / 2000);
    expect(fit.height).toBe(PRINTABLE_DIAGRAM_HEIGHT);
  });

  it("does not upscale a small chart", () => {
    const fit = fitDiagramToPage(200, 80);
    expect(fit).toEqual({ width: 200, height: 80, scale: 1 });
  });

  it("returns an empty fit for collapsed mermaid output", () => {
    expect(fitDiagramToPage(0, 280)).toEqual({ width: 0, height: 0, scale: 0 });
    expect(fitDiagramToPage(636, 0)).toEqual({ width: 0, height: 0, scale: 0 });
  });

  it("prefers a positive viewBox over a zero client box", () => {
    expect(svgNaturalSize(636, 280, 0, 0)).toEqual({ width: 636, height: 280 });
    expect(svgNaturalSize(0, 0, 400, 200)).toEqual({ width: 400, height: 200 });
    expect(svgNaturalSize(undefined, undefined, 0, 0)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("grows the raster timeout with megapixels and caps it", () => {
    expect(rasterTimeoutMs(100, 100, 1)).toBe(BASE_RASTER_TIMEOUT_MS);
    expect(rasterTimeoutMs(PRINTABLE_DIAGRAM_WIDTH, 400, 2)).toBeGreaterThan(
      BASE_RASTER_TIMEOUT_MS
    );
    expect(rasterTimeoutMs(4000, 4000, 3)).toBe(MAX_RASTER_TIMEOUT_MS);
  });
});

describe("gantt sample and fence extraction", () => {
  const sample = readFileSync(
    path.join(__dirname, "..", "test-sample.md"),
    "utf8"
  );

  it("ships a realistic gantt fence in test-sample.md", () => {
    expect(sample).toContain("Q3 Platform Delivery");
    expect(sample).toMatch(/```mermaid[\s\S]*\bgantt\b/);
    expect(sample).toContain("Production cutover");
    expect(sample).toContain(":milestone");
  });

  it("extracts the gantt fence as a mermaid diagram", () => {
    const result = extractMermaidFences(sample, "test-sample.md");
    const gantt = result.diagrams.find((code) =>
      detectMermaidDiagramKind(code) === "gantt"
    );
    expect(gantt).toBeDefined();
    expect(gantt).toContain("dateFormat");
    expect(gantt).toContain("Payment adapter");
    expect(result.markdown).toContain("data-mermaid-index");
  });
});

describe("gantt SVG sanitizer + CSP nonce", () => {
  const purify = DOMPurify(new JSDOM("<!doctype html>").window);

  it("keeps gantt geometry, class colors, and style; drops remote images", () => {
    const svg = sanitizeExportSvg(purify, GANTT_SVG);
    expect(svg).toMatch(/<svg/i);
    expect(svg).toContain("viewBox");
    expect(svg).toContain("section0");
    expect(svg).toContain("task0");
    expect(svg).toContain("Auth service");
    expect(svg).toMatch(/<style/i);
    expect(svg).toMatch(/<text/i);
    expect(svg).toMatch(/<rect/i);
    expect(svg).toMatch(/<line/i);
    expect(svg).not.toContain("https://evil.example");
    expect(svg).not.toMatch(/<script/i);
  });

  it("stamps a CSP nonce on gantt style nodes before insertion", () => {
    const { window } = new JSDOM("<!doctype html>");
    const root = window.document.createElement("div");
    root.innerHTML = sanitizeExportSvg(purify, GANTT_SVG);
    expect(applyNonceToStyleElements(root, "ganttNonce1")).toBeGreaterThan(0);
    for (const style of [...root.querySelectorAll("style")]) {
      expect(style.getAttribute("nonce")).toBe("ganttNonce1");
    }
  });
});

describe("mermaid parser accepts the gantt sample", () => {
  it("parses as diagram type gantt under the export config", async () => {
    mermaid.initialize(buildMermaidInitConfig("default"));
    const parsed = await mermaid.parse(PLATFORM_GANTT);
    expect(parsed).toBeTruthy();
    expect(parsed).not.toBe(false);
    if (parsed) {
      expect(parsed.diagramType).toBe("gantt");
    }
  });
});
