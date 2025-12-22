# Global Claude Instructions

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
- "commit"
- "commit this"
- "commit these changes"
- "push"
- "push this"
- "git commit"
- "git push"

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
