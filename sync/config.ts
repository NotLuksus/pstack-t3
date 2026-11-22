import { readFileSync } from "node:fs";

export type Config = {
  upstream: { repository: string; branch: string; path: string };
  /** Upstream paths (relative to `upstream.path`) the fork never carries; a trailing `/` is a directory. */
  exclude: string[];
  /** Path prefixes renamed on the way in, applied before `replaceText`. */
  renamePaths: Record<string, string>;
  /** Literal identifiers rewritten in every text file. */
  replaceText: Record<string, string>;
  /** Patterns that must not survive in the scanned files. */
  forbidden: { pattern: string; why: string }[];
  scan: { extensions: string[]; skip: string[] };
  /** Frontmatter keys only Cursor reads. */
  frontmatterDenied: string[];
};

export const loadConfig = (): Config =>
  JSON.parse(readFileSync(new URL("./config.json", import.meta.url), "utf8"));
