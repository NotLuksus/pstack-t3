---
name: setup-p3
description: Check how pstack-t3 picks a model for each role. Roles are minimum scores on the model table in your agent instructions; this confirms the table is there and shows which model each role resolves to today. Use for /setup-p3, "configure p3 models", or changing pstack-t3's model choices.
---

# Setup p3

pstack-t3 keeps no model list of its own and this skill writes no file. Each role in the Subagents section of the **p3-mode** skill is a set of minimum scores, resolved against the model table in your agent instructions: the Models and delegation section of the AGENTS.md or CLAUDE.md your harness loads, with Cost, Intelligence and Taste scores per model and the rules for choosing among them. Model choices change there.

## Steps

### 1. Find the table

Look for the model table in your instructions. If it is missing, tell the user that every role runs on the parent model until their instructions carry one, show this shape, and skip to step 4.

```
| Model   | Cost | Intelligence | Taste |
| ------- | ---: | -----------: | ----: |
| <model> | 1-10 |         1-10 |  1-10 |
```

A higher cost score means cheaper. Intelligence measures autonomous problem-solving; taste covers UI, code, API design and copy.

### 2. Detect available models

Call `orchestrator_capabilities`. It lists the providers and models you can pass to `delegate_task` in this session. Match each table row to an entry. A row with no entry is not available here.

### 3. Show the roles

Show each role from the p3-mode Subagents section with its minimum scores and the model it resolves to today by the table's rules, and mark any role no available model meets. Say that the pick follows provider headroom, so it can differ between threads. To change a pick, the user edits the scores or rules in their instructions.

### 4. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.

### 5. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill`. On no, move on without pushing.
