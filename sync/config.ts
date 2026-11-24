import { readFileSync } from "node:fs";

/**
 * One rewrite of upstream text into its final T3 Code form. `pattern` is a JavaScript regular
 * expression (multiline, so `^` and `$` match at line ends) that must match exactly once in each
 * path; without `pattern` the rewrite replaces the whole file. The replacement is `with`, or the
 * text of `file` (relative to `sync/rewrites/`, a trailing newline dropped when `pattern` is set).
 */
export type Rewrite = {
  /** Shown in the marker a miss leaves behind. */
  id: string;
  /** Repository paths, after `renamePaths`. */
  paths: string[];
  pattern?: string;
} & ({ with: string } | { file: string });

export type Config = {
  upstream: { repository: string; branch: string; path: string };
  /** Upstream paths (relative to `upstream.path`) the fork never carries; a trailing `/` is a directory. */
  exclude: string[];
  /** Path prefixes renamed on the way in, applied before `replaceText`. */
  renamePaths: Record<string, string>;
  /** Literal identifiers rewritten in every text file. */
  replaceText: Record<string, string>;
  /** Text the fork owns outright, applied after `replaceText`. */
  rewrites: Rewrite[];
  /** Patterns that must not survive in the scanned files. */
  forbidden: { pattern: string; why: string }[];
  scan: { extensions: string[]; skip: string[] };
  /** Frontmatter keys the fork never carries in a skill or agent brief. */
  frontmatterDenied: string[];
};

export const loadConfig = (): Config =>
  JSON.parse(readFileSync(new URL("./config.json", import.meta.url), "utf8"));
