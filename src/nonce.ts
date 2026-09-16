import { randomBytes } from "node:crypto";

export function createNonce(byteLength = 16): string {
  const size = byteLength < 16 ? 16 : byteLength;
  return randomBytes(size).toString("base64url");
}
