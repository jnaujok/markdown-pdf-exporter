import * as path from "path";

export function hasUriScheme(target: string): boolean {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) {
    return !/^[a-zA-Z]:[\\/]/.test(target);
  }
  return false;
}

export function isInsideRoot(filePath: string, root: string): boolean {
  const resolvedFile = path.resolve(filePath);
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(resolvedRoot, resolvedFile);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function isInsideAnyRoot(filePath: string, roots: string[]): boolean {
  return roots.some((root) => isInsideRoot(filePath, root));
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

export function resolveLocalImagePath(
  rawTarget: string,
  documentDir: string,
  allowedRoots: string[]
): string | undefined {
  const trimmed = rawTarget.trim();
  if (!trimmed || trimmed.includes("\0") || trimmed.startsWith("//")) {
    return undefined;
  }
  if (hasUriScheme(trimmed)) {
    return undefined;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed.split(/[?#]/, 1)[0]);
  } catch {
    return undefined;
  }

  if (!decoded || decoded.includes("\0") || hasUriScheme(decoded)) {
    return undefined;
  }

  const resolved = path.isAbsolute(decoded)
    ? path.resolve(decoded)
    : path.resolve(documentDir, decoded);

  if (!imageMimeType(resolved) || !isInsideAnyRoot(resolved, allowedRoots)) {
    return undefined;
  }

  return resolved;
}
