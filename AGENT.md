# Agent Guide — Monolitlabs CRO Auditor

> **Audience:** AI coding agents and contributors.  
> Read this file **before** making any code changes in this repo.  
> For system design details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Start here

Before editing code, read in this order:

1. **This file** — rules and conventions
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — system layers, data flow, file map
3. **[README.md](./README.md)** — setup, env, deploy commands
4. **[docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)** — UI tokens and components (web changes)

---

## 2. Hard rules (never break)

### Environment

- **Web:** `apps/web/.env` (template: `apps/web/.env.example`)
- **API:** `apps/api/.dev.vars` (template: `apps/api/.dev.vars.example`)
- **Never read env inside services** — config flows through routes (see § Config access)
- **New API secret?** Add to `apps/api/.dev.vars.example` + map in `apps/api/src/config/index.ts`
- **New web env?** Prefix with `VITE_`, add to `apps/web/.env.example` + read in `apps/web/src/config/index.ts`

### Config access

- **Services must NOT read env directly** — no `env.OPENAI_API_KEY` inside `services/` or `scraper/`
- Config is resolved in `apps/api/src/config/index.ts` and passed through routes:

```
WorkerEnv → createAppConfig() → createAppContext() → route handler → service(params)
```

- Web reads env only in `apps/web/src/config/index.ts` — nowhere else

### Authentication

- All API routes except `GET /api/health` require `Authorization: Bearer <token>`
- Use `requireAuth()` from `apps/api/src/lib/auth.ts` in route handlers
- Web attaches the Supabase session token in `apps/web/src/lib/api.ts`
- Never store service role keys in the web app — only `VITE_SUPABASE_ANON_KEY`

### Shared code

- Types/constants used by both web and api → `packages/shared`
- Import pattern:

```ts
import { CRO_AUDIT_RULES } from "@cro-auditor/shared/constants/rules";
import type { AuditRecord } from "@cro-auditor/shared/types/audit";
import { computeOverallScore } from "@cro-auditor/shared/compute-overall-score";
```

- **Never duplicate** types or rules across apps

### Edge runtime (API)

- **No Node.js native modules** in `apps/api` (`fs`, `path`, `crypto` from Node, etc.)
- Scraper uses `fetch()` + Cheerio only — no Puppeteer/Playwright
- Keep Worker bundle lean; avoid unnecessary dependencies

### Scope

- Make the **smallest correct diff** — don't refactor unrelated code
- Match existing naming, import style, and file structure
- Don't add tests unless they cover meaningful behavior

---

## 3. Where to put new code

| Task | Location |
|------|----------|
| New API endpoint | `apps/api/src/routes/<name>.ts` + register in `index.ts` |
| New external integration | `apps/api/src/services/<name>.ts` |
| New HTML processing step | `apps/api/src/scraper/<name>.ts` |
| Auth helpers | `apps/api/src/lib/auth.ts` |
| SSE helpers | `apps/api/src/lib/sse.ts` (API), `apps/web/src/lib/sse.ts` (client) |
| New env / config field | `apps/api/src/config/index.ts` + `apps/api/.dev.vars.example` |
| New shared type or constant | `packages/shared/src/` + update `packages/shared/package.json` exports |
| New UI component | `apps/web/src/components/ui/<Name>.tsx` |
| New page | `apps/web/src/pages/<Name>.tsx` + route in `main.tsx` |
| New frontend API call | `apps/web/src/lib/api.ts` |
| New React context | `apps/web/src/contexts/<Name>.tsx` |
| Database schema change | `supabase/migrations/<NNN>_<name>.sql` |
| Design tokens / styles | `apps/web/src/design-system/` |

---

## 4. Adding a new API route

1. Create handler in `apps/api/src/routes/`:

```ts
import type { AppContext } from "../context";
import type { AppConfig } from "../config";
import { requireAuth } from "../lib/auth";
import { jsonResponse } from "../lib/http";

export async function handleMyRoute(
  request: Request,
  origin: string,
  config: AppConfig,
  ctx: AppContext
): Promise<Response> {
  const authResult = await requireAuth(request, origin, config, ctx.supabase);
  if (authResult instanceof Response) {
    return authResult;
  }

  // use ctx.config.* for secrets, ctx.supabase for DB, authResult.user.id for user scope
  return jsonResponse({ ok: true }, 200, origin, config);
}
```

2. Register in `apps/api/src/index.ts` (match method + pathname)
3. If route needs a new secret → update `apps/api/.dev.vars.example` + `config/index.ts`
4. Add frontend call in `apps/web/src/lib/api.ts` if needed
5. Update [ARCHITECTURE.md](./ARCHITECTURE.md) §9 API surface

---

## 5. SSE audit streaming

`POST /api/audit` returns `text/event-stream`, not JSON.

- Server: `createSSEResponse()` in `apps/api/src/lib/sse.ts`
- Client: `consumeSSE()` in `apps/web/src/lib/sse.ts`, orchestrated by `runAudit()` in `lib/api.ts`
- Event types defined in `packages/shared/src/types/audit-stream.ts`
- Progress UI: `AuditProgress` component driven by `AuditsContext`

