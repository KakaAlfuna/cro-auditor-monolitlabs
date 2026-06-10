# Monolitlabs CRO Auditor — Design System

## UX process

Every UI change follows this flow:

```
1. DISCOVER  →  Research user needs, audit existing UI, map pain points
2. DEFINE    →  Write user stories, define information architecture
3. DESIGN    →  Tokens (color, type, spacing) → Components → Layouts → Pages
4. PROTOTYPE →  Build reusable components in code (design system first)
5. VALIDATE  →  Accessibility check, responsive test, consistency review
6. SHIP      →  Refactor pages to consume design system, remove one-off styles
```

### Design principles

| Principle | Application |
|-----------|-------------|
| **Clarity first** | Each screen has one clear primary action |
| **Data-forward** | Score, metrics, and findings are hero content |
| **Trust & precision** | Dark professional palette, clean typography, consistent status colors |
| **Progressive disclosure** | Markdown & rules hidden in collapsible sections |
| **Accessible by default** | Focus ring, aria labels, live regions for progress |

---

## User stories

### Epic 1: Authentication

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-01 | As a **marketer**, I want to **create an account** so my audits are saved | Register form with password validation, redirect to login on success |
| US-02 | As a **user**, I want to **log in** to access the dashboard | Login form, error handling, redirect to workspace |
| US-03 | As a **user**, I want to **log out** to keep my account secure | Sign out button in header, redirect to login |

### Epic 2: Run audit

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-04 | As a **CRO specialist**, I want to **enter a URL** to audit a page | URL input + submit, disabled while loading |
| US-05 | As a **user**, I want to **see real-time progress** during an audit | 5-step progress modal with pending/running/done/error states (SSE) |
| US-06 | As a **user**, I want to **see errors** when an audit fails | Error modal with a clear message |

### Epic 3: View results

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-07 | As a **user**, I want to **see the CRO score** to judge page quality | `ScoreRing` with composite score |
| US-08 | As a **user**, I want to **read summary & findings** to know what to fix | Structured summary + findings with severity badges |
| US-09 | As a **user**, I want to **see performance metrics** to judge speed | Lab score, LCP, FCP, CLS, TBT, primary font |
| US-10 | As a **user**, I want a **color palette warning** when brand colors are cluttered | Warning when >3 colors, swatches for all detected colors |

### Epic 4: History

| ID | Story | Acceptance criteria |
|----|-------|---------------------|
| US-11 | As a **user**, I want to **see audit history** to compare results | Collapsible sidebar list with title, score, timestamp |
| US-12 | As a **user**, I want to **open a past audit** to review details | Click opens report modal with full results |
| US-13 | As a **user**, I want to **load more audits** when history is long | Infinite scroll / load-more with pagination |

---

## Color palette

### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand-500` | `#6366F1` | Primary buttons, active states |
| `--color-brand-400` | `#818CF8` | Links, eyebrows, hover |
| `--color-brand-600` | `#4F46E5` | Button gradient end |

### Growth (CRO accent)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-growth-400` | `#34D399` | Score gradient, success |
| `--color-growth-500` | `#10B981` | Positive indicators |

### Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#080C14` | Page background |
| `--color-surface` | `#141C2B` | Panels, cards |
| `--color-surface-raised` | `#1A2438` | Inputs, elevated cards |
| `--color-border` | `#2A3548` | Borders |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#34D399` | Done, OK palette |
| `--color-warning` | `#FBBF24` | Warnings, cluttered palette |
| `--color-critical` | `#F87171` | Errors, critical findings |
| `--color-info` | `#38BDF8` | Info findings |

---

## Typography

| Role | Font | Weight |
|------|------|--------|
| Display / Headings | Plus Jakarta Sans | 600–700 |
| Body | Plus Jakarta Sans | 400–500 |
| Code / Rule IDs | JetBrains Mono | 400 |

### Scale

`--text-xs` (12px) → `--text-4xl` (36px)

---

## Spacing scale

4px base grid: `--space-1` (4px) through `--space-16` (64px)

---

## Component library

### Primitives (`src/components/ui/`)

| Component | Variants | Purpose |
|-----------|----------|---------|
| `Button` | primary, secondary, ghost; sizes sm, full | Actions |
| `Input` | with/without label | Form fields |
| `Panel` | default, elevated, success, warning | Content containers |
| `Alert` | error, success, warning, info | Inline feedback |
| `Badge` | critical, warning, info, success | Severity tags |
| `ScoreRing` | — | Circular CRO score display |
| `Modal` | default, large; optional insetX | Progress, errors, audit report |
| `Tooltip` | — | Metric explanations |
| `StatCard` | — | Compact metric display |
| `Section` | — | Grouped content with heading |
| `PageHeader` | — | Page title block |
| `Eyebrow` | — | Brand label above headings |
| `Heading` | level 1–3 | Titles |
| `Text` | default, secondary, muted | Body copy |
| `EmptyState` | — | Placeholder when no data |

### Layout (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `AuthLayout` | Centered auth card for login/register |

### Feature (`src/components/`)

| Component | Uses |
|-----------|------|
| `UrlForm` | Input, Button |
| `AuditProgress` | Modal + `ds-progress` styles |
| `AuditHistory` | History list with load-more |
| `AuditResults` | ScoreRing, Badge, Panel, findings, MetricsPanel, ColorWarning |
| `MetricsPanel` | Lab metrics with tooltips (LCP, FCP, CLS, TBT) |
| `ColorWarning` | Panel (success/warning), color swatches |
| `ProtectedRoute` | Auth gate wrapper |

### Pages (`src/pages/`)

| Page | Layout |
|------|--------|
| `WorkspacePage` | Header (brand + user chip + sign out), hero URL form, collapsible history, modals for progress/errors/report |
| `LoginPage` | AuthLayout + sign-in form |
| `RegisterPage` | AuthLayout + sign-up form |

---

## File structure

```
apps/web/src/
├── design-system/
│   ├── tokens.css       # CSS custom properties
│   ├── base.css         # Reset, body, focus
│   ├── components.css   # ds-* component styles
│   ├── layout.css       # Page layouts (home, auth, modals)
│   └── index.css        # Barrel import
├── components/
│   ├── ui/              # Reusable primitives
│   └── layout/          # AuthLayout
├── pages/               # Route-level views
└── contexts/            # AuthContext, AuditsContext
```

---

## Adding a new component

1. Define tokens if new color/spacing needed → `tokens.css`
2. Add `ds-*` styles → `components.css` or `layout.css`
3. Create React wrapper → `components/ui/ComponentName.tsx`
4. Export from `components/ui/index.ts`
5. Use in feature components — never add one-off styles in pages
