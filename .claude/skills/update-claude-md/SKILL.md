---
name: update-claude-md
description: Update CLAUDE.md after major architecture, infrastructure, or schema changes. Use this after adding new models, changing the scoring engine, restructuring routes, changing auth/middleware, swapping dependencies, or any other change that affects how future Claude instances understand the codebase.
argument-hint: [brief description of what changed]
allowed-tools: Read, Grep, Glob, Bash
---

# Update CLAUDE.md

A significant infrastructure or architecture change has been made. Your job is to audit CLAUDE.md and bring it up to date so future Claude Code instances have accurate guidance.

## What changed (user's hint)
$ARGUMENTS

## Step 1 — Gather context

Run these to understand what changed:

```
git diff main...HEAD --stat
git diff main...HEAD -- prisma/schema.prisma
git diff main...HEAD -- package.json
git diff main...HEAD -- src/proxy.ts
```

Then read the current CLAUDE.md in full:
- `CLAUDE.md`

## Step 2 — Audit each section against reality

Check the following areas for drift. Read the actual source files before editing anything.

### Dependencies & stack (`package.json`)
- Did any major packages change (auth provider, ORM, UI library, AI SDK)?
- Did the Next.js or React major version change?

### Database schema (`prisma/schema.prisma`)
- New models, removed models, renamed fields?
- New enums or relation changes?
- Does the schema description in CLAUDE.md still match?

### Prisma client setup (`src/lib/prisma.ts`, `prisma.config.ts`)
- Is the adapter pattern still the same?
- Any change to connection handling?

### Auth & middleware (`src/proxy.ts`)
- Did public routes change?
- Is the middleware filename/location still `src/proxy.ts`?

### Routing & API routes (`src/app/api/`)
- New route groups or route files added?
- Removed routes?
- Did the `await params` pattern change?
- Did auth enforcement change (per-route vs middleware)?

### Scoring engine (`src/lib/scoring/`)
- Did weights in `COMPOSITE_WEIGHTS` change?
- Did `computeTeamSkillScore` or `computeNetworkScore` algorithm change?
- Did the Claude model version or caching strategy change?
- Did the prompt structure change?

### Dashboard layout (`src/components/layout/`)
- New panels added or removed?
- Did the panel state management move?
- New data hooks or polling intervals?

### Key file paths
- Did any of the files listed in the "Key File Paths" section of memory move?

## Step 3 — Edit CLAUDE.md

Using the Edit tool, make the minimum necessary changes:
- Update only sections that have actually changed
- Keep all accurate content exactly as-is
- Do not add generic advice or obvious instructions
- Do not expand sections that didn't change just to "improve" them
- If the change introduces a new cross-cutting pattern (e.g., a new required header on all API calls, a new required config file), add a concise note under the most relevant section

## Step 4 — Update the auto-memory

After editing CLAUDE.md, also update the auto-memory file at:
`/Users/chukwuebukakemdirim/.claude/projects/-Users-chukwuebukakemdirim-Development-AI-Projects-founding-eval/memory/MEMORY.md`

Apply the same changes to any relevant sections there (Key File Paths, Stack, Design Decisions, Composite Score Formula, etc.).

## Step 5 — Report

Tell the user:
1. Which sections of CLAUDE.md you changed and why
2. Which sections you verified were still accurate (no change needed)
3. Anything you noticed that looked ambiguous or couldn't fully verify from source
