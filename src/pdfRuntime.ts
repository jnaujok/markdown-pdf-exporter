import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import katex from "katex";
import katexCss from "katex/dist/katex.min.css";
import { marked } from "marked";
import mermaid from "mermaid";

export { splitWrappingInlineCode } from "./codeSpanLayout";
export { applyNonceToStyleElements } from "./csp";
export {
  fitDiagramToPage,
  PRINTABLE_DIAGRAM_HEIGHT,
  rasterTimeoutMs,
  svgNaturalSize,
} from "./diagramLayout";
export { buildMermaidInitConfig } from "./mermaidConfig";
export { detectMermaidDiagramKind } from "./mermaidKind";
export { sanitizeExportHtml, sanitizeExportSvg } from "./sanitizeHtml";

export default mermaid;
export { DOMPurify, html2canvas, jsPDF, katex, katexCss, marked };
