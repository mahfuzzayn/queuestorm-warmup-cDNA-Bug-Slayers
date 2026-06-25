import { describe, it, expect } from "vitest";
import { classify } from "../src/lib/classify";
import { summarize } from "../src/lib/summarize";
import { enforceSafety } from "../src/lib/safety";
import { SortTicketRequest, SortTicketResponse } from "../src/lib/schema";

// ── classify() tests ──────────────────────────────────────────────

describe("classify()", () => {
  it.each([
    {
      label: "phishing - OTP request",
      message: "Someone called asking for my OTP and PIN code",
      expectedCase: "phishing_or_social_engineering",
      expectedSeverity: "critical",
    },
    {
      label: "phishing - verification code",
      message: "They asked for my verification code and card number",
      expectedCase: "phishing_or_social_engineering",
      expectedSeverity: "critical",
    },
    {
      label: "wrong transfer",
      message: "I sent money to the wrong number please help",
      expectedCase: "wrong_transfer",
      expectedSeverity: "high",
    },
    {
      label: "payment failed",
      message: "My payment failed but the balance was deducted",
      expectedCase: "payment_failed",
      expectedSeverity: "high",
    },
    {
      label: "refund request",
      message: "I want a refund for my last transaction",
      expectedCase: "refund_request",
      expectedSeverity: "low",
    },
    {
      label: "refund - disputed",
      message: "This transaction was unauthorized, I want my money back",
      expectedCase: "refund_request",
      expectedSeverity: "high",
    },
    {
      label: "other - general complaint",
      message: "My app keeps crashing when I try to log in",
      expectedCase: "other",
      expectedSeverity: "low",
    },
    {
      label: "mixed bn/en - OTP",
      message: "কেউ ফোন করে আমার OTP and পিন চেয়েছে",
      expectedCase: "phishing_or_social_engineering",
      expectedSeverity: "critical",
    },
    {
      label: "Bangla - wrong transfer",
      message: "আমি ভুল নম্বরে টাকা পাঠিয়েছি",
      expectedCase: "wrong_transfer",
      expectedSeverity: "high",
    },
  ])("$label → $expectedCase / $expectedSeverity", ({ message, expectedCase, expectedSeverity }) => {
    const result = classify(message);
    expect(result.case_type).toBe(expectedCase);
    expect(result.severity).toBe(expectedSeverity);
  });
});

// ── summarize() tests ─────────────────────────────────────────────

describe("summarize()", () => {
  it("returns a template-based summary for each case type", () => {
    const cases = [
      "wrong_transfer",
      "payment_failed",
      "refund_request",
      "phishing_or_social_engineering",
      "other",
    ] as const;

    for (const caseType of cases) {
      const summary = summarize("some message", caseType);
      expect(summary).toBeTruthy();
      expect(typeof summary).toBe("string");
      // Summary should NOT contain the raw message text
      expect(summary).not.toContain("some message");
    }
  });
});

// ── enforceSafety() tests ─────────────────────────────────────────

describe("enforceSafety()", () => {
  it("replaces summary containing a PIN with safe fallback", () => {
    const summary = "Customer entered PIN 1234 for verification";
    const result = enforceSafety(summary, "other");
    expect(result).toBe("Customer reported a general issue requiring review.");
    expect(result).not.toContain("1234");
  });

  it("replaces summary containing card number", () => {
    const summary = "Card number 1234567890123456 was used";
    const result = enforceSafety(summary, "payment_failed");
    expect(result).not.toContain("1234567890123456");
  });

  it("passes through clean summaries unchanged", () => {
    const summary = "Customer reports a failed transaction.";
    const result = enforceSafety(summary, "payment_failed");
    expect(result).toBe(summary);
  });
});

// ── schema validation tests ───────────────────────────────────────

describe("SortTicketRequest schema", () => {
  it("accepts a valid request", () => {
    const result = SortTicketRequest.safeParse({
      ticket_id: "TKT-001",
      message: "I sent money to the wrong person",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = SortTicketRequest.safeParse({
      ticket_id: "TKT-001",
      channel: "app",
      locale: "bn",
      message: "ভুল নম্বরে টাকা পাঠিয়েছি",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing ticket_id", () => {
    const result = SortTicketRequest.safeParse({
      message: "test message",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing message", () => {
    const result = SortTicketRequest.safeParse({
      ticket_id: "TKT-001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = SortTicketRequest.safeParse({
      ticket_id: "TKT-001",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid channel", () => {
    const result = SortTicketRequest.safeParse({
      ticket_id: "TKT-001",
      message: "test",
      channel: "telegram",
    });
    expect(result.success).toBe(false);
  });
});

// ── full response schema tests ────────────────────────────────────

describe("SortTicketResponse schema", () => {
  it("validates a correct response shape", () => {
    const result = SortTicketResponse.safeParse({
      ticket_id: "TKT-001",
      case_type: "wrong_transfer",
      severity: "high",
      department: "dispute_resolution",
      agent_summary: "Customer reports sending money to an incorrect recipient.",
      human_review_required: false,
      confidence: 0.9,
    });
    expect(result.success).toBe(true);
  });
});
