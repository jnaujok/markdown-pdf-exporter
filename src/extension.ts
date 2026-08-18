import * as vscode from "vscode";
import { exportMarkdownAsPdf } from "./pdfExporter";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Markdown to PDF (with Mermaid & Math) extension activated.");

  const exportCommand = vscode.commands.registerCommand(
    "markdownPdf.export",
    async (resource?: vscode.Uri) => {
      await exportMarkdownAsPdf(context, resource);
    }
  );

  context.subscriptions.push(exportCommand);
}

export function deactivate(): void {
  // Clean up resources if needed
}
