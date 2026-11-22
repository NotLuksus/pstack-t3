// The mechanical half of the adaptation: which upstream files the fork carries, under
// which paths and identifiers. Its output is the `upstream` branch. The prose half (Cursor
// mechanisms rewritten as T3 Code ones) lives as commits on `main`, and git's three-way merge
// of `upstream` into `main` carries it forward. Anything that needs judgment stays out of here.
//
// Usage: node sync/transform.ts <upstream checkout> <output dir>
import { chmodSync, cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { loadConfig } from "./config.ts";

const [checkout, out] = process.argv.slice(2);
if (!checkout || !out) {
  console.error("usage: node sync/transform.ts <upstream checkout> <output dir>");
  process.exit(2);
}

const config = loadConfig();
const source = join(checkout, config.upstream.path);

const excluded = (path: string) =>
  config.exclude.some((rule) => (rule.endsWith("/") ? path.startsWith(rule) : path === rule));

const renamed = (path: string) => {
  for (const [from, to] of Object.entries(config.renamePaths)) {
    if (path === from || path.startsWith(from)) return to + path.slice(from.length);
  }
  return path;
};

// Text is whatever decodes as UTF-8 without NUL bytes; everything else is copied byte for byte.
const decodeText = (bytes: Buffer) => {
  if (bytes.includes(0)) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
};

const rewrite = (text: string) =>
  Object.entries(config.replaceText).reduce((acc, [from, to]) => acc.split(from).join(to), text);

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    if (entry.isFile()) return [path];
    throw new Error(`${path}: only regular files and directories are supported`);
  });

rmSync(out, { recursive: true, force: true });
let count = 0;
for (const file of files(source)) {
  const path = relative(source, file).split(sep).join("/");
  if (excluded(path)) continue;
  const target = join(out, renamed(path));
  mkdirSync(dirname(target), { recursive: true });
  const bytes = readFileSync(file);
  const text = decodeText(bytes);
  if (text === null) cpSync(file, target);
  else writeFileSync(target, rewrite(text));
  chmodSync(target, statSync(file).mode & 0o777);
  count++;
}
console.log(`transformed ${count} files from ${source} into ${out}`);
