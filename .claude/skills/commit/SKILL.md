---
name: commit
description: Stage and commit all current changes as an incremental checkpoint commit. Use after completing a discrete unit of work — a new feature, bug fix, refactor, or any meaningful change — rather than waiting until end of session.
argument-hint: [optional message suffix]
allowed-tools: Bash, Read
---

Create an incremental checkpoint commit for all current changes.

## Steps

1. Run `git status` to see what has changed.
2. Run `git diff` (staged + unstaged) to understand the nature of the changes.
3. Stage only relevant modified/new files — never commit `.env`, `.env.local`, or secret files. If you spot any, warn the user and exclude them.
4. Write a concise commit message (1 sentence) that describes *what changed and why*, following the existing commit style in `git log --oneline -10`.
   - If `$ARGUMENTS` was provided, append it as context to the message.
   - Prefix with a type: `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:` as appropriate.
5. Commit using a HEREDOC so formatting is preserved, with the co-author trailer:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
6. Run `git status` to confirm the working tree is clean.
7. Output only: the commit hash + message, and any warnings (e.g. skipped files).

## Rules
- Never use `git add -A` or `git add .` blindly — add specific files by name.
- Never amend existing commits.
- Never force-push.
- Never skip hooks (`--no-verify`).
- If there is nothing to commit, say so and stop.
- Keep the message under 72 characters on the first line.
