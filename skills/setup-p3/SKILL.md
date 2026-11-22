---
name: setup-p3
description: Configure which models pstack-t3 uses per role and at what reasoning budget. Detects your available models and writes p3-models.md, which overrides the skill defaults. Use for /setup-p3, "configure p3 models", "p3 budget", or changing pstack-t3's model choices.
---

# Setup p3

Write `p3-models.md`, a file that sets pstack-t3's model per role. Default location is the current project root. Offer `~/.agents/p3-models.md` as the global option, and ask which one. A project file wins over the global one.

## Steps

### 1. Detect available models

Call `orchestrator_capabilities`. It lists the providers and models you can pass to `delegate_task` in this session, with each one's provider instance ID and reasoning options. That is the dependable source. If it returns nothing, ask the user which providers and models they have. Never write a model you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected models.

### 2. Load current state

The roles are the labels shown in step 5. If `p3-models.md` already exists at the chosen location, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from the defaults in step 3(b). A line whose role is not in step 5, such as `hardest tasks`, `architect runners`, `reflect tooling`, or `why investigators`, is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Ask plainly in the thread. Offer these three options with these exact labels, and name the current budget when the file records one. With no file, say that `large` matches the skill defaults.

- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Build the working table. On a fresh run, give the code roles (`feature, refactoring`, `bug-fix`, `perf-issue`, `hillclimb`) and `judgment and prose` the most capable coding model detected, and `swarm workers` a fast strong one. Fill each panel role (`arena runners`, `interrogate reviewers`) with one entry per distinct provider detected, up to three, and `arena cross-judge pool` with one entry from each provider in order of preference. On a re-run, keep any role the user changed, by model, list, or alias.

Each role has a target effort: `xhigh` for the code roles and `judgment and prose`, `high` for panel entries and `swarm workers`, moved by the budget. `large` keeps it, `medium` lowers it one step, and `small` lowers it two steps, on the ladder `xhigh` > `high` > `medium` > `low`. No role runs above `xhigh`, and a target at the bottom of the ladder stays there. Set each real entry's effort option to its role's target. If the model does not expose the target, use the highest option at or below it, else mark the role as needing a choice. When the catalog exposes no reasoning options for a model, record the entry without an effort. `inherit-parent` and `auto` do not change.

**(c) Show the roles and confirm.** Show every role with its model, marking any entry not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles, offering the detected models at `xhigh` or below plus `inherit-parent` and `auto` (both mean: this role runs on the parent thread's model, so `delegate_task` leaves `target` unset) as the options. For panel roles (arena runners, interrogate reviewers) the value is a list, and one `delegate_task` runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena runs one judge. It tries only values from a vendor other than the parent's, in list order, so order it by preference. Fable and the other Claude models are one vendor. An `inherit-parent` or `auto` value never judges. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real entry written must be in the `orchestrator_capabilities` result, under the provider instance it came from, and at `xhigh` or below. `inherit-parent` and `auto` always pass. If a chosen entry is not available, stop and ask again.

### 5. Write the file

Write `p3-models.md` with a `# budget` line with the chosen label and the effort that label names, and one line per role, using the same labels p3-mode uses. Write each entry as `<providerInstanceId>/<model>`, followed by its effort option in parentheses when step 3(b) set one. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# pstack-t3 model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent thread's model (leave the delegate_task target unset). Alias entries in a panel list still count toward its fan-out.
# budget: large (xhigh)
feature, refactoring: <providerInstanceId>/<model> (<effort>)
bug-fix: <providerInstanceId>/<model> (<effort>)
perf-issue: <providerInstanceId>/<model> (<effort>)
hillclimb: <providerInstanceId>/<model> (<effort>)
judgment and prose: <providerInstanceId>/<model> (<effort>)
arena runners: <entry>, <entry>, <entry>
arena cross-judge pool: <entry>, <entry>
swarm workers: <providerInstanceId>/<model> (<effort>)
interrogate reviewers: <entry>, <entry>, <entry>
```

### 6. Confirm

Tell the user the file was written, where, and that it applies to new sessions. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill`. On no, move on without pushing.
