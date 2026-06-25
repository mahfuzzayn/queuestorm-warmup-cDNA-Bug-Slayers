import { z } from "zod";

export const SortTicketRequest = z.object({
  ticket_id: z.string().min(1, "ticket_id is required"),
  channel: z.enum(["app", "sms", "call_center", "merchant_portal"]).optional(),
  locale: z.enum(["bn", "en", "mixed"]).optional(),
  message: z.string().min(1, "message is required"),
});

export type SortTicketRequest = z.infer<typeof SortTicketRequest>;

export const CaseType = z.enum([
  "wrong_transfer",
  "payment_failed",
  "refund_request",
  "phishing_or_social_engineering",
  "other",
]);

export const Severity = z.enum(["low", "medium", "high", "critical"]);

export const Department = z.enum([
  "customer_support",
  "dispute_resolution",
  "payments_ops",
  "fraud_risk",
]);

export const SortTicketResponse = z.object({
  ticket_id: z.string(),
  case_type: CaseType,
  severity: Severity,
  department: Department,
  agent_summary: z.string(),
  human_review_required: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export type SortTicketResponse = z.infer<typeof SortTicketResponse>;