When adding a new pipeline step, update `AUDIT_STEP_ORDER` in shared and emit matching `progress` events from `routes/audit.ts`.

---

## 6. Adding a new env variable

**API secret:**
1. Add to `apps/api/.dev.vars.example`
2. Map in `apps/api/src/config/index.ts` → `AppConfig`
3. Pass through route → service as typed param

**Web variable:**
1. Prefix with `VITE_`, add to `apps/web/.env.example`
2. Read in `apps/web/src/config/index.ts` only

---

## 7. File quick reference

```
apps/api/src/
├── index.ts              # Entry: routing, CORS, error handling
├── config/index.ts       # WorkerEnv → AppConfig (ONLY place env is mapped)
├── context.ts            # AppConfig → AppContext
├── lib/
│   ├── auth.ts           # JWT Bearer verification
│   ├── http.ts           # corsHeaders, jsonResponse, isValidUrl
│   └── sse.ts            # Server-Sent Events response helper
├── routes/
│   ├── health.ts
│   ├── audit.ts          # POST /api/audit (SSE)
│   └── audits.ts         # GET /api/audits, GET /api/audits/:id
├── services/
│   ├── openai.ts         # CRO analysis via OpenAI
│   ├── pagespeed.ts      # Google PageSpeed Insights (lab metrics)
│   └── supabase.ts       # DB read/write
└── scraper/
    ├── index.ts          # fetch + orchestrate
    ├── blocked-page.ts   # Bot-block / empty page detection
    ├── colors.ts         # Visual token extraction
    ├── markdown.ts       # HTML → semantic markdown
    └── stylesheets.ts    # External CSS fetching

apps/web/src/
├── main.tsx              # Router + AuthProvider
├── pages/
│   ├── AppLayout.tsx
│   ├── WorkspacePage.tsx
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── AuditsContext.tsx
├── config/index.ts       # ONLY place web reads env
├── lib/
│   ├── api.ts            # Authenticated API + SSE
│   ├── sse.ts            # Client SSE parser
│   └── supabase.ts
├── components/
│   ├── ui/               # Design system primitives
│   └── layout/           # AuthLayout
└── design-system/        # tokens.css, base.css, components.css, layout.css

packages/shared/src/
├── constants/rules.ts              # CRO framework (Krug + Cialdini)
├── constants/audit-framework/      # Framework modules
├── types/audit.ts                  # AuditRecord, AuditAnalysis
├── types/audit-stream.ts           # SSE event types
├── compute-overall-score.ts        # Composite score
└── normalize-audit-analysis.ts     # Legacy analysis normalization
```

---

## 8. NPM scripts

| Script | When to use |
|--------|-------------|
| `npm run dev` | Start web dev server (:5173) |
| `npm run dev:api` | Start Worker dev server (:8787) |
| `npm run dev:all` | Start API + web together |
| `npm run build` / `build:web` | Build web for production |
| `npm run build:api` | Dry-run Worker bundle check |
| `npm run test` | Run API unit tests |
| `npm run deploy:api` | Deploy Worker to Cloudflare |
| `npm run deploy:web` | Build + deploy Pages |
| `npm run secrets:upload` | Bulk upload API secrets from `.dev.vars` |

---

## 9. Testing

- Scraper: `apps/api/src/scraper/*.test.ts`
- PageSpeed: `apps/api/src/services/pagespeed.test.ts`
- HTTP helpers: `apps/api/src/lib/http.test.ts`
- Score utilities: `apps/api/src/services/compute-overall-score.test.ts`, `normalize-audit-analysis.test.ts`
- Run: `npm test`
- Test pure functions — mock external APIs; never call OpenAI/PageSpeed in tests

---

## 10. Common mistakes to avoid

| Mistake | Correct approach |
|---------|------------------|
| Reading `env` inside a service | Pass config param from route handler |
| Putting API secrets in web `.env` | API secrets stay in `apps/api/.dev.vars` |
| Duplicating `AuditRecord` type in web | Import from `@cro-auditor/shared/types/audit` |
| Adding Puppeteer to scraper | Use `fetch()` + Cheerio |
| Putting CRO rules in api only | Keep in `packages/shared` |
| Forgetting to register route | Add match block in `index.ts` |
| Returning JSON from POST /api/audit | Use SSE via `createSSEResponse` |
| Skipping auth on new routes | Call `requireAuth()` (except health) |
| Large unrelated refactors | Minimal scoped diff |

---

## 11. Documentation maintenance

When you change the codebase, update the relevant doc:

| Change | Update |
|--------|--------|
| New route, service, or layer | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| New convention or agent rule | This file (AGENT.md) |
| Setup / deploy / env steps | [README.md](./README.md) |
| UI tokens, components, UX patterns | [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) |

---

## 12. Local dev checklist

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.dev.vars.example apps/api/.dev.vars
# fill in all keys in both files
npm install
# run all supabase/migrations/*.sql in order (001–004)
# enable Email auth in Supabase dashboard
npm run dev:api               # terminal 1 — API :8787
npm run dev                   # terminal 2 — Web :5173
```

Web proxies `/api` → Worker in dev. Leave `VITE_API_URL` empty locally.
