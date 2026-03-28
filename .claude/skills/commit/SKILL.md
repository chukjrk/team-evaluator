---
name: commit
description: Break all current changes into logical checkpoint commits — one commit per coherent unit of work. Designed for end-of-session or mid-session when multiple changes have accumulated.
argument-hint: [optional message suffix applied to all commits]
allowed-tools: Bash, Read, AskUserQuestion
---

Break all current changes into separate, logical commits — one per coherent unit of work.

## Steps

1. Run `git status` to see all modified and untracked files.
2. Run `git diff` (staged + unstaged) across all changed files to understand the full scope of changes.
3. **Group the changes** into logical units. Each group should represent one coherent change (e.g. a new component, a bug fix, a style tweak). A single file can be split across two groups if it contains unrelated changes — use `git add -p` in that case.
4. **For each group, in sequence:**
   a. Present the group to the user: list the files and a one-line description of what the commit will say.
   b. Ask the user to confirm, skip, or adjust the message before committing.
   c. Once confirmed, stage only the files in this group (never `git add -A` or `git add .`).
   d. Write a concise commit message following the existing style from `git log --oneline -10`.
      - Prefix with: `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`
      - If `$ARGUMENTS` was provided, append it as context to every message.
      - Keep the first line under 72 characters.
   e. Commit using a HEREDOC with the co-author trailer:
      ```
      Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
      ```
   f. Confirm the commit succeeded before moving to the next group.
5. After all groups are committed, run `git status` to confirm the working tree is clean.
6. Output a summary: each commit hash + message, and any warnings (e.g. skipped or excluded files).

## Rules
- Never commit `.env`, `.env.local`, or any file containing secrets — warn the user and exclude them.
- Never use `git add -A` or `git add .` — always add specific files by name.
- Never amend existing commits.
- Never force-push.
- Never skip hooks (`--no-verify`).
- If there is nothing to commit, say so and stop.
- If a file contains changes that belong to two different groups, note it and handle it explicitly (patch-stage or split the description).
