import { PRINTABLE_DIAGRAM_WIDTH } from "./diagramLayout";

export const MERMAID_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * Shared printable box for every mermaid diagram type. useMaxWidth: true
 * emits width=100% which collapses in mermaid.render()'s temp wrapper.
 * Pin useWidth so SVG→PNG gets real px without weakening CSP.
 */
export const PRINTABLE_DIAGRAM_BOX = {
  useMaxWidth: false,
  useWidth: PRINTABLE_DIAGRAM_WIDTH,
} as const;

/**
 * mermaid@11.16.1 config keys that accept BaseDiagramConfig sizing.
 * Includes experimental types. Wardley 11.16.1 reads `wardley-beta`
 * (see wardleyDiagram getConfig); `wardley` is set as well so a renderer
 * keyed on parseType cannot miss printable sizing.
 */
export const MERMAID_SIZING_CONFIG_KEYS = [
  "flowchart",
  "swimlane",
  "sequence",
  "gantt",
  "journey",
  "timeline",
  "class",
  "state",
  "er",
  "pie",
  "quadrantChart",
  "xyChart",
  "requirement",
  "architecture",
  "mindmap",
  "ishikawa",
  "kanban",
  "gitGraph",
  "c4",
  "sankey",
  "packet",
  "block",
  "eventmodeling",
  "treeView",
  "radar",
  "venn",
  "wardley",
  "wardley-beta",
  "cynefin",
  "railroad",
  "treemap",
] as const;

/**
 * Gantt uniquely sizes from the temp SVG parent's offsetWidth (0 in a hidden
 * mermaid.render() wrapper, or the full webview body if not). Pin useWidth to
 * the printable column and disable useMaxWidth so rasterization gets real px.
 */
export const GANTT_EXPORT_CONFIG = {
  ...PRINTABLE_DIAGRAM_BOX,
  leftPadding: 120,
  rightPadding: 80,
  topPadding: 50,
  barHeight: 22,
  barGap: 6,
  fontSize: 12,
  sectionFontSize: 12,
  numberSectionStyles: 4,
  axisFormat: "%Y-%m-%d",
  topAxis: false,
} as const;

function printableTypeConfig(): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const key of MERMAID_SIZING_CONFIG_KEYS) {
    config[key] = { ...PRINTABLE_DIAGRAM_BOX };
  }
  return config;
}

export function buildMermaidInitConfig(theme: string): Record<string, unknown> {
  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme,
    htmlLabels: false,
    suppressErrorRendering: true,
    fontFamily: MERMAID_FONT_FAMILY,
    themeVariables: {
      background: "#ffffff",
      primaryTextColor: "#111827",
      secondaryTextColor: "#111827",
      tertiaryTextColor: "#111827",
      lineColor: "#374151",
      textColor: "#111827",
    },
    ...printableTypeConfig(),
    flowchart: {
      ...PRINTABLE_DIAGRAM_BOX,
      htmlLabels: false,
      defaultRenderer: "dagre-wrapper",
    },
    class: {
      ...PRINTABLE_DIAGRAM_BOX,
      htmlLabels: false,
      defaultRenderer: "dagre-wrapper",
    },
    sequence: {
      ...PRINTABLE_DIAGRAM_BOX,
      actorFontFamily: MERMAID_FONT_FAMILY,
      noteFontFamily: MERMAID_FONT_FAMILY,
      messageFontFamily: MERMAID_FONT_FAMILY,
    },
    journey: {
      ...PRINTABLE_DIAGRAM_BOX,
      textPlacement: "tspan",
      taskFontFamily: MERMAID_FONT_FAMILY,
    },
    timeline: {
      ...PRINTABLE_DIAGRAM_BOX,
      textPlacement: "tspan",
      taskFontFamily: MERMAID_FONT_FAMILY,
    },
    gantt: { ...GANTT_EXPORT_CONFIG },
    architecture: {
      ...PRINTABLE_DIAGRAM_BOX,
      randomize: false,
      seed: 1,
    },
    treeView: {
      ...PRINTABLE_DIAGRAM_BOX,
      showIcons: false,
    },
    kanban: {
      ...PRINTABLE_DIAGRAM_BOX,
      ticketBaseUrl: "",
    },
  };
}
