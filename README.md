# Markdown to PDF (with Mermaid & Math)

<div align="center">

### *The Ultimate Local-First Markdown to PDF Exporter with Flawless Mermaid Diagrams, KaTeX LaTeX Equations, and Smart Pagination for VS Code.*

[![VS Code Extension](https://img.shields.io/badge/VS_Code-v1.85.0+-007ACC?logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com)
[![Mermaid Version](https://img.shields.io/badge/Mermaid-v11.16.1-ff3670?logo=mermaid&logoColor=white)](https://mermaid.js.org)
[![KaTeX Math](https://img.shields.io/badge/KaTeX_LaTeX-Enabled-3775a9?logo=latex&logoColor=white)](https://katex.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Offline First](https://img.shields.io/badge/Privacy-100%25_Offline_%2F_Zero_Cloud-success.svg)](#-privacy--architecture)

</div>

---

## 🚀 Overview

**Markdown to PDF** is a dedicated, **100% offline and local-first** VS Code extension engineered to convert your Markdown (`.md`) documents into print-ready, publication-grade PDF files.

Unlike traditional PDF exporters that rely on external browser processes (Puppeteer/Chromium) or fail to render diagrams properly, this extension includes its own bundled **Mermaid engine**, **KaTeX LaTeX math compiler**, and **high-DPI vector rasterizer**—all self-contained in a lightweight package.

---

## ✨ Key Features

### 1. 📊 Flawless Mermaid Diagram Rendering
- **High-DPI Retina Rasterization:** Converts SVGs to 2x/3x crisp PNG assets before PDF compilation to eliminate font blurring, dark background artifacts, or clipping.
- **Auto-Fit & Responsive Sizing:** Constrains massive flowcharts, architecture diagrams, or sequence flows to printable page widths automatically. Every diagram type shares one printable-width render path (`useMaxWidth: false`, pinned `useWidth`).
- **Mermaid 11.16.1 types:** Sample fences for every detector shipped in the installed package are in [`samples/mermaid-all-diagrams.md`](./samples/mermaid-all-diagrams.md).

| Type | Keywords | Status |
|---|---|---|
| Flowchart | `flowchart`, `graph` | Supported |
| Sequence | `sequenceDiagram` | Supported |
| Class | `classDiagram`, `classDiagram-v2` | Supported |
| State | `stateDiagram`, `stateDiagram-v2` | Supported |
| Entity relationship | `erDiagram` | Supported |
| Gantt | `gantt` | Supported |
| Git graph | `gitGraph` | Supported |
| Pie | `pie` | Supported |
| Quadrant | `quadrantChart` | Supported |
| Requirement | `requirementDiagram` | Supported |
| C4 | `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment` | Supported |
| Mindmap | `mindmap` | Supported |
| User journey | `journey` | Supported |
| Timeline | `timeline` | Supported |
| Kanban | `kanban` | Supported |
| Sankey | `sankey`, `sankey-beta` | Supported |
| Packet | `packet`, `packet-beta` | Supported |
| Block | `block`, `block-beta` | Supported |
| Info | `info` | Supported |
| XY chart | `xychart-beta` | Supported (experimental) |
| Architecture | `architecture-beta` | Supported (experimental). Built-in icons only (`cloud`, `database`, `disk`, `internet`, `server`). Custom Iconify packs are not fetched (offline / no extra network). |
| Event modeling | `eventmodeling` | Supported (experimental) |
| Ishikawa | `ishikawa-beta` | Supported (experimental) |
| Treemap | `treemap-beta` | Supported (experimental) |
| Swimlanes | `swimlane-beta` | Supported (experimental) |
| Radar | `radar-beta` | Supported (experimental) |
| Tree view | `treeView-beta` | Supported (experimental). File-type Iconify icons are not registered. |
| Venn | `venn-beta` | Supported (experimental) |
| Wardley | `wardley-beta` | Supported (experimental) |
| Cynefin | `cynefin-beta` | Supported (experimental) |
| Railroad | `railroad-beta`, `railroad-ebnf-beta`, `railroad-abnf-beta`, `railroad-peg-beta` | Supported (experimental) |
| Flowchart ELK | `flowchart-elk` | **Unsupported.** mermaid@11.16.1 registers the detector but does not bundle `@mermaid-js/layout-elk`. Export shows a per-type warning with the source fence instead of failing silently. Use `flowchart` / `graph` (dagre). |

If a supported type still fails to parse or render, the PDF/HTML preview keeps the source fence and a red **Diagram Render Warning (`keyword`)** — it does not drop the diagram.

### 2. 📐 Full KaTeX LaTeX Math Typesetting
- Seamless inline math: `$E = mc^2$`
- Multiline display equations:
  $$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
- **Code Block Protection:** Equations inside fenced code blocks (```` ``` ````) or inline code (`` `code` ``) are safely shielded and never mangled.

### 3. 🖼️ Smart Local & Relative Image Inlining
- Automatically detects local relative images (e.g. `![Architecture](./images/arch.png)` or `![Logo](../assets/logo.svg)`).
- Converts image bytes into inline Base64 data URIs so PDF rendering never fails on missing or unserved assets.

### 4. 📄 Intelligent A4 / Letter Pagination
- **Orphan / Widow Heading Protection:** Automatically avoids placing section titles (`h1`-`h6`) at the very bottom of a page without content.
- **Boundary Splitting Prevention:** Keeps code blocks, tables, math formulas, and diagrams intact within page boundaries.

### 5. 🖱️ Seamless 3-Way VS Code Integration
- **File Explorer Context Menu:** Right-click any `.md` file &rarr; `Export Markdown as PDF`.
- **Editor Context Menu:** Right-click inside any active Markdown file &rarr; `Export Markdown as PDF`.
- **Editor Navigation Title:** Click the `$(file-pdf)` icon at the top right of your markdown editor.
- **Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):** Type `Export Markdown as PDF`.

---

## 🎯 Quick Start

1. Open any Markdown (`.md`) file containing text, tables, math, or Mermaid code fences:
   ````markdown
   # System Architecture

   The compute pipeline is expressed below:

   ```mermaid
   graph LR
     Client[Web Client] --> Gateway[API Gateway]
     Gateway --> Auth[Auth Service]
     Gateway --> Core[Core API]
     Core --> DB[(PostgreSQL)]
   ```

   The total energy equation is $E^2 = (mc^2)^2 + (pc)^2$.
   ````
2. Right-click anywhere in the editor and choose **`Export Markdown as PDF`** (or click the PDF icon in the top right).
3. Choose your save location and click **Save**.
4. Once completed, click **`Open PDF`** in the notification banner to view your document!

---

## ⚙️ Configuration & Settings

Customize the export pipeline via VS Code Settings (`Ctrl+,` or `Cmd+,` &rarr; search `Markdown PDF`):

| Setting | Default | Options | Description |
|---|---|---|---|
| `markdownPdf.previewTheme` | `"default"` | `default`, `neutral`, `dark`, `forest`, `base` | Mermaid diagram theme used during export. |
| `markdownPdf.pageSize` | `"a4"` | `a4`, `letter`, `legal` | PDF page format size. |
| `markdownPdf.orientation` | `"portrait"` | `portrait`, `landscape` | Page orientation. |
| `markdownPdf.margin` | `32` | `10` to `80` | Document margin size in points (pt). |
| `markdownPdf.highDpi` | `2` | `1`, `2`, `3` | Rasterization scale factor for Mermaid diagrams (2 = 2x Retina quality). |

---

## 🔒 Privacy & Architecture

- **100% Local & Offline:** No data, markdown content, diagrams, or images are ever transmitted to any external server.
- **Zero External CLI Dependencies:** No headless Chrome or Puppeteer download required.
- **Content Security Policy (CSP):** Built with hardened webview security preventing unauthorized scripts or network access. Local images are inlined only from the document folder and workspace.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

<div align="center">
  <b>Crafted with ❤️ by codewithgod</b>
</div>
