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
npx prisma db seed                     # Seed Industry rows (uses tsx)
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

Schema models:
- `Industry` — lookup table with slug PK (e.g. `"enterprise-saas"`) and `label`. All industry FK fields across models reference this table.
- `Workspace` → `WorkspaceMember` → `CofounderProfile` → `NetworkEntry` (aggregate) + `Contact` (individual, from imports/manual).
- `Idea` — belongs to workspace + submitter, has `industryId` FK. 1:1 `IdeaScore` (cached eval). 1:1 `ValidationPlan` (AI-generated, workspace-visible).
- `Contact` — individual person from Google/LinkedIn/manual import. Has `name`, `company`, `domain`, `position`, `industryId`, `connectionStrength`, `source` (enum: GOOGLE/LINKEDIN/MANUAL), `embedding Float[]` (always `[]` until pgvector). Belongs to `CofounderProfile`.
- `CompanyIndustryCache` — domain→industryId cache (domain as PK). `NetworkImportSession` — in-progress import groups per member (1-hour TTL, v2 envelope format).

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

2. **Network** (`network.ts`) — deterministic. Hybrid: prefers `Contact[]` (1 record = 1 person, `computeNetworkScoreFromContacts`) when contacts exist; falls back to `NetworkEntry[]` aggregates (`computeNetworkScore`). Strength-weighted contact count (log scale), 60% size + 40% industry relevance match via `industryId`.

3. **Claude AI** (`claude.ts`) — calls `claude-sonnet-4-6` via `client.messages.create` with `cache_control: { type: "ephemeral" }` blocks. Team context is cached (ephemeral, 5-min TTL); the idea payload is uncached. Returns `ideaQualityScore`, `teamIdeaFitScore`, `timeToFirstCustomer`, `narrative`, and detailed `reasoning`.

Composite formula: `0.25 × TeamSkill + 0.20 × Network + 0.30 × IdeaQuality + 0.25 × TeamIdeaFit`

Scores are persisted to `IdeaScore` via upsert and regenerated on demand. Only the idea submitter can trigger evaluation (`POST /api/ideas/[id]/score`).

### API Routes (Next.js 16)

All route handlers use `params: Promise<{ id: string }>` — must `await params` before accessing fields.

Key routes:
- `POST /api/workspace` — create workspace
- `GET/POST /api/ideas` — list/create ideas (field: `industryId`)
- `POST /api/ideas/[id]/score` — trigger AI evaluation (submitter only)
- `GET/POST /api/ideas/[id]/validation-plan` — fetch/generate AI validation plan (any workspace member; requires existing score)
- `PUT /api/ideas/[id]` — update idea
- `DELETE /api/ideas/[id]` — delete idea
- `PATCH /api/ideas/[id]/visibility` — toggle visibility
- `GET /api/industries` — list all Industry rows (used by all dropdowns)
- `GET/POST /api/profile` — cofounder profile
- `GET/POST /api/network` — network entries (aggregate; field: `industryId`)
- `DELETE /api/network/[id]` — remove network entry
- `GET/POST /api/contacts` — individual Contact records
- `DELETE /api/contacts/[id]` — remove contact
- `GET /api/network/google/auth` — start Google OAuth flow (returns `{ url }` for client-side redirect)
- `GET /api/network/google/callback` — OAuth callback; produces both `CategorizedGroup[]` and `StagedContact[]`, stores `ImportSessionData` v2 envelope in `NetworkImportSession`
- `GET/DELETE /api/network/import/session` — fetch or delete current unexpired import session
- `POST /api/network/import/confirm` — creates both `NetworkEntry` and `Contact` records from confirmed groups+contacts, deletes session
- `POST /api/network/import/linkedin` — accepts `{ rows: [{company, position}] }`, returns `{ groups: CategorizedGroup[], contacts: StagedContact[] }` (preview only)
- `GET /api/members` — workspace member list

### Constants & Types

- `src/lib/constants/skills.ts` — `SKILLS_TAXONOMY` with three categories and a `SkillKey` union type. Skills are stored as `string[]` in DB; `SkillKey` is enforced only at input boundaries.
- `src/lib/constants/industries.ts` — exports `INDUSTRY_IDS` (string array of slugs) and `IndustryId` type. Labels are **not** hardcoded here — they come from the `Industry` DB table via `GET /api/industries`. All UI dropdowns fetch from that route.
- `src/lib/types/idea.ts` — `IdeaData` with `industry: { id, label }` (relation object, not string).
- `src/lib/types/profile.ts` — `MemberWithProfile`, `NetworkEntryData` (with `industry: { id, label }`), `ContactData`.
- `src/lib/types/import.ts` — `CategorizedGroup` (uses `industryId`), `StagedContact`, `ImportSessionData` (v2 envelope), `parseSessionData()` (handles legacy bare arrays).
- `src/lib/types/validation.ts` — `StoredValidationPlan`, `ValidationStep`, `NetworkReachOut`, `ValidationPlanResponse`.
- `src/lib/contacts/domains.ts` — `PERSONAL_DOMAINS` set, `extractDomain`, `domainToCompanyName` utilities.
- `src/lib/contacts/classify.ts` — `classifyCompanyDomains` (domain→industryId via cache+Haiku), `classifyContactGroups` (→`CategorizedGroup[]`), `classifyContactsPerRow` (→per-row `string[]`). All use `claude-haiku-4-5-20251001`.
- `src/lib/scoring/validation.ts` — `generateValidationPlan()` — calls `claude-sonnet-4-6` with team network context (cached) + idea/score payload. Returns `StoredValidationPlan` with steps, network reach-outs referencing real contacts, success criteria, and re-evaluation triggers.

### UI Components

shadcn/ui components live in `src/components/ui/`. Feature components are organized by domain: `components/layout/`, `components/ideas/`, `components/evaluation/`, `components/profile/`, `components/team/`, `components/shared/`.
