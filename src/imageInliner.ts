import { realpath } from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import {
  imageMimeType,
  isInsideAnyRoot,
  resolveLocalImagePath,
} from "./imagePath";

export { imageMimeType } from "./imagePath";

export async function inlineLocalImages(
  markdown: string,
  documentUri: vscode.Uri
): Promise<string> {
  if (documentUri.scheme !== "file") {
    return markdown;
  }

  const documentDir = path.dirname(documentUri.fsPath);
  const allowedRoots = collectAllowedRoots(documentUri);
  const realRoots = await Promise.all(
    allowedRoots.map((root) => realpath(root).catch(() => path.resolve(root)))
  );

  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g;
  const matches = [...markdown.matchAll(pattern)];
  let result = markdown;

  for (const match of matches.reverse()) {
    const rawTarget = match[2].replace(/^<|>$/g, "");
    const resolved = resolveLocalImagePath(rawTarget, documentDir, allowedRoots);
    if (!resolved || match.index === undefined) {
      continue;
    }

    try {
      const realFile = await realpath(resolved);
      if (!isInsideAnyRoot(realFile, realRoots)) {
        continue;
      }

      const mimeType = imageMimeType(realFile);
      if (!mimeType) {
        continue;
      }

      const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(realFile));
      const replacement = `![${match[1]}](data:${mimeType};base64,${Buffer.from(bytes).toString("base64")})`;
      result =
        result.slice(0, match.index) +
        replacement +
        result.slice(match.index + match[0].length);
    } catch {
      // Keep unresolved image references in the document instead of failing the export.
    }
  }

  return result;
}

function collectAllowedRoots(documentUri: vscode.Uri): string[] {
  const roots: string[] = [];
  if (documentUri.scheme === "file") {
    roots.push(path.dirname(documentUri.fsPath));
  }
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (folder.uri.scheme === "file") {
      roots.push(folder.uri.fsPath);
    }
  }
  return roots;
}
