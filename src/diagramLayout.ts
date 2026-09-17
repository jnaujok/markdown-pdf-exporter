/**
 * Printable diagram box inside the export article:
 * article 780px − horizontal padding 56px × 2 − mermaid frame padding 16px × 2.
 */
export const PRINTABLE_DIAGRAM_WIDTH = 636;
export const PRINTABLE_DIAGRAM_HEIGHT = 860;

export const BASE_RASTER_TIMEOUT_MS = 10_000;
export const MAX_RASTER_TIMEOUT_MS = 45_000;
export const MS_PER_MEGAPIXEL = 4_000;

export interface DiagramFit {
  width: number;
  height: number;
  scale: number;
}

export interface DiagramSize {
  width: number;
  height: number;
}

export function svgNaturalSize(
  viewBoxWidth: number | undefined,
  viewBoxHeight: number | undefined,
  boundingWidth: number,
  boundingHeight: number,
  fallbackWidth = 800,
  fallbackHeight = 600
): DiagramSize {
  const width =
    positive(viewBoxWidth) || positive(boundingWidth) || fallbackWidth;
  const height =
    positive(viewBoxHeight) || positive(boundingHeight) || fallbackHeight;
  return { width, height };
}

export function fitDiagramToPage(
  naturalWidth: number,
  naturalHeight: number,
  availableWidth: number = PRINTABLE_DIAGRAM_WIDTH,
  printableHeight: number = PRINTABLE_DIAGRAM_HEIGHT
): DiagramFit {
  const nw = Math.max(0, naturalWidth);
  const nh = Math.max(0, naturalHeight);
  if (nw < 1 || nh < 1) {
    return { width: 0, height: 0, scale: 0 };
  }

  const aw = Math.max(1, availableWidth);
  const ph = Math.max(1, printableHeight);
  const scale = Math.min(1, aw / nw, ph / nh);

  return {
    width: Math.max(1, Math.floor(nw * scale)),
    height: Math.max(1, Math.floor(nh * scale)),
    scale,
  };
}

/**
 * Wide Gantt (and other) rasters at 2×/3× DPI can exceed a flat 10s cap.
 * Scale the budget with output pixels; never weaken CSP to "fix" timeouts.
 */
export function rasterTimeoutMs(
  naturalWidth: number,
  naturalHeight: number,
  dpiScale: number
): number {
  const w = Math.max(0, naturalWidth);
  const h = Math.max(0, naturalHeight);
  const scale = Math.max(1, dpiScale);
  const megapixels = (w * h * scale * scale) / 1_000_000;
  if (megapixels <= 1) {
    return BASE_RASTER_TIMEOUT_MS;
  }
  const extra = Math.ceil((megapixels - 1) * MS_PER_MEGAPIXEL);
  return Math.min(MAX_RASTER_TIMEOUT_MS, BASE_RASTER_TIMEOUT_MS + extra);
}

function positive(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}
