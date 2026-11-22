---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
disable-model-invocation: true
---

# How

<<<<<<< HEAD
Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn below is a `delegate_task` with a self-contained brief; the child gets only the brief, never this conversation. Each brief says it is read-only: inspect only, no writes, no git commands. Resolve each role's model from `p3-models.md` via `orchestrator_capabilities`. Never hardcode a slug. If the role line is missing, run `setup-p3` or use the parent's model.

## Step 1. Assess Complexity
=======
Explore the codebase to answer "how does X work?" questions.
>>>>>>> 4ea790851ec55cbb908ce22ea8247eb3428bc472

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

## 1. Explain

Spawn one Task subagent with `subagent_type: generalPurpose` and `readonly: true` that explores and explains in one pass. Give it the user's question and this brief:

> You are writing an architectural explanation for a senior engineer. Explore the codebase and write an explanation that a senior engineer unfamiliar with this area could read and walk away with a solid mental model. They should understand the architecture well enough to start working in it confidently. You have read-only access to the codebase.

<<<<<<< HEAD
Decompose the question into 2 to 4 exploration angles, each a distinct slice of the subsystem. Spawn all explorers in a single message, model from the `how explorer` role.

Each explorer's brief is `references/explorer-prompt.md` with its angle filled in. When every completion has woken you,  go to Step 3.

## Step 2b. Direct Explain (simple questions)

Spawn one `delegate_task` that explores and explains in one pass, model from the `how explainer` role.

Build its brief from `references/explainer-prompt.md` without the explorer-findings section. Go to Step 4.

## Step 3. Synthesize (complex questions only)

Once all explorers have returned, spawn one `delegate_task` to synthesize their findings into one explanation, model from the `how explainer` role.

Build its brief from `references/explainer-prompt.md` with every explorer's findings filled in.

## Step 4. Present

Present the explainer's output to the user. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.

## Output Format

The explanation uses the sections defined in `references/explainer-prompt.md`, dropping any that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
=======
## 2. Present

Present the subagent's output. Light edits for clarity or context from the conversation are fine. Do not substantially rewrite it.
>>>>>>> 4ea790851ec55cbb908ce22ea8247eb3428bc472
