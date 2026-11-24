// The mechanical half of the adaptation: which upstream files the fork carries, under
// which paths and identifiers. Its output is the `upstream` branch. The prose half (Cursor
// mechanisms rewritten as T3 Code ones) lives as commits on `main`, and git's three-way merge
// of `upstream` into `main` carries it forward. Anything that needs judgment stays out of here,
// except `rewrites`: text the fork owns outright (how roles pick models), written in its final
// form so `upstream` and `main` agree on it and an upstream edit there can never conflict.
// A rewrite whose pattern stops matching leaves a marker that `sync/validate.ts` rejects.
//
// Usage: node sync/transform.ts <upstream checkout> <output dir>
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
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

for (const rewrite of config.rewrites) {
  const replacement =
    "with" in rewrite ? rewrite.with : readFileSync(new URL(`./rewrites/${rewrite.file}`, import.meta.url), "utf8");
  for (const path of rewrite.paths) {
    const target = join(out, path);
    if (!existsSync(target)) {
      console.error(`rewrite "${rewrite.id}": ${path} is not in upstream; update sync/config.json`);
      process.exit(1);
    }
    if (rewrite.pattern === undefined) {
      writeFileSync(target, replacement);
      continue;
    }
    const text = readFileSync(target, "utf8");
    const pattern = new RegExp(rewrite.pattern, "gm");
    const matches = [...text.matchAll(pattern)].length;
    if (matches === 1) {
      // A string replacement, so `$1` keeps a captured step number; no rewrite text uses `$` otherwise.
      writeFileSync(target, text.replace(pattern, replacement.replace(/\n$/, "")));
    } else {
      console.error(`rewrite "${rewrite.id}": matched ${matches} times in ${path}, expected 1`);
      writeFileSync(
        target,
        `${text.replace(/\n*$/, "\n")}\n<!-- pstack-t3 sync: rewrite "${rewrite.id}" matched ${matches} times, expected 1; update it in sync/config.json -->\n`,
      );
    }
  }
}
console.log(`transformed ${count} files from ${source} into ${out}`);
