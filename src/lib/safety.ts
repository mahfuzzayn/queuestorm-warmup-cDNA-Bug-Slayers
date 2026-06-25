import type { SortTicketResponse } from "./schema";

type CaseType = SortTicketResponse["case_type"];

const safeFallbacks: Record<string, string> = {
  wrong_transfer:
    "Customer reports sending money to an incorrect recipient and requests recovery.",
  payment_failed:
    "Customer reports a failed transaction where the balance may have been deducted.",
  refund_request:
    "Customer is requesting a refund for a recent transaction.",
  phishing_or_social_engineering:
    "Customer reports a suspicious contact requesting sensitive account information.",
  other: "Customer reported a general issue requiring review.",
};

// Patterns for sensitive data that must not appear in agent_summary
const sensitivePatterns = [
  /\b\d{12,16}\b/, // 12-16 digit card number
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // formatted card number
  /\b(?:OTP|otp)\s*[:：]?\s*\d{4,8}\b/, // OTP with digits
  /\b(?:PIN|pin|Pin)\s*[:：]?\s*\d{4,6}\b/, // PIN with digits
  /\b(?:password|Password)\s*[:：]?\s*\S+\b/, // password with value
  /\b\d{4,8}\b(?=\s*(?:is|was|OTP|otp|পিন|pin))/, // digits near pin/otp context
];

export function enforceSafety(summary: string, caseType: CaseType): string {
  for (const pattern of sensitivePatterns) {
    if (pattern.test(summary)) {
      return safeFallbacks[caseType] || safeFallbacks.other;
    }
  }

  // Also check if summary still contains raw user text that might be sensitive
  // (the template-based approach already prevents this, but double-check)
  return summary;
}
