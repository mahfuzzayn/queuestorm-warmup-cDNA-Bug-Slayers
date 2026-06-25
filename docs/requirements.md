# BUILD.md — QueueStorm Ticket Sorter
### Single-pass spec for Claude Code CLI: Design → Develop → Test → Deploy

> Instructions to the operator: run `claude` in this repo root and say
> "Read BUILD.md and execute it step by step. Stop and ask me only when you need a secret or a deploy confirmation."

---

## 0. Context (do not skip)

We are building a JSON API for the bKash SUST CSE Carnival 2026 Mock Preliminary.
A customer support message comes in, and we classify it into case type, severity,
department, a short safe summary, and a review flag.

Full original spec is in `SPEC.md` in this repo (paste the hackathon doc there first).
This file (`BUILD.md`) is the execution plan. Follow it top to bottom in order.

**Hard constraints — never violate these:**
- No GPU dependency.
- No secrets committed to git. All keys via `.env.local` (gitignored) and Vercel env vars.
- `agent_summary` must NEVER contain PIN, OTP, password, or full card number language — this is graded automatically.
- `/health` must respond within 10s, `/sort-ticket` within 30s.
- Rules-based classification must work with ZERO external API calls (LLM is optional enhancement only, behind an env flag, with safe fallback to rules engine if it fails or is disabled).

---

## 1. Stack decision

- Next.js 14+, App Router, TypeScript
- Route Handlers for the two endpoints (no separate Express server)
- `zod` for request/response validation
- `vitest` for tests
- Deploy target: Vercel

---

## 2. Step-by-step execution plan

### Step 1 — Scaffold
```
npx create-next-app@latest . --typescript --app --eslint --no-tailwind --src-dir=false --import-alias "@/*"
npm install zod
npm install -D vitest
```
Initialize git if not already. Create `.gitignore` entries for `.env.local`, `.env`.

### Step 2 — Folder structure
Create this exact structure:
```
app/
  health/route.ts
  sort-ticket/route.ts
lib/
  schema.ts        # zod request/response schemas
  classify.ts       # pure rules-based classifier
  summarize.ts      # builds agent_summary text
  safety.ts         # final PIN/OTP/password/card filter
  llm.ts            # optional LLM enhancement, env-flagged, must fail-safe to rules engine
tests/
  sort-ticket.test.ts
.env.example
README.md
SPEC.md             # paste original hackathon spec here (operator will do this)
```

### Step 3 — `lib/schema.ts`
Define zod schemas matching the spec exactly:
- Request: `ticket_id` (string, required), `channel` (optional enum: app|sms|call_center|merchant_portal), `locale` (optional enum: bn|en|mixed), `message` (string, required)
- Response: `ticket_id`, `case_type` (enum: wrong_transfer|payment_failed|refund_request|phishing_or_social_engineering|other), `severity` (enum: low|medium|high|critical), `department` (enum: customer_support|dispute_resolution|payments_ops|fraud_risk), `agent_summary` (string), `human_review_required` (boolean), `confidence` (number 0–1)

### Step 4 — `lib/classify.ts`
Pure function `classify(message: string, locale?: string): { case_type, severity, department, confidence }`.

Build as a prioritized keyword/regex rules engine (English + common Bangla transliteration terms). Priority order matters — check phishing/fraud signals FIRST since they're critical:

1. **Phishing/social engineering** — keywords: otp, pin, password, "ask for my", "called asking", "is that bkash", verification code, card number request from unknown caller → `case_type: phishing_or_social_engineering`, `severity: critical`
2. **Wrong transfer** — sent wrong number, wrong recipient, sent to wrong account → `wrong_transfer`, `severity: high`
3. **Payment failed** — failed but deducted, transaction failed, balance deducted, money gone but no confirmation → `payment_failed`, `severity: high`
4. **Refund request** — refund, changed my mind, want my money back (no fraud/wrong-transfer signal) → `refund_request`, `severity: low` (bump to `medium`/`high` if amount or "disputed"/"didn't authorize" language present)
5. **Other** — app crashed, login issue, general complaint, no match above → `other`, `severity: low`

Map `case_type` → `department` per spec table:
- `wrong_transfer` → `dispute_resolution`
- `payment_failed` → `payments_ops`
- `refund_request` → `customer_support` (or `dispute_resolution` if contested — check for "disputed"/"unauthorized"/"didn't authorize")
- `phishing_or_social_engineering` → `fraud_risk`
- `other` → `customer_support`

