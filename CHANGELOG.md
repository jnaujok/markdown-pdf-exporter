# Change Log

All notable changes to the **Markdown to PDF (with Mermaid & Math)** extension will be documented in this file.

## [1.0.5] - 2026-09-17

### Added
- Export coverage for every diagram detector shipped in mermaid@11.16.1 (stable and experimental), using one shared printable-width render path.
- Sample fences for each type in `samples/mermaid-all-diagrams.md`, plus radar / venn / architecture examples in `test-sample.md`.
- Per-type **Diagram Render Warning (`keyword`)** when a fence fails or is unsupported. `flowchart-elk` is documented as unsupported: ELK is not bundled.

### Fixed
- SVG→PNG no longer uses `width || fallback` after natural size is known, so an explicit 0×N canvas cannot become an 800×600 default. Collapsed measurements now skip rasterization and show the per-type warning.
- Missing SVG, collapsed size, and PNG failure all keep the source fence plus **Diagram Render Warning** instead of leaving a blank sanitized SVG.
- Journey/timeline labels use `textPlacement: tspan` instead of foreignObject. TreeView default icons stay off; Kanban ticket URLs are not injected.
- Wardley printable sizing is applied under both `wardley-beta` (what mermaid@11.16.1 reads) and `wardley`.

## [1.0.4] - 2026-09-17

### Fixed
- Mermaid **Gantt** charts now export at a printable width. Gantt uniquely sizes from the temp SVG parent's `offsetWidth` (often `0` or the full webview body during `mermaid.render()`), which collapsed the viewBox or produced a huge raster that hit the 10s PNG timeout.
- Gantt init now pins `gantt.useWidth` to the article column and sets `gantt.useMaxWidth: false` so SVG→PNG gets real pixel dimensions. `securityLevel` stays `strict`; `htmlLabels` stays `false`.
- Wide-diagram PNG timeout scales with megapixels (capped) instead of a flat 10s. Empty viewBoxes are rejected instead of rasterizing a 0×N canvas.
- Per-type render warnings include the diagram keyword (for example `gantt`) when Mermaid throws.

### Added
- Realistic Q3 platform-delivery Gantt sample in `test-sample.md`.

## [1.0.3] - 2026-09-16

### Fixed
- SVG `href` and `xlink:href` are validated independently on `<image>`, `<use>`, and other resource elements, so a safe value on one attribute cannot leave a remote value on the other.
- Mermaid SVG `<style>` nodes (including nested `defs` / nested `<svg>`) receive the page CSP nonce before insertion, so nonce-only `style-src` does not strip diagram CSS.
- Inline `<code>` with nested markup (for example `<code><strong>foo</strong></code>`) is no longer flattened unless the span actually wraps.
- Wrap detection indexes nested text nodes once per span instead of walking from the start for every character.
- VSIX packaging now excludes `*.log` files.

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
