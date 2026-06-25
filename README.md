# 🌀 QueueStorm — Ticket Sorter

**bKash SUST CSE Carnival 2026 — Mock Preliminary**

A JSON API that classifies customer support messages into case type, severity, department, safe summary, and review flag. Built with Next.js 16, TypeScript, and Zod. Deployed on Vercel.

**Team:** cdna-bug-slayers

---

## Quick Start

```bash
npm install            # Install dependencies
npm run dev            # Start dev server at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you'll see the neobrutalism-style UI where you can:

1. **Click a sample** on the left to auto-fill the form
2. **Click "Sort Ticket"** to classify it
3. **See the result** with badges, summary, confidence, and review flag

---

## What It Does

| Scenario | Example Message | Result |
|---|---|---|
| Phishing attempt | "Someone called asking for my OTP" | `phishing_or_social_engineering` — **Critical** → Fraud Risk |
| Wrong transfer | "I sent money to the wrong number" | `wrong_transfer` — **High** → Dispute Resolution |
| Payment failed | "Payment failed but balance deducted" | `payment_failed` — **High** → Payments Ops |
| Refund request | "I want my money back" | `refund_request` — **Low** → Customer Support |
| General issue | "My app keeps crashing" | `other` — **Low** → Customer Support |

Messages in Bangla (e.g. `আমি ভুল নম্বরে টাকা পাঠিয়েছি`) are also classified correctly.

---

## API Endpoints

### `GET /health`

Returns `{ "status": "ok" }`. Used to verify the server is running.

```bash
curl http://localhost:3000/health
```

### `POST /sort-ticket`

Classifies a customer support message.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ticket_id` | string | Yes | Unique identifier for the ticket |
| `message` | string | Yes | The customer's message to classify |
| `channel` | string | No | One of: `app`, `sms`, `call_center`, `merchant_portal` |
| `locale` | string | No | One of: `en`, `bn`, `mixed` |

**Example:**

```bash
curl -X POST http://localhost:3000/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "TKT-001",
    "message": "Someone called asking for my OTP and PIN code",
    "channel": "call_center"
  }'
```

**Response:**

```json
{
  "ticket_id": "TKT-001",
  "case_type": "phishing_or_social_engineering",
  "severity": "critical",
  "department": "fraud_risk",
  "agent_summary": "Customer reports a suspicious contact requesting sensitive account information.",
  "human_review_required": true,
  "confidence": 0.9
}
```

**Response fields:**

| Field | Description |
|---|---|
| `case_type` | `wrong_transfer`, `payment_failed`, `refund_request`, `phishing_or_social_engineering`, or `other` |
| `severity` | `low`, `medium`, `high`, or `critical` |
| `department` | `customer_support`, `dispute_resolution`, `payments_ops`, or `fraud_risk` |
| `agent_summary` | Safe, neutral one-sentence summary (never contains PIN/OTP/passwords) |
| `human_review_required` | `true` if critical severity or phishing case |
| `confidence` | Score from 0 to 1 indicating classification confidence |

---

## Testing

```bash
npx vitest run
```

Tests cover:
- All 5 case types (phishing, wrong transfer, payment failed, refund, other)
- Bangla language messages
- Schema validation (missing fields, invalid values)
- Safety filter (PIN/OTP/card numbers blocked from summaries)

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_ENABLED` | No | `false` | Set to `true` to enable LLM refinement of summaries |
| `OPENROUTER_API_KEY` | No | — | OpenRouter API key for LLM (get at [openrouter.ai/keys](https://openrouter.ai/keys)) |
| `LLM_MODEL` | No | `google/gemini-2.5-flash` | Model to use for LLM refinement |

Copy `.env.example` to `.env.local` and fill in values if needed.

LLM is optional — when disabled or when the API call fails, the rules engine handles everything. Classification (case_type, severity, department) is always rule-based; the LLM only refines the summary text.

---

## Project Structure

```
src/
  app/
    health/route.ts          # GET /health endpoint
    sort-ticket/route.ts     # POST /sort-ticket endpoint
    page.tsx                 # Neobrutalism UI frontend
    layout.tsx               # Root layout
    globals.css              # Tailwind v4 + neobrutalism theme
  lib/
    schema.ts                # Zod request/response schemas
    classify.ts              # Rules-based classifier (keyword + regex)
    summarize.ts             # Template-based safe summary builder
    safety.ts                # PIN/OTP/password/card filter
    llm.ts                   # Optional LLM refinement (OpenRouter)
tests/
  sort-ticket.test.ts        # Vitest tests
```

---

## How Classification Works

**Rules-based (always runs, no external calls):**

1. Priority-ordered keyword/regex matching against the message
2. Phishing/social engineering checked **first** (highest risk)
3. Each match maps to a case type, severity, and department
4. Confidence score based on match strength (0.9 strong, 0.4 default)

**Safety filter (always runs, no exceptions):**

The `enforceSafety()` function scans every response summary for PINs, OTPs, passwords, and card numbers. If found, the summary is replaced with a safe fallback template. This is graded automatically and must never fail.

**LLM refinement (optional, env-flagged):**

When `LLM_ENABLED=true` and an OpenRouter key is configured, the agent summary is refined by an LLM. If the LLM call fails or times out, the rules-based summary is used as-is.

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel login                                # Authenticate in browser
vercel link                                 # Link to Vercel project
vercel env add LLM_ENABLED                  # Set to "true" or "false"
vercel env add OPENROUTER_API_KEY           # Only if using LLM
vercel env add LLM_MODEL                    # Optional, defaults to google/gemini-2.5-flash
vercel deploy --prod
```

After deployment, verify:
```bash
curl https://<your-project>.vercel.app/health
curl -X POST https://<your-project>.vercel.app/sort-ticket \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"TKT-001","message":"I sent money to the wrong number"}'
```

---

## Runbook (Redeploy from Scratch)

If the live URL is down and needs to be re-deployed by an organizer:

1. **Clone** the repository: `git clone <repo-url> && cd <repo-name>`
2. **Install** dependencies: `npm install`
3. **Set env vars** in Vercel dashboard:
   - Add `LLM_ENABLED` → `false` (or `true` if LLM is desired)
   - Add `OPENROUTER_API_KEY` → your key (only if LLM enabled)
4. **Deploy**: `npx vercel --prod`
5. **Verify**: `curl https://<project>.vercel.app/health`
6. **Test**: 
   ```bash
   curl -X POST https://<project>.vercel.app/sort-ticket \
     -H "Content-Type: application/json" \
     -d '{"ticket_id":"TKT-001","message":"My payment failed but the balance was deducted"}'
   ```

---

## Hard Constraints

- ✅ No GPU dependency
- ✅ `agent_summary` never contains PIN, OTP, password, or full card numbers
- ✅ Rules-based classification works with zero external API calls
- ✅ LLM is optional, env-flagged, and fails safe to the rules engine
- ✅ No secrets committed to git (all via `.env.local` or Vercel env vars)
- ✅ `/health` responds within 10s, `/sort-ticket` within 30s
