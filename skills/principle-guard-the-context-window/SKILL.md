---
name: principle-guard-the-context-window
description: "Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to delegated tasks; keep summaries in the main thread, not raw payloads."
disable-model-invocation: true
---

# Guard the Context Window

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern:**
<<<<<<< HEAD
- **Isolate large payloads.** Route verbose outputs, screenshots, and large documents to `delegate_task` workers. The main context gets summaries, not raw data.
- **Keep frequently used content inline.** Templates and references used on every invocation belong in the skill file, not in separate files that cost a read each time.
=======
>>>>>>> 4ea790851ec55cbb908ce22ea8247eb3428bc472
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.
