# AI Portfolio (site)

Portfolio site for **Shahul Ummarali**, a software architect at Cognizant with 20+ years' experience who works for a U.S. healthcare payer client. It goes on his resume and LinkedIn. Each app is a working demo for the payer domain, with a case-study page alongside it. Audience: hiring managers and architects, so pages should read as plain and credible, never hype.

Sister project: `../healthcare-payer-ai-services`, the Spring Boot (Java 21) versions of every engine, which the client needs in Java. See "Java services" below.

## Stack
- Next.js 16 (App Router, Turbopack), TypeScript, plain CSS tokens in `src/app/globals.css` with light and dark themes. No Tailwind.
- `@anthropic-ai/sdk` with zod. Model `claude-opus-5-5` ($4 in / $20 out per MTok). Calls use `client.beta.messages.parse` + `betaZodOutputFormat`, `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`, and a cached system prompt. The Benefits agent runs a manual tool loop with strict tools.
- Shared code: `src/lib/shared/{llm,api,live-limit,redact,engine-proxy}.ts`.

## The five demos
| Slug | Engine | API route | Data |
|---|---|---|---|
| prior-auth-copilot | `src/lib/pa` | `api/pa/evaluate` | `data/pa` |
| denial-appeals-assistant | `src/lib/appeals` | `api/appeals/analyze` | `data/appeals` |
| benefits-navigator | `src/lib/benefits` | `api/benefits/ask` | `data/benefits` |
| payment-integrity-radar | `src/lib/pi` | `api/pi/leads`, `api/pi/brief` | `data/pi` |
| hcc-evidence-finder | `src/lib/hcc` | `api/hcc/review` | `data/hcc` |

Pages: `src/app/apps/<slug>/` (demo + case study). The app list and personal details are in `src/lib/site.ts`.

Domain notes: PA follows a fixed workflow with CMS-0057-F decision deadlines. Appeals reads X12 835 with CARC/RARC codes and writes the letter in two stages. Benefits is a tool-use agent with a calculator and a dollar-amount check. PI uses robust z/MAD scores, Theil-Sen risk adjustment, a hard rule for more than 16 hours a day, neutral briefs, and a seeded synthetic cohort that includes a decoy (`npm run generate:pi`). HCC uses CMS-HCC V28, MEAT evidence, two-way reconciliation, hierarchies and acceptable encounter types.

## Design rules every demo follows
- **Code makes the decision; the model reads and explains.** Rules, thresholds, money math and codes are deterministic code. The model never decides.
- **Quotes are checked word for word** against the source text. If a quote isn't found, the output is held, not shown.
- **Replay vs. Live.** Replay serves recorded live runs (default and public). Live calls the model and needs `ANTHROPIC_API_KEY`, with a per-IP daily cap (`PA_DAILY_LIMIT_PER_IP`, keep it at 10).
- If a check fails, tighten the **prompt**, never the check.
- Only **live** eval runs write the site's eval numbers. Replay runs must not overwrite them.
- All data is synthetic. No PHI.

## Scripts
- `npm run dev` / `build` / `typecheck`
- `npm run eval[:appeals|:benefits|:pi|:hcc]`: replay evals. `npm run record[:...]`: live runs that re-record replays and update the eval numbers (costs money; the daily cap may need temporarily raising and then **restoring to 10**).
- `npm run gif`: rebuilds `public/architecture-flow.gif` (`scripts/make-architecture-gif.js`). The animated diagram on the Architecture page is `src/components/ArchitectureDiagram.tsx`, with its steps in `src/lib/architecture.ts`.
- `npm run contracts:check|write|sync`: see below.

## Java services (`../healthcare-payer-ai-services`)
- Setting `PA_ENGINE_URL`, `APPEALS_ENGINE_URL`, `BENEFITS_ENGINE_URL`, `PI_ENGINE_URL` or `HCC_ENGINE_URL` (ports 8081–8085) makes that route forward to Java via `forwardToJava`. When they're empty (the default in `.env.local`), the TypeScript engine runs.
- **This repo's `data/` is the master copy.** `contract-tests/` holds golden JSON generated from the TypeScript engines in replay mode.
- After changing data or re-recording, with the dev server running: `npm run contracts:sync` (regenerates the golden files and copies `data/` and `contract-tests/` to the services project), then run `mvn test` there.
- Any change to an engine's output shape must be made in both languages.

## Developer tools demos (`../langgraph-dev-agents`, Python)
- Apps are grouped in `src/lib/site.ts` (`group: "payer" | "developer"`, `APP_GROUPS`); Home and Apps render one section per group.
- Code Review Agent (`/apps/code-review-agent`): the engine is a Python LangGraph + LangChain FastAPI service in `../langgraph-dev-agents` (port 8090). This site has no TypeScript engine for it.
- Replay serves `data/code-review/results/*.json`, exported by `uv run python scripts/export_site.py` in that repo, so Vercel needs no Python host. Setting `CODE_REVIEW_ENGINE_URL` forwards to the service for live runs.
- Source links for Python demos come from `PYTHON_CODE_PATHS` in `site.ts`.

## Python payer agents (`../payer-ai-agents`)
- Fax Intake Agent (`/apps/fax-intake-agent`, Healthcare payer group): Python LangGraph + LangChain + MCP FastAPI service (port 8091). Reads image-only fax PDFs, verifies through a mock payer-systems MCP server, pauses for human approval (LangGraph interrupt), then writes.
- Replay serves `data/fax-intake/results/*.json` (each with a `paused` and an `approved` run) and fax page images in `public/fax-intake/`, exported by that repo's `scripts/export_site.py` and `scripts/make_faxes.py --site`. `FAX_INTAKE_ENGINE_URL` forwards to the service for live runs; `/api/fax-intake/approve` resumes a paused run.

## Standing rules from the owner
- The public site (Vercel) runs **key-off**: no `ANTHROPIC_API_KEY` there, so it's replay only.
- **Don't commit or push to git until asked.**
- Never print or echo the API key. It lives in `.env.local` (git-ignored); `.env.example` stays blank. The services project has its own copy in `../healthcare-payer-ai-services/.env`. A rotated key must be updated in both.
- Stop dev servers and Java services when done.

## Open to-dos (owner's)
- Verify `data/hcc/hcc-map.json` against the official CMS V28 mappings (I63.9 → HCC 249 is unconfirmed).
- Check employer rules about naming the client (About and `public/resume.pdf` describe clients by industry until then); register `shahulnu.dev` and point it at Vercel; set JAVA_HOME.
- `public/resume.pdf` is the public copy of the resume: no phone number, clients described by industry. When the resume changes, replace it and keep the About page's career timeline and credentials in step with it.
