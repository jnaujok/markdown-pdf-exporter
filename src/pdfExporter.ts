import * as path from "path";
import * as vscode from "vscode";
import { webviewCsp } from "./csp";
import { DOCUMENT_CSS } from "./documentCss";
import { inlineLocalImages } from "./imageInliner";
import { extractMermaidFences } from "./mermaidFences";
import { createNonce } from "./nonce";
import { ExportOptions, MarkdownPdfPayload, PdfMessage } from "./types";

export async function exportMarkdownAsPdf(
  context: vscode.ExtensionContext,
  explorerUri?: vscode.Uri
): Promise<void> {
  let document: vscode.TextDocument | undefined;

  if (explorerUri) {
    document = await vscode.workspace.openTextDocument(explorerUri);
  } else {
    document = vscode.window.activeTextEditor?.document;
  }

  if (!document || !isMarkdownDocument(document)) {
    void vscode.window.showWarningMessage(
      "Please open or select a Markdown (.md) file to export as PDF."
    );
    return;
  }

  const defaultUri = defaultPdfUri(document);
  const target = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { "PDF Document": ["pdf"] },
    saveLabel: "Export as PDF",
    title: "Export Markdown as PDF",
  });

  if (!target) {
    return;
  }

  const config = vscode.workspace.getConfiguration("markdownPdf");
  const options: ExportOptions = {
    previewTheme: config.get<ExportOptions["previewTheme"]>("previewTheme", "default"),
    pageSize: config.get<ExportOptions["pageSize"]>("pageSize", "a4"),
    orientation: config.get<ExportOptions["orientation"]>("orientation", "portrait"),
    margin: config.get<number>("margin", 32),
    highDpi: config.get<number>("highDpi", 2),
  };

  const markdownWithImages = await inlineLocalImages(document.getText(), document.uri);
  const payload: MarkdownPdfPayload = {
    ...extractMermaidFences(markdownWithImages, path.basename(document.fileName)),
    options,
  };

  const distRoot = vscode.Uri.joinPath(context.extensionUri, "dist");
  const panel = vscode.window.createWebviewPanel(
    "markdownPdf.exportPreview",
    `Exporting ${path.basename(target.fsPath)}...`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [distRoot],
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = markdownPdfHtml(context, panel.webview, payload);

  const subscription = panel.webview.onDidReceiveMessage(
    async (message: PdfMessage) => {
      if (message.type === "progress" && message.message) {
        panel.title = `Exporting: ${message.message}`;
        return;
      }

      if (message.type === "error") {
        void vscode.window.showErrorMessage(
          `PDF export failed: ${message.message ?? "Unknown error"}`
        );
        panel.dispose();
        return;
      }

      if (message.type !== "pdfReady" || !message.base64) {
        return;
      }

      try {
        await vscode.workspace.fs.writeFile(
          target,
          Buffer.from(message.base64, "base64")
        );

        const pages =
          message.pageCount === 1
            ? "1 page"
            : `${message.pageCount ?? 0} pages`;

        panel.dispose();

        const action = await vscode.window.showInformationMessage(
          `Successfully exported ${path.basename(target.fsPath)} (${pages}).`,
          "Open PDF",
          "Reveal in Explorer"
        );

        if (action === "Open PDF") {
          await vscode.env.openExternal(target);
        } else if (action === "Reveal in Explorer") {
          await vscode.commands.executeCommand("revealFileInOS", target);
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Could not write PDF file: ${detail}`);
      }
    }
  );

  panel.onDidDispose(() => subscription.dispose());
}

function isMarkdownDocument(document: vscode.TextDocument): boolean {
  const extension = path.extname(document.fileName).toLowerCase();
  return (
    document.languageId === "markdown" ||
    extension === ".md" ||
    extension === ".markdown"
  );
}

function defaultPdfUri(document: vscode.TextDocument): vscode.Uri | undefined {
  const baseName =
    document.uri.scheme === "untitled"
      ? "markdown-export.pdf"
      : `${path.parse(document.fileName).name}.pdf`;

  if (document.uri.scheme === "file") {
    return vscode.Uri.file(path.join(path.dirname(document.fileName), baseName));
  }

  return vscode.workspace.workspaceFolders?.[0]
    ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, baseName)
    : undefined;
}

function markdownPdfHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  payload: MarkdownPdfPayload
): string {
  const nonce = createNonce();
  const runtimeUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "dist", "pdfRuntime.js")
  );
  const data = JSON.stringify(payload).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${webviewCsp(nonce, webview.cspSource)}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style nonce="${nonce}">
${DOCUMENT_CSS}
  </style>
</head>
<body>
  <div class="status-bar" id="statusBar">
    <div class="spinner"></div>
    <span id="status">Initializing PDF export engine...</span>
  </div>
  <article id="document"></article>

  <script type="module" nonce="${nonce}">
    import mermaid, { DOMPurify, html2canvas, jsPDF, katex, katexCss, marked, applyNonceToStyleElements, buildMermaidInitConfig, fitDiagramToPage, getMermaidExportSupport, mermaidRasterFailureMessage, mermaidRenderWarningHtml, PRINTABLE_DIAGRAM_HEIGHT, rasterTimeoutMs, resolveExportDiagramSize, sanitizeExportHtml, sanitizeExportSvg, splitWrappingInlineCode } from "${runtimeUri}";

    const vscode = acquireVsCodeApi();
    const payload = ${data};
    const article = document.getElementById('document');
    const status = document.getElementById('status');

    const update = msg => {
      status.textContent = msg;
      vscode.postMessage({ type: 'progress', message: msg });
    };

    const attachSanitizedSvg = (container, svgMarkup) => {
      const temp = document.createElement('div');
      temp.innerHTML = sanitizeExportSvg(DOMPurify, svgMarkup);
      applyNonceToStyleElements(temp, '${nonce}');
      container.replaceChildren(...temp.childNodes);
      return container.querySelector('svg');
    };

    try {
      // Inject KaTeX stylesheet dynamically
      if (katexCss) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('nonce', '${nonce}');
        styleEl.textContent = katexCss;
        document.head.appendChild(styleEl);
      }

      update('Processing mathematical equations (KaTeX)...');
      await tick();

      let md = payload.markdown;
      const codeHolders = [];

      // 1. Protect fenced code blocks (\`\`\`...\`\`\` and ~~~...~~~)
      md = md.replace(/^(\`{3,}|~{3,})[^\\r\\n]*\\r?\\n([\\s\\S]*?)^\\\\1\\s*$/gm, (m) => {
        codeHolders.push(m);
        return '@@@CODE_BLOCK_' + (codeHolders.length - 1) + '@@@';
      });

      // 2. Protect inline code (\`...\`)
      md = md.replace(/(\`[^\`\\n]+\`)/g, (m) => {
        codeHolders.push(m);
        return '@@@CODE_BLOCK_' + (codeHolders.length - 1) + '@@@';
      });

      const mathHolders = [];

      // 3. Extract and render Display Math $$...$$
      md = md.replace(/\\$\\$([\\s\\S]+?)\\$\\$/g, (_, tex) => {
        try {
          const rendered = katex.renderToString(tex.trim(), {
            displayMode: true,
            output: 'html',
            throwOnError: false,
            trust: false
          });
          const index = mathHolders.push('<div class="math-display">' + rendered + '</div>') - 1;
          return '\\n<div data-pdf-math="' + index + '"></div>\\n';
        } catch (e) {
          const fallback = '<pre class="math-error"><code>' + esc(tex) + '</code></pre>';
          const index = mathHolders.push(fallback) - 1;
          return '\\n<div data-pdf-math="' + index + '"></div>\\n';
        }
      });

      // 4. Extract and render Inline Math $...$
      md = md.replace(/(?<!\\\\)\\$([^\\n$]+?)(?<!\\\\)\\$/g, (_, tex) => {
        try {
          const rendered = katex.renderToString(tex.trim(), {
            displayMode: false,
            output: 'html',
            throwOnError: false,
            trust: false
          });
          const index = mathHolders.push('<span class="math-inline">' + rendered + '</span>') - 1;
          return '<span data-pdf-math="' + index + '"></span>';
        } catch (e) {
          const fallback = '<span>$' + esc(tex) + '$</span>';
          const index = mathHolders.push(fallback) - 1;
          return '<span data-pdf-math="' + index + '"></span>';
        }
      });

      // 5. Restore code blocks
      md = md.replace(/@@@CODE_BLOCK_(\\d+)@@@/g, (_, idx) => codeHolders[Number(idx)] || '');

      update('Parsing Markdown content...');
      await tick();

      const markedHtml = await marked.parse(md, { gfm: true, breaks: false });

      article.innerHTML = sanitizeExportHtml(DOMPurify, markedHtml);

      // 6. Safe DOM-level math placeholder restoration (prevents regex replacement corruptions)
      const mathElements = article.querySelectorAll('[data-pdf-math]');
      mathElements.forEach(el => {
        const idx = Number(el.dataset.pdfMath);
        if (!isNaN(idx) && mathHolders[idx] !== undefined) {
          const temp = document.createElement('div');
          temp.innerHTML = sanitizeExportHtml(DOMPurify, mathHolders[idx]);
          if (temp.firstElementChild) {
            el.replaceWith(temp.firstElementChild);
          }
        }
      });

      // --- Initialize Mermaid Engine ---
      const mermaidTheme = payload.options.previewTheme || 'default';
      mermaid.initialize(buildMermaidInitConfig(mermaidTheme));

      const blocks = [...article.querySelectorAll('[data-mermaid-index]')];
      if (blocks.length > 0) {
        update('Rendering ' + blocks.length + ' Mermaid diagram(s)...');
        await tick();

        for (let i = 0; i < blocks.length; i++) {
          update('Rendering diagram ' + (i + 1) + ' of ' + blocks.length + '...');
          await tick();

          const block = blocks[i];
          const source = payload.diagrams[Number(block.dataset.mermaidIndex)];
          if (!source) continue;

          const support = getMermaidExportSupport(source);
          if (!support.supported) {
            block.innerHTML = sanitizeExportHtml(
              DOMPurify,
              mermaidRenderWarningHtml(
                support.kind,
                source,
                support.reason || 'Unsupported diagram type'
              )
            );
            continue;
          }

          try {
            const renderId = 'mdpdf-diagram-' + i + '-' + Date.now();
            const rendered = await mermaid.render(renderId, source);
            const svgEl = attachSanitizedSvg(block, rendered.svg);
            const box = svgEl?.viewBox?.baseVal;
            const bounds = svgEl?.getBoundingClientRect?.();
            const size = svgEl
              ? resolveExportDiagramSize(
                  box?.width,
                  box?.height,
                  bounds?.width,
                  bounds?.height
                )
              : null;
            const png = svgEl && size
              ? await withTimeout(
                  svgToPng(svgEl, payload.options.highDpi || 2, size),
                  rasterTimeoutMs(size.width, size.height, payload.options.highDpi || 2)
                )
              : null;
            const rasterFailure = mermaidRasterFailureMessage(
              !svgEl,
              !size,
              !(png && png.width >= 1 && png.height >= 1)
            );
            if (rasterFailure) {
              block.innerHTML = sanitizeExportHtml(
                DOMPurify,
                mermaidRenderWarningHtml(support.kind, source, rasterFailure)
              );
              continue;
            }

            const img = document.createElement('img');
            const availableWidth = Math.max(1, block.clientWidth - 32);
            const fit = fitDiagramToPage(
              png.width,
              png.height,
              availableWidth,
              PRINTABLE_DIAGRAM_HEIGHT
            );

            img.src = png.url;
            img.alt = 'Mermaid Diagram ' + (i + 1);
            img.width = fit.width;
            img.height = fit.height;
            block.innerHTML = '';
            block.appendChild(img);
          } catch (err) {
            block.innerHTML = sanitizeExportHtml(
              DOMPurify,
              mermaidRenderWarningHtml(
                support.kind,
                source,
                err?.message || String(err)
              )
            );
          }
        }
      }

      update('Finalizing layout assets...');
      await waitForImages(article);
      await document.fonts?.ready;
      splitWrappingInlineCode(article);
      await tick();

      // --- Smart Pagination & jsPDF Assembly ---
      const pageSize = payload.options.pageSize || 'a4';
      const orientation = payload.options.orientation || 'portrait';
      const margin = payload.options.margin || 32;

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'pt',
        format: pageSize,
        compress: true,
        putOnlyUsedFonts: true
      });

      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const cw = pw - margin * 2;
      const ch = ph - margin * 2;

      const articleRect = article.getBoundingClientRect();
      const captureWidth = Math.ceil(articleRect.width);
      const naturalPageHeight = Math.floor((captureWidth * ch) / cw);
      const articleStyle = getComputedStyle(article);
      const verticalPadding =
        parseFloat(articleStyle.paddingTop) + parseFloat(articleStyle.paddingBottom);
      const availableHeight = Math.max(1, naturalPageHeight - verticalPadding);

      const items = [...article.children].map(node => {
        const style = getComputedStyle(node);
        const marginY =
          Math.max(0, parseFloat(style.marginTop)) +
          Math.max(0, parseFloat(style.marginBottom));
        return {
          node,
          height: Math.ceil(node.getBoundingClientRect().height + marginY)
        };
      });

      const pages = [];
      let page = [];
      let used = 0;

      for (const item of items) {
        if (page.length && used + item.height > availableHeight) {
          let carry = [];
          const previous = page[page.length - 1];

          // Avoid orphan headings
          if (page.length > 1 && previous.node.matches('h1, h2, h3, h4, h5, h6')) {
            carry = [page.pop()];
            used -= carry[0].height;
          }

          pages.push(page);
          page = carry;
          used = carry.reduce((sum, entry) => sum + entry.height, 0);
        }
        page.push(item);
        used += item.height;
      }

      if (page.length || pages.length === 0) {
        pages.push(page);
      }

      let pageNumber = 0;
      for (const pageItems of pages) {
        update('Generating PDF page ' + (pageNumber + 1) + ' of ' + pages.length + '...');
        await tick();

        const captureArticle = article.cloneNode(false);
        captureArticle.removeAttribute('id');
        captureArticle.setAttribute('aria-hidden', 'true');
        captureArticle.style.position = 'absolute';
        captureArticle.style.left = '0';
        captureArticle.style.top = '0';
        captureArticle.style.margin = '0';
        captureArticle.style.boxShadow = 'none';

        for (const item of pageItems) {
          captureArticle.appendChild(item.node.cloneNode(true));
        }

        document.body.appendChild(captureArticle);
        await waitForImages(captureArticle);

        let pageCanvas;
        try {
          const captureRect = captureArticle.getBoundingClientRect();
          pageCanvas = await html2canvas(captureArticle, {
            scale: 1.5,
            width: Math.ceil(captureRect.width),
            height: Math.ceil(captureRect.height),
            windowWidth: Math.max(
              document.documentElement.clientWidth,
              Math.ceil(captureRect.width)
            ),
            windowHeight: Math.max(
              document.documentElement.clientHeight,
              Math.ceil(captureRect.height)
            ),
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: false,
            imageTimeout: 15000
          });
        } finally {
          captureArticle.remove();
        }

        if (pageNumber > 0) {
          pdf.addPage();
        }

        const fw = Math.min(cw, (ch * pageCanvas.width) / pageCanvas.height);
        const rh = (pageCanvas.height * fw) / pageCanvas.width;
        const xOffset = (pw - fw) / 2;

        pdf.addImage(
          pageCanvas.toDataURL('image/jpeg', 0.94),
          'JPEG',
          xOffset,
          margin,
          fw,
          rh,
          undefined,
          'FAST'
        );

        pageCanvas.width = 1;
        pageCanvas.height = 1;
        pageNumber++;
      }

      update('Encoding & Saving PDF document...');
      const bytes = new Uint8Array(pdf.output('arraybuffer'));
      let bin = '';
      for (let s = 0; s < bytes.length; s += 32768) {
        bin += String.fromCharCode(...bytes.subarray(s, s + 32768));
      }

      vscode.postMessage({
        type: 'pdfReady',
        base64: btoa(bin),
        pageCount: pageNumber
      });
    } catch (error) {
      const msg = error?.message || String(error);
      status.textContent = 'Export error: ' + msg;
      vscode.postMessage({ type: 'error', message: msg });
    }

    function tick() {
      return new Promise(resolve => setTimeout(resolve, 25));
    }

    function withTimeout(promise, ms) {
      return Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve(null), ms))
      ]);
    }

    async function svgToPng(svgEl, scale = 2, natural) {
      try {
        const sw = natural?.width;
        const sh = natural?.height;
        if (typeof sw !== 'number' || typeof sh !== 'number' || sw < 1 || sh < 1) {
          return null;
        }
        const w = Math.ceil(sw) * scale;
        const h = Math.ceil(sh) * scale;

        const clone = svgEl.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', String(Math.ceil(sw)));
        clone.setAttribute('height', String(Math.ceil(sh)));
        clone.style.backgroundColor = '#ffffff';
        clone.style.colorScheme = 'light';

        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', '100%');
        bg.setAttribute('height', '100%');
        bg.setAttribute('fill', '#ffffff');
        clone.insertBefore(bg, clone.firstChild);

        const svgStr = new XMLSerializer().serializeToString(clone);
        const dataUrl =
          'data:image/svg+xml;base64,' +
          btoa(unescape(encodeURIComponent(svgStr)));

        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              resolve({
                url: canvas.toDataURL('image/png'),
                width: sw,
                height: sh
              });
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        });
      } catch {
        return null;
      }
    }

    function waitForImages(root) {
      return Promise.all(
        [...root.querySelectorAll('img')].map(
          img =>
            img.complete
              ? Promise.resolve()
              : new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                })
        )
      );
    }

    function esc(text) {
      return String(text).replace(
        /[&<>"']/g,
        char =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          }[char])
      );
    }
  </script>
</body>
</html>`;
}

