export const DOCUMENT_CSS = `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      color: #1f2937;
      background: #e5e7eb;
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .status-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      margin: 0 auto 16px;
      width: 780px;
      padding: 12px 18px;
      color: #ffffff;
      background: #1e293b;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    article {
      width: 780px;
      margin: 0 auto;
      padding: 50px 56px;
      overflow: hidden;
      color: #111827;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      font-size: 14.5px;
      line-height: 1.65;
    }
    h1, h2, h3, h4, h5, h6 {
      margin: 1.3em 0 0.5em;
      line-height: 1.25;
      color: #0f172a;
      font-weight: 700;
    }
    h1 {
      margin-top: 0;
      font-size: 28px;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
    }
    h2 {
      font-size: 22px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    h3 { font-size: 18px; }
    h4 { font-size: 16px; }
    p { margin: 0.7em 0; }
    a { color: #0284c7; text-decoration: underline; }
    blockquote {
      margin: 1.2em 0;
      padding: 0.6em 1.2em;
      color: #334155;
      border-left: 4px solid #0284c7;
      background: #f0f9ff;
      border-radius: 0 6px 6px 0;
    }
    pre {
      margin: 1.1em 0;
      padding: 14px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 6px;
      font: 12.5px/1.55 Consolas, "Courier New", monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #f1f5f9;
      padding: 0.1em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
      color: #be185d;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    pre code {
      background: transparent;
      padding: 0;
      color: #0f172a;
      box-decoration-break: slice;
      -webkit-box-decoration-break: slice;
      overflow-wrap: normal;
      word-break: normal;
    }
    table {
      width: 100%;
      margin: 1.2em 0;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    th, td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1.2em auto;
      border-radius: 4px;
    }
    .mermaid-pdf-diagram {
      margin: 20px 0;
      padding: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .mermaid-pdf-diagram img {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      height: auto;
      background: #ffffff;
    }
    .mermaid-diagram-warning {
      color: #ef4444;
      font-weight: 600;
      text-align: left;
      margin: 0.6em 0 0;
    }
    hr {
      margin: 1.8em 0;
      border: 0;
      border-top: 1px solid #e2e8f0;
    }
    ul, ol { padding-left: 26px; margin: 0.7em 0; }
    li { margin: 0.3em 0; }
    article > * { break-inside: avoid; }

    /* KaTeX Math Styling */
    .math-display {
      display: block;
      text-align: center;
      margin: 1.4em auto;
      font-size: 1.15em;
      line-height: 1.4;
      overflow-x: visible;
    }
    .math-inline {
      display: inline-block;
      vertical-align: middle;
      font-size: 1.05em;
      margin: 0 2px;
    }
    .katex {
      font-family: KaTeX_Main, "Times New Roman", Times, "Cambria Math", "STIX Two Math", serif !important;
      font-size: 1.1em;
      line-height: 1.2;
    }
    .katex-display {
      margin: 0.5em 0 !important;
      text-align: center;
    }
    .katex-display > .katex {
      display: inline-block;
      white-space: normal;
      text-align: center;
    }
`;
