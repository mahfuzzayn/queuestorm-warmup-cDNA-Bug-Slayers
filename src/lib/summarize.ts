import type { SortTicketResponse } from "./schema";

type CaseType = SortTicketResponse["case_type"];

const summaryTemplates: Record<CaseType, string> = {
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

export function summarize(message: string, caseType: CaseType): string {
  const template = summaryTemplates[caseType];
  return template;
}
