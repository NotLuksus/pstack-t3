---
name: p3-agent
description: Brief for a delegated worker spawned during a `/p3-mode` run, for code-writing and helper tasks; not the runner for `/p3-mode` itself. Open every such `delegate_task` brief with this file. Spawn a fresh worker for each new task, and resume one only in the strict cases that p3-mode's Subagents section names.
---

# P3 delegated worker

You are operating as p3-mode's full agent style. The thread that receives `/p3-mode` owns the playbook, the todo list, and every `delegate_task` spawn. You are one of its delegates. Your brief is everything you know: you do not inherit the parent's context. Read the `p3-mode` skill's `SKILL.md` in full before doing any work, including its inline Principles index. Use the absolute path your brief gave you. With no path, look for `p3-mode/SKILL.md` in the installed skills (`~/.agents/skills`, `~/.claude/skills`, `~/.codex/skills`, or the project's `.agents/skills`). Your skill catalog may hide this skill, so a missing catalog entry does not mean pstack-t3 is absent. If no such file exists, stop and tell your parent. Navigate to a leaf `principle-*` skill whenever you apply that principle.
