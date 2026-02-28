# UI Reference

This file documents the UI components, styling patterns, and layout architecture used in this project. It serves as a reference when making UI changes.

---

## Layout Architecture

The dashboard uses a **three-panel layout** managed by `AppShell.tsx` (`src/components/layout/AppShell.tsx`).

```
┌─────────────────────────────────────────────────────────┐
│  LeftPanel  │ resize │  CenterPanel  │ resize │ RightPanel │
│  260–560px  │  6px   │   flex-1      │  6px   │ 360–720px  │
└─────────────────────────────────────────────────────────┘
```

- **AppShell** is a `"use client"` component; it owns `selectedIdeaId`, `leftWidth`, and `rightWidth` state
- Panels are drag-resizable via mouse event listeners on resize handles
- Panel constraints are enforced with `Math.min/Math.max`
- Resize handles: `w-1.5 cursor-col-resize bg-zinc-100 hover:bg-zinc-300 active:bg-violet-400`
- All panels use `h-full flex flex-col` as the root layout pattern
- **No responsive breakpoints exist in the layout** — it is fully desktop-only currently

### Panel Backgrounds
| Panel | Background | Right Border |
|-------|-----------|--------------|
| LeftPanel | `bg-white` | `border-r border-zinc-200` |
| CenterPanel | `bg-zinc-50` | `border-r border-zinc-200` |
| RightPanel | `bg-white` | — |

---

## Component Directory Map

```
src/components/
├── layout/
│   ├── AppShell.tsx         — Three-panel shell, drag-resize, idea selection state
│   ├── LeftPanel.tsx        — Team members, workspace name, invite banner
│   ├── CenterPanel.tsx      — Idea list, filters, new idea button
│   └── RightPanel.tsx       — Idea detail + evaluation display
│
├── ideas/
│   ├── IdeaCard.tsx         — Idea row in the center list
│   ├── IdeaForm.tsx         — Dialog form for creating/editing ideas
│   └── IdeaFilters.tsx      — Industry + visibility filter dropdowns
│
├── evaluation/
│   ├── EvaluationPanel.tsx  — Main evaluation container with header + score sections
│   ├── ScoreBreakdown.tsx   — Composite + sub-scores with progress bars
│   ├── IdeaSkillCoverage.tsx — Skill matrix heatmap for the idea
│   ├── TimeEstimateChip.tsx — Time-to-first-customer badge
│   ├── AIInsightCard.tsx    — AI narrative + detailed reasoning sections
│   └── ScoreLoadingState.tsx — Skeleton state while evaluation runs
│
├── team/
│   ├── CofounderCard.tsx    — Member profile card in LeftPanel
│   └── SkillGrid.tsx        — Skill coverage heatmap (team-level)
│
├── profile/
│   ├── ProfileForm.tsx      — Background text + skill selection form
│   └── NetworkEntryForm.tsx — Add/edit a network contact entry
│
├── shared/
│   ├── SkillSelect.tsx      — Multi-select skill picker (grouped by category)
│   ├── IndustrySelect.tsx   — Industry dropdown
│   └── InviteBanner.tsx     — Copyable invite link display
│
└── ui/                      — shadcn/ui base primitives
    button, input, textarea, card, badge, dialog, select,
    separator, scroll-area, progress, popover, command,
    skeleton, sonner
```

---

## Styling System

### Tailwind CSS v4
- Uses `@tailwindcss/postcss` — **no `tailwind.config.ts` file**
- Config is via CSS custom properties in `src/app/globals.css`
- Colors defined in OKLch color space under `:root` and `.dark`
- Import: `@import "tailwindcss"` (v4 syntax)

### Color Palette

**Neutral (zinc)**
- `zinc-50` — panel/page backgrounds
- `zinc-100/200` — borders, dividers
- `zinc-400/500` — muted text, icons
- `zinc-900` — primary text, selected states

**Score status colors**
| Score | Color |
|-------|-------|
| ≥ 75 | `text-emerald-500` / `bg-emerald-50` |
| 50–74 | `text-amber-500` / `bg-amber-50` |
| < 50 | `text-rose-500` / `bg-rose-50` |

