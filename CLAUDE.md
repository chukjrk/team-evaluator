# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run start      # Start production server

# Database (Prisma v7)
npx prisma migrate dev --name <name>   # Create and apply a migration
npx prisma migrate deploy              # Apply migrations in production
npx prisma studio                      # Open DB GUI
npx prisma generate                    # Regenerate client after schema changes
```

No lint or test scripts are configured in `package.json`. TypeScript is checked via `tsc --noEmit` if needed.

## Required Environment Variables

In `.env.local`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` — Clerk auth
- `ANTHROPIC_API_KEY` — Claude API
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth (required for Google Contacts import)
- `NEXT_PUBLIC_APP_URL` — full app origin (e.g. `http://localhost:3000`), used to build Google OAuth redirect URI

## Architecture

### Auth & Routing

- **Clerk** handles auth. `src/proxy.ts` (Next.js 16 middleware) protects all routes except `/sign-in`, `/sign-up`, `/join`, and `/api/webhooks`.
- User flow: sign up → `/onboarding` (create workspace) → `/profile` (fill cofounder data) → `/dashboard`.
- Invite flow: existing member generates a token-based invite URL (`/join?token=...`). The `inviteToken` field on `Workspace` is a CUID.
- Clerk webhook at `/api/webhooks/clerk` handles `user.deleted` by cascading-deleting `WorkspaceMember` records.

### Database (Prisma v7 + Neon)

**Critical**: Prisma v7 does not support a `url` field in `schema.prisma`. Connection is configured via `@prisma/adapter-pg` and passed directly to `PrismaClient`. See `src/lib/prisma.ts` for the singleton pattern.

Schema models: `Workspace` → `WorkspaceMember` → `CofounderProfile` → `NetworkEntry`. Ideas (`Idea`) belong to a workspace and a submitter. Scores (`IdeaScore`) are cached 1:1 with ideas. `CompanyIndustryCache` stores domain→industry classifications (domain as PK). `NetworkImportSession` stores in-progress import groups per member (expires in 1 hour, cleaned up on confirm or dismiss).

All members are equal — there is no owner/admin role distinction.

### Dashboard (Three-Panel Layout)

`AppShell` (`src/components/layout/AppShell.tsx`) is a client component that renders three resizable panels:

- **LeftPanel** — team members and workspace info
- **CenterPanel** — idea list with filtering; selecting an idea updates `selectedIdeaId`
- **RightPanel** — idea detail and evaluation results for the selected idea

Panels are drag-resizable with min/max constraints. State is managed locally in `AppShell` with SWR (`useIdeas` hook) for idea data. SWR polls every 15 seconds.

### Scoring Engine

Located in `src/lib/scoring/`. `computeFullScore` orchestrates:

1. **TeamSkill** (`team-skill.ts`) — deterministic. Scores skill coverage across three weighted categories (technical 40%, business 35%, domain 25%) plus a complementarity bonus for non-overlapping skills.

2. **Network** (`network.ts`) — deterministic. Strength-weighted contact count (log scale) blended 60% size + 40% industry relevance.

3. **Claude AI** (`claude.ts`) — calls `claude-sonnet-4-6` via `client.beta.promptCaching.messages.create`. Team context is sent as a cached content block (ephemeral, 5-min TTL); the idea payload is uncached. Returns `ideaQualityScore`, `teamIdeaFitScore`, `timeToFirstCustomer`, `narrative`, and detailed `reasoning`.

Composite formula: `0.25 × TeamSkill + 0.20 × Network + 0.30 × IdeaQuality + 0.25 × TeamIdeaFit`

Scores are persisted to `IdeaScore` via upsert and regenerated on demand. Only the idea submitter can trigger evaluation (`POST /api/ideas/[id]/score`).

### API Routes (Next.js 16)

All route handlers use `params: Promise<{ id: string }>` — must `await params` before accessing fields.

Key routes:
- `POST /api/workspace` — create workspace
- `GET/POST /api/ideas` — list/create ideas
- `POST /api/ideas/[id]/score` — trigger AI evaluation (submitter only)
- `PUT /api/ideas/[id]` — update idea
- `DELETE /api/ideas/[id]` — delete idea
- `PATCH /api/ideas/[id]/visibility` — toggle visibility
- `GET/POST /api/profile` — cofounder profile
- `GET/POST /api/network` — network entries
- `DELETE /api/network/[id]` — remove network entry
- `GET /api/network/google/auth` — start Google OAuth flow (returns `{ url }` for client-side redirect)
- `GET /api/network/google/callback` — OAuth callback; fetches contacts, classifies, writes `NetworkImportSession`, redirects to `/profile?google-import=<id>`
- `GET/DELETE /api/network/import/session` — fetch or delete current unexpired import session
- `POST /api/network/import/confirm` — bulk-create NetworkEntry records from confirmed groups, deletes session
- `POST /api/network/import/linkedin` — accepts `{ rows: [{company, position}] }`, returns classified `CategorizedGroup[]` (preview only; client calls confirm to save)
- `GET /api/members` — workspace member list

### Constants & Types

- `src/lib/constants/skills.ts` — `SKILLS_TAXONOMY` with three categories and a `SkillKey` union type. Skills are stored as `string[]` in DB; `SkillKey` is enforced only at input boundaries.
- `src/lib/constants/industries.ts` — industry keys used across ideas and network entries.
- `src/lib/types/` — `IdeaData` (idea + score), `MemberWithProfile`, `ScoreResult`, `AIScoreResult`, `CategorizedGroup` (import groups).
- `src/lib/contacts/domains.ts` — `PERSONAL_DOMAINS` set, `extractDomain`, `domainToCompanyName` utilities.
- `src/lib/contacts/classify.ts` — `classifyCompanyDomains` (domain→industry via cache+Haiku), `classifyContactGroups` (company+position→`CategorizedGroup[]` via Haiku). Both use `claude-haiku-4-5-20251001`.

### UI Components

shadcn/ui components live in `src/components/ui/`. Feature components are organized by domain: `components/layout/`, `components/ideas/`, `components/evaluation/`, `components/profile/`, `components/team/`, `components/shared/`.
