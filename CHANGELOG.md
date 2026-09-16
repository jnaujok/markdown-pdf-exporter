# Change Log

All notable changes to the **Markdown to PDF (with Mermaid & Math)** extension will be documented in this file.

## [1.0.2] - 2026-09-16

### Fixed
- Inline `` `code` `` spans that wrap across a line no longer paint one opaque highlight box over surrounding text in the HTML preview or html2canvas PDF capture.

### Security
- Tightened webview CSP (`connect-src 'none'`, no `unsafe-eval`, nonce-only style tags).
- Confined local image inlining to the markdown file directory and workspace folders; rejected URI schemes and path traversal.
- Sanitizer now drops remote images and unknown protocols; KaTeX `trust` is off; mermaid SVG is sanitized with an SVG profile.

## [1.0.1] - 2026-08-19

### Improved
- 📐 Fixed mathematical formula rendering in PDF captures by switching KaTeX to HTML output mode and embedding font styles.
- 🛡️ Safe DOM placeholder substitution avoiding regex special token replacement collisions (`$`, `'`, `%`).
- 🎨 Updated official extension icon and banner assets.
- 🏷️ Updated author and copyright metadata to `codewithgod`.

## [1.0.0] - 2026-08-19

### Initial Release
- 🚀 Standalone, local-first Markdown to PDF compilation engine.
- 📊 Native Mermaid rendering for 12+ diagram types (Flowcharts, Sequence, Class, ER, State, Gantt, Git Graph, Mindmap, Pie, C4).
- 📐 KaTeX LaTeX mathematical equation support for both inline (`$...$`) and block (`$$...$$`) math.
- 🖼️ Automatic local image base64 resolution and inlining.
- 📄 Intelligent A4/Letter page height calculation and smart pagination without breaking headers.
- 🎨 Configurable Mermaid rendering themes and PDF settings.
- 🖱️ Triple-point VS Code integration: File Explorer context menu, Editor title button, and Command Palette.
