# Global Claude Instructions

---
## ⛔️ ABSOLUTE BAN: `git checkout` IS FORBIDDEN ⛔️
---

**I AM BANNED FROM RUNNING `git checkout`. THIS IS A HARD BLOCK.**

```
█████████████████████████████████████████████████████████████
█  STOP! DO NOT RUN: git checkout                           █
█  THIS COMMAND IS GLOBALLY BANNED. NO EXCEPTIONS.          █
█████████████████████████████████████████████████████████████
```

**BEFORE typing `git checkout`, I MUST:**
1. STOP immediately
2. Remember: THIS COMMAND IS BANNED
3. Use Edit tool to fix files instead
4. ASK the user if they want to restore from git

**There is NO scenario where I run `git checkout` without explicit user approval.**
**Not to switch branches. Not to restore files. Not for any reason.**

---

## CRITICAL: Planning and Approval Workflow - MANDATORY

**RULE 1: ALWAYS CREATE A PLAN FIRST**

Before starting ANY non-trivial task:
1. Read ALL relevant documentation
2. Analyze the problem thoroughly
3. Create a detailed plan (use Write tool to create a plan document)
4. **IMMEDIATELY STOP** - Do not proceed to implementation
5. **REPORT to user**: "Plan created at [file path]. Ready to execute when you approve."
6. **WAIT FOR EXPLICIT PERMISSION** - Do not execute until user says "execute", "implement", "proceed with the plan", or "start"

**CRITICAL**: The instruction "continue" or "continue with the task" is **NOT** permission to execute.
- "Continue" means "resume from where you were"
- If you just finished planning, "continue" means: report completion and STOP
- If you just finished planning, you must ASK: "Plan is complete. Should I execute it?"

### What is NOT Permission to Execute a Plan

These instructions are **NOT permission to execute a plan you just created**:
- "continue"
- "continue the conversation"
- "continue with the task"
- "keep going"
- "proceed" (without specifying WHAT to proceed with)
- "what's next?"
- "Please continue the conversation from where we left it off"

**If you just finished creating a plan**, these instructions mean:
- Report that the plan is complete
- Summarize what the plan contains
- ASK if the user wants you to execute it
- WAIT for explicit permission

**ONLY these exact phrases give permission to execute a plan:**
- "execute the plan"
- "implement the plan"
- "proceed with [specific phase/task from plan]"
- "start implementing"
- "do it"
- "go ahead"
- "yes, execute"

### Execution Checklist - USE THIS BEFORE EXECUTING ANY PLAN

Before executing any plan, verify ALL of these:

□ Did I create a detailed plan document? (YES/NO)
□ Did I report to the user that the plan is complete? (YES/NO)
□ Did I explicitly ask for permission to execute? (YES/NO)
□ Did the user give EXPLICIT permission using words like "execute", "implement", "proceed with the plan", "do it"? (YES/NO)

**IF ANY ANSWER IS NO → STOP AND ASK FOR PERMISSION**

### Examples of Correct Workflow

❌ **WRONG:**
- User: "continue" → I start executing the plan immediately

✅ **RIGHT:**
- User: "continue" → I say: "Plan is complete at E2E_TEST_FAILURE_ANALYSIS.md. Should I execute Phase 1 fixes?"

❌ **WRONG:**
- User: "keep going" → I start implementing fixes

✅ **RIGHT:**
- User: "keep going" → I say: "The analysis is done. Ready to implement the 8 fixes from Phase 1 when you approve."

❌ **WRONG:**
- User: "what's next?" → I start coding

✅ **RIGHT:**
- User: "what's next?" → I say: "Next step is executing the fixes in Phase 1. Shall I proceed?"

❌ **WRONG:**
- User: "Please continue the conversation from where we left it off" → I execute the plan

✅ **RIGHT:**
- User: "Please continue the conversation from where we left it off" → I review what was done, report plan is complete, and ASK for permission to execute

**RULE 2: ALWAYS COMMIT AFTER COMPLETING AN OPERATION**

**ALWAYS create a git commit after completing any file operation:**
- Commit after making changes to save work
- Commit at logical stopping points
- Commit to preserve progress
- This protects against accidental data loss

**After ANY file edit/write operation, IMMEDIATELY:**
1. Run `git status` to see all changes
2. Stage all relevant files
3. Create a commit with a descriptive message
4. Report to the user what was committed

### Why this rule exists:

Uncommitted work can be lost if something goes wrong. Frequent commits create restore points and protect against data loss. The user can always squash commits later if needed.

**RULE 3: COMMIT ALL FILES - LEAVE NOTHING BEHIND**

When committing:
1. Use `git status` to see ALL changed and untracked files
2. **Review the COMPLETE list** of files that need committing
3. Add ALL relevant files (don't leave orphaned files behind)
4. Create comprehensive commit message covering all changes

**NEVER leave partially-completed work uncommitted.**

### COMMIT WORKFLOW

```bash
# Run in a SINGLE message:
git status && git add <files> && git commit -m "$(cat <<'EOF'
<message>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" && git status
```

**Do NOT push unless user explicitly says "push".**

---

## CRITICAL: Git Operations - ABSOLUTE PROHIBITION

**NEVER, UNDER ANY CIRCUMSTANCES, use the following git commands without EXPLICIT user approval:**
- `git checkout` (on any file or branch)
- `git revert`
- `git reset`
- `git restore`
- `git stash`

**THIS IS NON-NEGOTIABLE. THERE ARE NO EXCEPTIONS.**

Even if:
- You think it will "fix" something
- You think you're being helpful
- The file has an error you want to undo
- You just made a mistake and want to restore the previous version
- ANY other reason

**YOU MUST ASK THE USER FIRST AND WAIT FOR EXPLICIT APPROVAL.**

### What to do instead:

1. **To fix an error:** Edit the file directly using the Edit tool
2. **To undo your own changes:** Tell the user what happened and ASK if they want you to restore from git
3. **To restore a file:** ASK THE USER FIRST, explain what will be lost

### Why this rule exists:

Using git to "fix" errors **DESTROYS ALL UNCOMMITTED WORK** in that file. This has caused **CATASTROPHIC DATA LOSS** multiple times, wiping out hours of work.

**VIOLATION OF THIS RULE IS UNACCEPTABLE.**

---

## E2E Testing Protocol

**ALWAYS run E2E tests through the Makefile in the project root, NEVER run pytest directly.**

### Correct Way to Run E2E Tests:

```bash
# Run all E2E tests against GKE London
make test TYPE=e2e CLUSTER=gke-london

# Run a specific notebook
make test TYPE=e2e CLUSTER=gke-london NOTEBOOK=03_managing_resources

# Run with multiple workers (parallel)
make test TYPE=e2e CLUSTER=gke-london WORKERS=2
```

### Available Clusters:

| Cluster | Description |
|---------|-------------|
| `gke-london` | GKE production (https://api.hsbc.sparklingideas.co.uk) |
| `orbstack` | Local k3d cluster |

### WRONG ❌

```bash
pytest tests/e2e/tests/test_notebook_execution.py -v
```

This **bypasses validation** and tests will run against **old deployments**.

### Results Will Be Misleading:

- Tests fail on bugs you just fixed (old code still deployed)
- Tests pass on bugs you just introduced (old code doesn't have them yet)
- Completely wastes time debugging non-existent issues
