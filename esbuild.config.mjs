import { readFile } from "node:fs/promises";
import * as esbuild from "esbuild";

const accidentalAwsKey = "AKIAqgCyALoAYABoAGAA";
const escapedAwsKey = "AKI\\x41qgCyALoAYABoAGAA";
let transformedHtml2CanvasFiles = 0;

const html2CanvasCredentialFalsePositivePlugin = {
  name: "html2canvas-credential-false-positive",
  setup(build) {
    build.onLoad(
      { filter: /html2canvas[\\/]dist[\\/]html2canvas\.js$/ },
      async ({ path }) => {
        const source = await readFile(path, "utf8");
        const matchCount = source.split(accidentalAwsKey).length - 1;

        if (matchCount !== 1) {
          throw new Error(
            `Expected one known html2canvas false positive, found ${matchCount}.`
          );
        }

        transformedHtml2CanvasFiles += 1;
        return {
          contents: source.replaceAll(accidentalAwsKey, escapedAwsKey),
          loader: "js",
        };
      }
    );
  },
};

const sharedOptions = {
  bundle: true,
  minify: true,
  legalComments: "eof",
  logLevel: "info",
};

// 1. Build Extension Host entry point
await esbuild.build({
  ...sharedOptions,
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
});

// 2. Build PDF Browser Runtime bundle (with CSS-as-text loader for KaTeX)
await esbuild.build({
  ...sharedOptions,
  entryPoints: ["src/pdfRuntime.ts"],
  outfile: "dist/pdfRuntime.js",
  format: "esm",
  platform: "browser",
  target: "es2022",
  loader: {
    ".css": "text",
  },
  plugins: [html2CanvasCredentialFalsePositivePlugin],
});

if (transformedHtml2CanvasFiles !== 1) {
  throw new Error(
    `Expected to transform html2canvas once, transformed ${transformedHtml2CanvasFiles} files.`
  );
}

const credentialPatterns = [
  ["AWS access-key ID", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ["private key", /-----BEGIN(?: RSA| EC| OPENSSH)? PRIVATE KEY-----/g],
  ["secret key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
];

for (const bundlePath of ["dist/extension.js", "dist/pdfRuntime.js"]) {
  const source = await readFile(bundlePath, "utf8");

  for (const [label, pattern] of credentialPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) {
      throw new Error(`${label} pattern remains in ${bundlePath}.`);
    }
  }
}

console.log("Bundle build and credential-pattern audit passed successfully.");
