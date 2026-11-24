# pstack-t3

[pstack](https://github.com/cursor/plugins/tree/main/pstack) for T3 Code, kept current with
upstream automatically.

pstack is poteto's set of agent workflows: one mode skill that routes to playbooks, principles
that ground every decision, and verification strict enough to parallelize with confidence. It
was written for Cursor. This fork keeps its skills and language and rewires the mechanics to T3
Code: `delegate_task` children instead of the Task tool, roles resolved from the model table in your
agent instructions instead of model slugs, `watch_pull_request` and `schedule_task`
instead of polling loops, `t3_thread_read` instead of transcript files, `preview_*` and
`device_*` for proof. [AGENTS.md](AGENTS.md) has the full map.

## Install

Pin a skill's directory (`skills/<name>`), for example as an Andaris Agents skill pin, or link
them all into `~/.agents/skills/`:

```bash
git clone https://github.com/NotLuksus/pstack-t3.git
cd pstack-t3
./install.sh            # or: ./install.sh --project /path/to/repo
```

Each role (builder, reviewer, panel seat) is a set of minimum scores on the model table in your
agent instructions: a Models and delegation section in the AGENTS.md or CLAUDE.md your harness
loads, scoring each model for Cost, Intelligence and Taste. pstack-t3 keeps no model list of its
own; `/setup-p3` shows which model each role resolves to. Use `/p3-mode` for rigorous work, and
`/p3-help` when unsure which skill fits.

## How it stays current

| Branch | Holds |
|---|---|
| `upstream` | pstack as published, after `sync/transform.ts` (Cursor packaging dropped, `poteto-*` names renamed, `tdd` and `teach` renamed `p3-tdd` and `p3-teach` so they install beside [mattpocock/skills](https://github.com/mattpocock/skills)' skills of those names). `.upstream-rev` names the upstream commit. |
| `main` | `upstream` plus the T3 Code adaptation, as commits on top. |

The **Sync upstream pstack** workflow runs daily and on demand. It mirrors new upstream commits
onto `upstream` and merges that into `main`, so git's three-way merge carries the adaptation
onto the new text. A clean merge that passes `node sync/validate.ts` (frontmatter, no Cursor
mechanisms or model slugs, references that resolve, no conflict markers) is pushed to `main`.
Otherwise `main` stays as it was and the workflow opens a pull request (or, if Actions may not
open one, an issue) with the conflicts and validation output. It uses only the workflow's own
`GITHUB_TOKEN`.

Why a merge, not a rewrite script: the adaptation is prose (a Cursor step becomes a T3 step in
the author's voice), which no mechanical rule produces, while upstream keeps editing the same
files. A three-way merge reapplies each hand-written change wherever upstream left its
surroundings alone, and stops exactly where both sides touched the same lines. The mechanical
part (paths, renames, exclusions) is a script, so it is redone identically on every sync. So is
the text this fork owns outright, how roles pick models: `sync/config.json` rewrites it into its
final form on `upstream` too, so upstream edits there never conflict, and a rewrite that stops
matching fails validation instead of letting upstream's model defaults through.

## Credit

- [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan
  ([poteto](https://x.com/poteto)), part of [cursor/plugins](https://github.com/cursor/plugins).
  The skills, principles and language are hers.
- [p3-stack](https://github.com/uzairansaruzi/p3-stack) by Uzair Ansar, the hand-made T3 Code
  port this fork starts from; and its
  [upstream-sync proposal](https://github.com/uzairansaruzi/p3-stack/pull/11) by slauzinho, whose
  exclusions and validation rules this sync reuses.

MIT, see [LICENSE](LICENSE).
