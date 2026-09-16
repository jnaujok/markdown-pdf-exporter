export interface MarkdownPdfPayload {
  markdown: string;
  diagrams: string[];
  sourceName: string;
  options: ExportOptions;
}

export interface ExportOptions {
  previewTheme: "default" | "neutral" | "dark" | "forest" | "base";
  pageSize: "a4" | "letter" | "legal";
  orientation: "portrait" | "landscape";
  margin: number;
  highDpi: number;
}

export interface PdfMessage {
  type: "progress" | "pdfReady" | "error";
  base64?: string;
  message?: string;
  pageCount?: number;
}
