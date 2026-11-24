# pstack-t3 contributor guide

pstack-t3 adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack) by poteto for T3 Code. Same skills, same language, rewired to T3's native orchestration.

A skill reads as if it were written for T3 Code first. Keep pstack's sentences verbatim wherever they still apply. Replace every Cursor mechanism with the T3 Code equivalent below.

## Delegated workers

If you are a delegated worker, your brief names exactly one file. Write only that file, create parent directories as needed, and run no git commands. Report back the file path, its line count, and the changes you made to pstack's version.

## Cursor to T3 Code map

| pstack | pstack-t3 |
|---|---|
| `Task` tool, `subagent_type`, `run_in_background` | `delegate_task` with a self-contained brief. It is async by default: end the turn, and each completion wakes you; read it with `task_status`. Never poll a running task. `task_cancel` to stop |
| Model slugs, per-role model rule | Named roles with minimum Cost/Intelligence/Taste scores, resolved against the model table in the user's agent instructions and `orchestrator_capabilities` (role names below). Never hardcode a model. |
| "cloud agent", `environment: "cloud"`, `cloud_base_branch` | A delegated child task. Use `t3_thread_launch` only when the worker needs its own top-level thread, worktree, or branch. |
| "each worker gets its own worktree or branch" | `delegate_task` with `isolation: "worktree"`. A worker that needs its own top-level thread: `t3_thread_launch` with `workspaceStrategy`. One writer per worktree. |
| `/loop`, poll loops, `scripts/watch-pr` | `watch_pull_request`: T3 watches the PR and wakes the thread on checks finishing, new comments, or conflicts. Arm it, end the turn, triage on wake. For other cadences use `schedule_task`. |
| Hourly audit ticks, recurring runs | `schedule_task` with `{"type":"interval","everyMs":...}` or `{"type":"fixed_time","timeOfDay":...,"weekdays":[...]}`; `run_scheduled_task_now` for an immediate run. |
| Stack bookkeeping with `gt`, manual PR lists | `link_pull_request` for every layer, immediately; `list_thread_pull_requests` returns the stack bottom to top. |
| `agent-transcripts/*.jsonl` mining | `t3_thread_read`, `t3_thread_search`; `t3_queue_list`/`t3_queue_read`/`t3_queue_edit`/`t3_queue_reorder`/`t3_queue_cancel`/`t3_queue_promote_to_steer` for queued input. |
| `AskQuestion` | Ask plainly in the thread. `t3_pending_request_list`/`t3_pending_request_read`/`t3_pending_request_respond` answer questions in other threads. |
| `control-ui`, `control-cli` (from cursor-team-kit) | `preview_*` browser tools (`preview_act` clicks, types, presses and scrolls) and `device_*` simulator tools; `preview_recording_start`/`preview_recording_stop` and `device_screenshot` for evidence; `html_preview` and `html_render` show a file to the user. |
| `/add-plugin` | Install is a symlink of `skills/*` into `~/.agents/skills/`, or a pin per skill (see README). |
| `poteto-mode`, `poteto-agent`, `poteto-help`, `setup-pstack`, `tdd`, `teach` | `p3-mode`, `agents/p3-agent.md`, `p3-help`, `setup-p3`, `p3-tdd`, `p3-teach` (renamed by `sync/config.json`). |
| Cursor custom modes ("press option+enter") | Skills are invoked by name (`/p3-mode`). No mode toggles. |

Everything else in pstack transfers as written: the principles, the playbook shapes, the brief template, the reply style, the autonomy rules. Adopt it.

## Role names

The Subagents section of `skills/p3-mode/SKILL.md` has one line per role with its minimum scores. Code work uses its playbook's role: `feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`. Prose and judgment use `judgment and prose`. Panels use `arena runners`, `arena cross-judge pool`, `interrogate reviewers`; fan-out and verification use `swarm workers`.

Keep these names exactly; they follow upstream's. A role resolves against the model table in the user's agent instructions (the Models and delegation section of the AGENTS.md or CLAUDE.md the harness loads), never against a model list in this repository. `setup-p3` only shows how the roles resolve.

## Writing rules

