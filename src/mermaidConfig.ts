import { PRINTABLE_DIAGRAM_WIDTH } from "./diagramLayout";

export const MERMAID_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * Gantt uniquely sizes from the temp SVG parent's offsetWidth (0 in a hidden
 * mermaid.render() wrapper, or the full webview body if not). Pin useWidth to
 * the printable column and disable useMaxWidth so rasterization gets real px.
 */
export const GANTT_EXPORT_CONFIG = {
  useMaxWidth: false,
  useWidth: PRINTABLE_DIAGRAM_WIDTH,
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
    gantt: { ...GANTT_EXPORT_CONFIG },
  };
}
