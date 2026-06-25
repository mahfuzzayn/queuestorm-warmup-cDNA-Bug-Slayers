import { SortTicketRequest } from "@/lib/schema";
import type { SortTicketResponse } from "@/lib/schema";
import { classify } from "@/lib/classify";
import { summarize } from "@/lib/summarize";
import { enforceSafety } from "@/lib/safety";
import { refineSummary } from "@/lib/llm";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SortTicketRequest.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { ticket_id, message, locale } = parsed.data;

  const classification = classify(message, locale);

  let agentSummary = summarize(message, classification.case_type);

  const llmSummary = await refineSummary(message, classification.case_type, agentSummary);
  if (llmSummary !== null) {
    agentSummary = llmSummary;
  }

  agentSummary = enforceSafety(agentSummary, classification.case_type);

  const humanReviewRequired =
    classification.severity === "critical" ||
    classification.case_type === "phishing_or_social_engineering";

  const response: SortTicketResponse = {
    ticket_id,
    case_type: classification.case_type,
    severity: classification.severity,
    department: classification.department,
    agent_summary: agentSummary,
    human_review_required: humanReviewRequired,
    confidence: classification.confidence,
  };

  return Response.json(response);
}
