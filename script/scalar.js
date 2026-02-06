import { copyFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = resolve(join(import.meta.dirname, "..", "public"));
const scalarDir = resolve(dirname(fileURLToPath(import.meta.resolve("@scalar/api-reference"))));

async function main() {
  await copyFile(join(scalarDir, "./browser/standalone.js"), join(publicDir, "scalar.standalone.js"));
}


await main();
