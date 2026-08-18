import * as path from "path";
import * as vscode from "vscode";

export async function inlineLocalImages(
  markdown: string,
  documentUri: vscode.Uri
): Promise<string> {
  if (documentUri.scheme !== "file") {
    return markdown;
  }

  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g;
  const matches = [...markdown.matchAll(pattern)];
  let result = markdown;

  for (const match of matches.reverse()) {
    const rawTarget = match[2].replace(/^<|>$/g, "");
    if (/^(?:https?:|data:)/i.test(rawTarget)) {
      continue;
    }

    try {
      const decoded = decodeURIComponent(rawTarget.split(/[?#]/, 1)[0]);
      const imagePath = path.isAbsolute(decoded)
        ? decoded
        : path.resolve(path.dirname(documentUri.fsPath), decoded);

      const imageUri = vscode.Uri.file(imagePath);
      const bytes = await vscode.workspace.fs.readFile(imageUri);
      const mimeType = imageMimeType(imagePath);

      if (!mimeType || match.index === undefined) {
        continue;
      }

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

export function imageMimeType(filePath: string): string | undefined {
  switch (path.extname(filePath).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".bmp":
      return "image/bmp";
    default:
      return undefined;
  }
}
