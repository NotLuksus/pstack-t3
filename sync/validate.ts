// What a commit to `main` must satisfy. A sync that merges cleanly but fails here becomes a
// pull request instead: new upstream prose can bring Cursor mechanisms with it, and only a
// person (or an agent they run) can rewrite those for T3 Code.
//
// Usage: node sync/validate.ts [repo root]   (exit 1 with one problem per line)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { loadConfig } from "./config.ts";

const root = resolve(process.argv[2] ?? ".");
const config = loadConfig();
const problems: string[] = [];
const report = (path: string, line: number | null, message: string) =>
  problems.push(`${relative(root, path)}${line === null ? "" : `:${line}`}: ${message}`);

const files = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? files(path) : [path];
      })
    : [];

const textOf = (path: string) => {
  const bytes = readFileSync(path);
  return bytes.includes(0) ? null : bytes.toString("utf8");
};

const frontmatter = (text: string) => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) return null;
  const keys = new Map<string, string>();
  for (const line of match[1].split("\n")) {
    const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (field) keys.set(field[1], field[2].trim());
  }
  return keys;
};

const all = [...files(join(root, "skills")), ...files(join(root, "agents"))];

// Every skill directory is installable on its own: a SKILL.md that names it.
const skillsDir = join(root, "skills");
for (const name of existsSync(skillsDir) ? readdirSync(skillsDir) : []) {
  const dir = join(skillsDir, name);
  if (!statSync(dir).isDirectory()) continue;
  const skill = join(dir, "SKILL.md");
  if (!existsSync(skill)) {
    report(dir, null, "skill directory without SKILL.md");
    continue;
  }
  const fields = frontmatter(readFileSync(skill, "utf8"));
  if (!fields) report(skill, 1, "no frontmatter");
  else {
    if (fields.get("name") !== name) report(skill, null, `frontmatter name is ${JSON.stringify(fields.get("name"))}, expected ${JSON.stringify(name)}`);
    if (!fields.get("description")) report(skill, null, "frontmatter has no description");
    for (const key of config.frontmatterDenied)
      if (fields.has(key)) report(skill, null, `frontmatter field \`${key}\` is not carried`);
  }
}

// Agent briefs are prompts, not harness agent definitions: no model pin or Cursor fields.
for (const brief of files(join(root, "agents")).filter((path) => path.endsWith(".md"))) {
  const fields = frontmatter(readFileSync(brief, "utf8"));
  for (const key of config.frontmatterDenied)
    if (fields?.has(key)) report(brief, null, `frontmatter field \`${key}\` is not carried`);
}

const forbidden = config.forbidden.map((rule) => ({ ...rule, regex: new RegExp(rule.pattern, "m") }));
const conflict = /^(<{7}|>{7}|\|{7})( |$)|^={7}$/;
// A path inside the skill (`references/x.md`) or a relative Markdown link must exist.
const localRef = /`((?:references|playbooks|scripts|assets|templates)\/[\w./-]+\.\w+)`|\]\((?!https?:|#|mailto:)([^)\s#]+\.\w+)\)/g;

for (const path of all) {
  const text = textOf(path);
  if (text === null) continue;
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (conflict.test(line)) report(path, i + 1, "unresolved merge conflict marker");
  });

  const rel = relative(root, path);
  const base = rel.split("/").at(-1) ?? "";
  if (!config.scan.extensions.some((ext) => path.endsWith(ext)) || config.scan.skip.includes(base)) continue;
  lines.forEach((line, i) => {
    for (const rule of forbidden)
      if (rule.regex.test(line)) report(path, i + 1, `${rule.why}: ${line.trim().slice(0, 120)}`);
  });

  const skillRoot = rel.startsWith("skills/") ? join(root, rel.split("/").slice(0, 2).join("/")) : dirname(path);
  for (const match of text.matchAll(localRef)) {
    const target = match[1] ?? match[2];
    // Skills write these relative to the file or to the skill's root; accept either.
    const candidates = [join(dirname(path), target), join(skillRoot, target)];
    if (!candidates.some(existsSync)) {
      const line = text.slice(0, match.index).split("\n").length;
      report(path, line, `reference to missing ${target}`);
    }
  }
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.error(`${problems.length} problem(s)`);
  process.exit(1);
}
console.log("valid");
