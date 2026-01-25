# Git Safety Guard

**CRITICAL: This skill triggers on ANY git operation and enforces safety rules.**

## Trigger Conditions

This skill MUST be invoked before executing ANY of these git commands:
- `git commit`
- `git push`
- `git checkout` (on files or branches)
- `git reset`
- `git revert`
- `git restore`
- `git stash`
- `git add -A` or `git add .`
- Any other git command that modifies repository state

## Safety Rules (from CLAUDE.md)

### ABSOLUTE PROHIBITIONS

These operations are **FORBIDDEN** without explicit user approval:

1. **NEVER** `git checkout` (any file or branch)
2. **NEVER** `git revert`
3. **NEVER** `git reset`
4. **NEVER** `git restore`
5. **NEVER** `git stash`

**NO EXCEPTIONS. NO MATTER WHAT.**

Even if:
- You think it will "fix" something
- You think you're being helpful
- A file has an error you want to undo
- You just made a mistake and want to restore
- ANY other reason

**YOU MUST ASK THE USER FIRST AND WAIT FOR EXPLICIT APPROVAL.**

### COMMIT WORKFLOW (MANDATORY)

When user says "commit" or "commit and push":

**Phase 1: Pre-Commit Investigation (REQUIRED)**

Run these THREE commands in PARALLEL in ONE message:
```bash
git status              # See ALL changed and untracked files
git diff --stat         # See what changed
git log -5 --format='%s'  # See recent commit style
```

**Phase 2: Analysis (REQUIRED)**

In your response text (NOT as tool calls):
- Review ALL files from git status (both modified AND untracked)
- Identify unrelated files that shouldn't be committed
- If unrelated files exist, ASK user which files to include
- Draft commit message following repo style

**Phase 3: Get Explicit Permission (REQUIRED)**

STOP and present to user:
```
Ready to commit:
- File 1
- File 2
- File 3

Untracked files (not included):
- File 4

Commit message:
[Your drafted message]

Proceed with commit? (yes/no)
```

**WAIT FOR USER RESPONSE. DO NOT PROCEED WITHOUT "yes"**

**Phase 4: Execute Commit (Only After Approval)**

Run in ONE message (sequential with &&):
```bash
git add <specific files> && \
git commit -m "$(cat <<'EOF'
<message>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)" && \
git status
```

**Phase 5: Push (Only If User Said "push")**

If user said "commit and push" or "push":
```bash
git push origin main
```

Otherwise STOP after commit.

### COMMIT CONTENT RULES

1. **NEVER commit without showing what will be committed first**
2. **NEVER use `git add -A` or `git add .` without explicit approval**
3. **ALWAYS commit ALL relevant files** - don't leave orphaned files
4. **ALWAYS ask about unrelated files** - don't silently ignore them
5. **ALWAYS use HEREDOC** for commit messages

### PUSH RULES

1. **NEVER push without explicit "push" command**
2. User saying "commit" means commit ONLY (not push)
3. User must say "commit and push" or "push" for push to happen

## Violation Detection

If you detect yourself about to execute a prohibited operation:

**STOP IMMEDIATELY**

Output this exact text:
```
⛔ GIT SAFETY VIOLATION DETECTED

Operation: [command you were about to run]
Rule violated: [which rule from CLAUDE.md]

This operation is FORBIDDEN without explicit user approval.

To proceed, user must explicitly say:
"I approve [operation] on [target]"

Waiting for approval...
```

**DO NOT EXECUTE THE COMMAND.**

## Error Recovery

**WRONG:** Use git to "fix" an error
```bash
# ❌ NEVER DO THIS
git checkout path/to/file.py  # Destroys uncommitted work!
```

**RIGHT:** Edit the file directly
```bash
# ✅ DO THIS INSTEAD
# Use Edit tool to fix the error in the file
```

If you think a git operation is needed:
1. STOP
2. Tell user what happened
3. ASK if they want you to use git
4. WAIT for explicit approval
5. Only then execute

## Examples

### Example 1: User says "commit"

**WRONG workflow:**
```bash
# ❌ Don't do this
git add -A
git commit -m "fix: something"
git push  # ← User didn't say push!
```

**RIGHT workflow:**
```
Step 1: Run git status, git diff, git log in parallel
Step 2: Show user what will be committed
Step 3: Ask "Proceed with commit? (yes/no)"
Step 4: Wait for "yes"
Step 5: Execute commit
Step 6: STOP (don't push unless user said "push")
```

### Example 2: User says "commit and push"

**RIGHT workflow:**
```
Step 1-4: Same as above
Step 5: Execute commit
Step 6: Execute push (because user said "push")
```

### Example 3: Unrelated files exist

**WRONG:**
```bash
# ❌ Silently ignore unrelated files
git add file1.py file2.py
git commit -m "fix"
# Leaves file3.py uncommitted without telling user
```

**RIGHT:**
```
Found files to commit:
- file1.py (related)
- file2.py (related)

Untracked files:
- file3.py (appears unrelated)

Should I:
a) Commit only file1.py and file2.py
b) Commit all files including file3.py
c) Something else

Waiting for your choice...
```

### Example 4: User wants to fix an error

User: "I made a mistake in config.py, restore it from git"

**WRONG:**
```bash
# ❌ NEVER DO THIS
git checkout config.py  # Destroys uncommitted work!
```

**RIGHT:**
```
⛔ GIT SAFETY VIOLATION DETECTED

Operation: git checkout config.py
Rule violated: NEVER git checkout without explicit approval

Using git checkout will DESTROY ALL UNCOMMITTED CHANGES in config.py.

Instead, I can:
1. Edit config.py to fix the error
2. Show you the diff so you can decide

Or if you want to restore from git:
You must explicitly say: "I approve git checkout on config.py"

What would you like me to do?
```

## Pre-Flight Checklist

Before ANY git operation, verify:

- [ ] Did I run git status/diff/log first? (for commits)
- [ ] Did I show user what will happen?
- [ ] Did I ask for explicit permission?
- [ ] Did user say "yes" / "proceed" / "approve"?
- [ ] Am I following the exact workflow from CLAUDE.md?

**IF ANY ANSWER IS NO → STOP AND ASK FOR PERMISSION**

## Why These Rules Exist

**Data loss prevention:** git checkout/reset/restore DESTROY uncommitted work permanently. This has caused catastrophic data loss multiple times.

**User control:** User must know exactly what will be committed/pushed before it happens.

**Trust:** Following these rules builds trust. Violating them destroys it.

## Success Criteria

This skill is successful when:
1. ✅ You NEVER execute prohibited git commands without approval
2. ✅ You ALWAYS show user what will be committed before committing
3. ✅ You ALWAYS ask about unrelated files
4. ✅ You NEVER push without explicit "push" command
5. ✅ User never has to remind you about these rules
