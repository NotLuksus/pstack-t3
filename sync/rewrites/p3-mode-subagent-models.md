**Defaults for every `delegate_task` call.** Async is the default: end the turn, and each completion wakes you; read it with `task_status`, stop it with `task_cancel`, and never poll a running task. Full tool access, file pointers not inlined context, and an explicit model per role, thread workers included. T3 child agents get only the brief, never the parent's context, so every brief stands alone. Each code playbook uses its own role (`feature, refactoring`, `bug-fix`, `perf-issue`, or `hillclimb`), prose and judgment use `judgment and prose`, and trivial mechanical edits use `swarm workers`. A worker that writes beside others gets `isolation: "worktree"`; use `t3_thread_launch` only when it needs its own top-level thread. One writer per worktree.

**Roles are minimum scores on the model table in your instructions.** The AGENTS.md or CLAUDE.md your harness loads has a Models and delegation section: a table of models with Cost (higher is cheaper), Intelligence and Taste scores, and the rules for choosing among them. It is already in your context. pstack-t3 keeps no model list of its own, so never name a model in a brief or a file. One line per role:

- `feature, refactoring`: taste ≥ 7.
- `bug-fix`: taste ≥ 7, intelligence ≥ 8.
- `perf-issue`: taste ≥ 7, intelligence ≥ 8.
- `hillclimb`: taste ≥ 7, intelligence ≥ 8. It runs long and on its own.
- `judgment and prose`: taste ≥ 8, intelligence ≥ 9.
- `swarm workers`: taste ≥ 7. Read-only grunt work (triage, log and CI reading, inventories) follows the table's grunt-work rule instead.
- `arena runners`: taste ≥ 8. One seat per distinct model, up to three, spread across providers.
- `arena cross-judge pool`: taste ≥ 8, intelligence ≥ 9, from a vendor other than the parent's.
- `interrogate reviewers`: taste ≥ 8, intelligence ≥ 9. One seat per distinct model, up to three, spread across providers.

Resolve a role when you call `delegate_task`: take the table's models that meet its minimums, pick the provider by the table's rules, then the cheapest of those that `orchestrator_capabilities` offers. When your instructions set a stricter minimum for the job (a final review, a consequential architecture decision), it wins. If no available listed model meets a role's minimums, use the strongest available listed one and say so. With no model table in your instructions, leave `target` unset so the role runs on the parent model, and say so once per thread.

**Escalate on results, not difficulty.** When two runs of the same brief fail its check, move the next run to a model with higher intelligence. Say which.

**Match the reasoning level to the job.** The code roles and `judgment and prose` start at `xhigh`; panel seats and `swarm workers` start at `high`. Raise one step, up to xhigh, for the hardest or subtlest work, lower one step for judgment, and two or more steps for routine work. No role runs above xhigh. If the model lacks that level, use the highest one below it. Running checks and gathering proof uses the `swarm workers` role, but confirming a candidate before it becomes a blocking finding takes your instructions' verifier minimums (intelligence ≥ 9, taste ≥ 8). If `delegate_task` rejects a model, never pass it again: take the next model that meets the role's minimums, else leave `target` unset. Say so.