**Skill category colors** (applied via inline `style={{}}`, not Tailwind classes)
| Category | Background | Border | Text |
|----------|-----------|--------|------|
| Technical | `#dbeafe` | `#3b82f6` | `#1e3a8a` |
| Business | `#ede9fe` | `#7c3aed` | `#2e1065` |
| Domain | `#d1fae5` | `#059669` | `#064e3b` |

**Accent**
- `violet-400` — active drag handle, primary accent

---

## Key Patterns

### Dynamic colors via inline styles
Skill tags, score circles, VC verdict badges, and recommendation chips use `style={{ backgroundColor, borderColor, color }}` because their values are dynamic (data-driven). Do not try to use Tailwind classes for these.

```tsx
// Example: skill tag
<span style={{ backgroundColor: '#dbeafe', borderColor: '#3b82f6', color: '#1e3a8a' }}>
  Engineering
</span>
```

### CVA (Class Variance Authority)
Button and Input use CVA for variant + size combinations. Always use the `variant` and `size` props rather than overriding classes.

```tsx
<Button variant="ghost" size="sm">...</Button>
```

### ScrollArea
All scrollable content regions use `<ScrollArea>` from shadcn (`src/components/ui/scroll-area.tsx`), not raw `overflow-y-auto`. This ensures consistent scrollbar styling.

### IdeaCard selection state
```tsx
className={cn(
  "border rounded-lg p-3 cursor-pointer ...",
  isSelected && "border-zinc-900 ring-1 ring-zinc-900"
)}
```

### Skeleton loading
Use `<Skeleton>` with dimensions that match the real content:
```tsx
<Skeleton className="h-4 w-32" />
```

---

## Typography & Spacing

### Text scale in use
| Class | Usage |
|-------|-------|
| `text-xs` | Labels, timestamps, muted metadata |
| `text-sm` | Body text, card content, form labels |
| `text-base` | Default (rarely used explicitly) |
| `text-2xl` | Section headings |
| `text-3xl` | Composite score in ScoreBreakdown |
| `text-5xl font-bold` | Large composite score display |

### Padding conventions
| Context | Classes |
|---------|---------|
| Panel headers | `px-4 py-3` |
| Panel content areas | `p-4` |
| Card/list items | `p-3` |
| Icon buttons | `p-0` (explicit) |

### Spacing
- Between list items: `space-y-2` (dense lists), `space-y-4` (section groups)
- Between inline elements: `gap-2`, `gap-1.5`

---

## Data Flow

```
AppShell (client, SWR)
├── LeftPanel   — receives: workspaceId, currentMemberId
├── CenterPanel — receives: ideas[], selectedIdeaId, onSelect, onIdeaCreated
└── RightPanel  — receives: idea, currentMemberId, onIdeaUpdated, onIdeaDeleted
```

- `useIdeas()` hook (SWR, 15s polling) lives in AppShell
- `selectedIdeaId` is local state in AppShell
- Callbacks (`handleIdeaUpdate`, `handleIdeaDelete`, `handleCenterUpdate`) are passed down as props

---

## Forms & Dialogs

- All forms use shadcn `<Dialog>` with controlled `open` state
- `IdeaForm` is reused for both create and edit (detected via `existing` prop)
- Form fields: `<Input>`, `<Textarea>`, `<Select>` from shadcn/ui
- Submission via `fetch()` to API routes — no form libraries (no react-hook-form)

---

## Pages Outside the Dashboard

| Route | File | Notes |
|-------|------|-------|
| `/sign-in`, `/sign-up` | Clerk-hosted | Not customized |
| `/onboarding` | `src/app/(workspace)/onboarding/` | Workspace creation form |
| `/profile` | `src/app/(workspace)/profile/` | ProfileForm + NetworkEntryForm |
| `/join` | `src/app/join/` | Invite token redemption |
| `/dashboard` | `src/app/(workspace)/dashboard/` | AppShell entry point |
