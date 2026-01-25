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

**RULE 2: NEVER COMMIT WITHOUT EXPLICIT APPROVAL**

**NEVER use `git commit` or `git push` without EXPLICIT user order or approval:**
- Do NOT commit after making changes "to save work"
- Do NOT commit because "it seems like a good stopping point"
- Do NOT commit to "clean up" or "organize" work
- Do NOT commit even if you think it's what the user wants

**YOU MUST WAIT FOR THE USER TO EXPLICITLY SAY: "commit" or "commit this" or "push this"**

### CRITICAL: What is NOT Permission to Commit

These commands are **FILE OPERATIONS ONLY** - they do NOT include permission to commit:
- "update X" - means Edit the file, then STOP
- "fix X" - means Edit the file, then STOP
- "change X" - means Edit the file, then STOP
- "modify X" - means Edit the file, then STOP
- "add X to Y" - means Edit the file, then STOP
- "create X" - means Write the file, then STOP
- "delete X from Y" - means Edit the file, then STOP

**ONLY these exact words give permission to commit:**
- "commit" (means: commit ALL changed and new files)
- "commit this"
- "commit these changes"
- "push" (means: commit ALL files, then push)
- "push this"
- "git commit"
- "git push"

**CRITICAL: "commit" by itself means commit EVERYTHING. You do NOT need the user to say "commit everything".**

**If the user says "update gitignore":**
1. ✅ Update the .gitignore file
2. ✅ Show what you changed
3. ❌ DO NOT commit
4. ⏸️ WAIT for user to say "commit"

**If the user says "update gitignore and commit":**
1. ✅ Update the .gitignore file
2. ✅ Commit it
3. ⏸️ WAIT for user to say "push" (do NOT auto-push)

### What to do instead:

1. Make your changes using Edit/Write tools
2. **STOP and tell the user what you changed**
3. **WAIT for the user to say "commit"**
4. Only then: create the commit

**RULE 3: COMMIT ALL FILES - LEAVE NOTHING BEHIND**

When the user DOES give explicit permission to commit:
1. Use `git status` to see ALL changed and untracked files
2. **Review the COMPLETE list** of files that need committing
3. Add ALL relevant files (don't leave orphaned files behind)
4. If files are unrelated to the commit, ask the user which files to include
5. Create comprehensive commit message covering all changes

**NEVER leave partially-completed work uncommitted if the user asked you to commit.**

### MANDATORY COMMIT WORKFLOW CHECKLIST

**STOP! Before running ANY git commands, verify you will follow this EXACT workflow:**

**Phase 1: Investigation (ONE message with parallel commands)**
```bash
# Run these THREE commands in PARALLEL in a SINGLE message:
git status              # See ALL changed and untracked files
git diff --stat         # See what changed
git log -5 --format='%s'  # See recent commit style
```

**Phase 2: Analysis (in message text, NOT as tool calls)**
- Review ALL files from git status (both modified AND untracked)
- If there are untracked files, decide:
  - Include them if related to the change
  - ASK user which files to include if multiple unrelated changes
- Draft commit message following repo style

**Phase 3: Commit (ONE message with sequential commands)**
```bash
# Run these commands in a SINGLE message (use && for sequencing):
git add <files>         # Add ALL relevant files (don't leave orphans)
git commit -m "$(cat <<'EOF'
<message>
🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
git status              # VERIFY commit succeeded (MUST run this!)
```

**Phase 4: Push (ONLY if user said "push")**
```bash
git push origin main    # Only if user explicitly said "push"
```

**CRITICAL VIOLATIONS TO AVOID:**
- ❌ Running git commands in separate messages (must be in ONE message)
- ❌ Skipping `git status` after commit
- ❌ Ignoring untracked files without asking user
- ❌ Not using HEREDOC for commit message
- ❌ Committing only some files when user said "everything"

**IF YOU VIOLATED ANY OF THESE, YOU FAILED THE COMMIT WORKFLOW.**

### What "commit" means (DEFAULT BEHAVIOR):

When user says "commit" (or "commit everything" or "push"):
- **ALWAYS run `git status` FIRST** and review EVERY file (modified + untracked)
- **DEFAULT: Commit ALL files unless there's a reason not to**
- Do NOT assume "commit" means "only the files I just edited"
- Include ALL files that are part of the current work
- If there are clearly unrelated files (e.g., different feature), ASK:
  - "I see untracked files [X, Y, Z]. Should I include these or commit only [current work files]?"
- **NEVER** silently ignore files then ask "any files left not committed?" - that proves you failed
- **NEVER** leave files behind without asking first

**Rule of thumb:** If you're unsure, include the files. Better to ask "should I exclude X?" than to silently ignore.

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

**ALWAYS run E2E tests through the Makefile, NEVER run pytest directly.**

### Correct Way to Run E2E Tests:

```bash
cd tools/local-dev && make test
```

### Why This Matters:

The Makefile validation script (`validate-test-freshness.sh`):
1. Detects uncommitted changes (marks SHA as `-dirty`)
2. Compares current code SHA vs deployed images
3. **Auto-rebuilds and redeploys** if code is stale
4. Ensures tests run against **latest code**, not old deployed images

### WRONG ❌

```bash
pytest tests/e2e/tests/test_notebook_execution.py -v
```

This **bypasses validation** and tests will run against **old k3d deployments** (6+ hours stale).

### Results Will Be Misleading:

- Tests fail on bugs you just fixed (old code still deployed)
- Tests pass on bugs you just introduced (old code doesn't have them yet)
- Completely wastes time debugging non-existent issues

### Verification:

After running tests, verify deployed SHA matches:

```bash
kubectl describe pod -n e2e-test -l app=control-plane | grep "Image:"
git rev-parse --short HEAD
```

They should match (or current SHA should have `-dirty` suffix if uncommitted changes).