`confidence`: simple heuristic — 0.9 if a strong keyword matched, 0.6 if weak/ambiguous match, 0.4 if fell through to `other` by default.

### Step 5 — `lib/summarize.ts`
Function `summarize(message, case_type): string`. Build ONE neutral templated sentence per case_type, e.g.:
- wrong_transfer: "Customer reports sending money to an incorrect recipient and requests recovery."
- payment_failed: "Customer reports a failed transaction where the balance may have been deducted."
- refund_request: "Customer is requesting a refund for a recent transaction."
- phishing_or_social_engineering: "Customer reports a suspicious contact requesting sensitive account information."
- other: "Customer reported a general issue requiring review."

Do NOT echo raw user text verbatim into the summary (avoids accidentally echoing a PIN/OTP the customer pasted into their own message). Use templates, optionally inserting only safe extracted entities (e.g. amount, channel) if easily and safely parsed.

### Step 6 — `lib/safety.ts`
Function `enforceSafety(summary: string): string`. Regex-check for pin/otp/password/card number patterns (e.g. 12–16 digit sequences). If found, replace the entire summary with the safe template fallback for that case_type. This must run on every response right before returning, no exceptions.

### Step 7 — `lib/llm.ts` (optional enhancement, build LAST, fail-safe)
- Read `process.env.LLM_ENABLED` and `process.env.ANTHROPIC_API_KEY`
- If disabled or key missing or call throws/times out → return `null` immediately, caller falls back to rules engine
- If enabled: call Claude (model `claude-sonnet-4-6`, low max_tokens) to refine `agent_summary` ONLY — never let the LLM touch case_type/severity/department/human_review_required, those stay rules-based for determinism and auditability
- Always pass LLM output through `safety.ts` before returning

### Step 8 — `app/health/route.ts`
```ts
export async function GET() {
  return Response.json({ status: "ok" });
}
```

### Step 9 — `app/sort-ticket/route.ts`
- Parse + validate body with zod (400 + error message on failure)
- Call `classify()`
- Call `summarize()`, then optionally `llm.ts` refinement, then always `safety.ts`
- Set `human_review_required = true` if `severity === "critical"` OR `case_type === "phishing_or_social_engineering"`
- Return full response JSON matching schema exactly, echoing `ticket_id`

### Step 10 — Tests (`tests/sort-ticket.test.ts`)
Encode the 5 public sample cases from SPEC.md as table-driven tests, asserting `case_type` and `severity`. Add 3 edge cases: missing `message`, missing `ticket_id`, mixed bn/en text with an OTP-request phrase (must come back critical + phishing + safe summary).
Run with `npx vitest run` — all must pass before deploy.

### Step 11 — README.md
Include: setup commands, local run command, env vars table, how to test locally with curl examples for both endpoints, deployment steps for Vercel, and a "runbook" section (this is explicitly required by the submission rules) describing how an organizer could redeploy from scratch if the live URL is down.

### Step 12 — Env vars
`.env.example`:
```
LLM_ENABLED=false
ANTHROPIC_API_KEY=
```
**STOP HERE and ask the operator for the real key value if `LLM_ENABLED=true` is desired** — do not proceed to put a real key in any file; it goes into `.env.local` (gitignored) and Vercel dashboard only.

### Step 13 — Deploy
```
vercel login        # operator confirms in browser
vercel link
vercel env add LLM_ENABLED
vercel env add ANTHROPIC_API_KEY   # only if using LLM
vercel deploy --prod
```
After deploy, curl the live URL's `/health` and one `/sort-ticket` sample to confirm before reporting done.

### Step 14 — Final verification checklist (must all be true)
- [ ] `/health` live and responds < 10s
- [ ] `/sort-ticket` live and responds < 30s for all 5 sample cases with correct case_type/severity
- [ ] No secrets in git history (`git log -p | grep -i api_key` should be empty)
- [ ] `agent_summary` never contains PIN/OTP/password/card patterns in any test case
- [ ] README has working runbook
- [ ] Repo is public

---

## 3. What to ask the operator for, and when
- Vercel login confirmation (Step 13)
- Whether to enable LLM mode, and the API key if so (Step 12) — wait to be given this, never invent or proceed without it
- Final go-ahead before `vercel deploy --prod`