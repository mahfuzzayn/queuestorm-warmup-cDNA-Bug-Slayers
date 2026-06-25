import type { SortTicketResponse } from "./schema";
import { enforceSafety } from "./safety";

type CaseType = SortTicketResponse["case_type"];

const DEFAULT_MODEL = "google/gemini-2.5-flash";

/**
 * Optionally refines the agent_summary using an LLM via OpenRouter.
 * Returns null if LLM is disabled, key is missing, or the call fails.
 * Never modifies case_type, severity, department, or human_review_required.
 */
export async function refineSummary(
  message: string,
  caseType: CaseType,
  rulesSummary: string,
): Promise<string | null> {
  const enabled = process.env.LLM_ENABLED === "true";
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  if (!enabled || !apiKey) {
    return null;
  }

  const systemPrompt =
    "You are a customer support classifier assistant. " +
    "Given a customer message and a case type, produce ONE short neutral sentence summarizing the issue. " +
    "Do NOT include any sensitive information (PINs, OTPs, passwords, card numbers). " +
    "Do NOT echo the customer's message verbatim. Use generic, safe language.";

  const userPrompt = `Case type: ${caseType}\nCustomer message: ${message}\n\nProduce a short safe summary (one sentence).`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 100,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    return enforceSafety(content.trim(), caseType);
  } catch {
    return null;
  }
}