- Thin over complete. Keep the shortest file that still changes behavior. Cut Cursor-only edge-case protocol and forge-specific branches before cutting any rule.
- pstack's voice: terse, declarative, lowercase-friendly, no filler.
- Frontmatter: `name`, one-line `description`, `disable-model-invocation: true` where the source has it. Drop Cursor UI fields (`icon`, `color`, `mode`, `reminder`).
- Use T3 tool names exactly: `delegate_task`, `task_status`, `task_cancel`, `watch_pull_request`, `link_pull_request`, `schedule_task`, `t3_thread_launch`, `t3_thread_read`, `t3_thread_search`, `preview_*`, `device_*`.
- Delegation briefs are self-contained. T3 child agents get only the brief, never the parent's context. Say this where pstack says "every brief stands alone".
- Never bullet a Cursor tool into a skill, even as a fallback.

## Tracking upstream

`main` is pstack with this adaptation applied; the `upstream` branch is pstack itself after
`sync/transform.ts`: Cursor packaging dropped, `poteto-*` and `setup-pstack` renamed. The
adaptation is the difference between the two, so edit prose only on `main` and never by hand
on `upstream`.

The **Sync upstream pstack** workflow (daily, or Run workflow) mirrors new upstream commits
onto `upstream` and merges it into `main`. A clean merge that passes `node sync/validate.ts`
is pushed to `main`. Otherwise it opens a `sync/pstack-<rev>` pull request with the conflicts
and validation problems: resolve them by this guide, check with `node sync/validate.ts`, and
merge with a merge commit so `upstream` stays an ancestor of `main`.

Mechanical changes (a rename, a newly excluded upstream path) belong in `sync/config.json`,
not in a hand edit, so every later sync repeats them.

Text the fork owns outright, how roles pick models, is a `rewrites` entry in `sync/config.json`
with its replacement inline or in `sync/rewrites/`. The transform writes it into `upstream` in its
final form, so `upstream` and `main` agree there and an upstream edit to it never conflicts. To
change that text, edit the rewrite and the matching text on `main` together. A rewrite whose
pattern stops matching leaves a marker that `node sync/validate.ts` rejects, so the sync opens a
pull request; fix the pattern, not the generated text. A rewrite next to a hand-adapted line
must cover that line too, or the two conflict on the next merge.

## Layout

- `skills/<name>/SKILL.md` is a skill. `skills/principle-*/SKILL.md` are the short principles.
- `skills/p3-mode/SKILL.md` is the mode router; its playbooks live in `skills/p3-mode/playbooks/`.
- `agents/` holds prompt briefs for delegated roles (`p3-agent.md`, `comment-sicko.md`), not harness agent definitions.

## T3 tool quick reference

- Delegation: `delegate_task`, `task_status`, `task_cancel`, `orchestrator_capabilities`
- Threads: `t3_thread_launch`, `create_threads`, `t3_thread_list`, `t3_thread_read`, `t3_thread_search`, `t3_thread_send`, `t3_thread_wait`, `t3_thread_fork`, `t3_thread_merge_back`, `t3_thread_interrupt`, `t3_thread_organize`, `t3_thread_update`, `t3_thread_configure`
- Worktrees: `t3_worktree_status`, `t3_worktree_list`, `t3_worktree_handoff`
- Pull requests: `link_pull_request`, `list_thread_pull_requests`, `watch_pull_request`, `unwatch_pull_request`, `unlink_pull_request`
- Schedules: `schedule_task`, `list_scheduled_tasks`, `update_scheduled_task`, `delete_scheduled_task`, `run_scheduled_task_now`
- Queue: `t3_queue_list`, `t3_queue_read`, `t3_queue_edit`, `t3_queue_reorder`, `t3_queue_cancel`, `t3_queue_promote_to_steer`
- Preview: `preview_open`, `preview_navigate`, `preview_snapshot`, `preview_act`, `preview_wait_for`, `preview_status`, `preview_resize`, `preview_set_appearance`, `preview_recording_start`, `preview_recording_stop`, `t3_preview_list`, `t3_preview_close`
- Devices: `device_list`, `device_open`, `device_screenshot`, `device_close`
- Pending requests: `t3_pending_request_list`, `t3_pending_request_read`, `t3_pending_request_respond`

## Definition of done for a skill

1. Every step names a T3 mechanism or a vendor-neutral habit. `node sync/validate.ts` checks the mechanical part (Cursor names and paths, model slugs, a separate model list, Cursor-only or `model` frontmatter, missing references, rewrites that no longer match); read for the rest.
2. It is shorter than the pstack source unless the T3 rewrite genuinely needs the lines.
3. Frontmatter matches the rules above, and references to other skills resolve to files in this repo.
