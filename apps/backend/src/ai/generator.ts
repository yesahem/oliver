import Anthropic from "@anthropic-ai/sdk";
import { GenerationError } from "./errors";

// Foundations: centralize the model id so it can be swapped in one place.
export const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 16384;
const REQUEST_TIMEOUT_MS = 120_000;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new GenerationError("api", "ANTHROPIC_API_KEY is not configured");
    }
    // maxRetries: 1 retries transient failures (5xx/connection) once.
    client = new Anthropic({
      apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return client;
}

export async function generateCode(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  let response;
  try {
    response = await getClient().messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      // Overall cap across the initial attempt + the one retry.
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
  } catch (error) {
    if (
      error instanceof Anthropic.APIConnectionTimeoutError ||
      error instanceof Anthropic.APIUserAbortError ||
      (error instanceof Error && error.name === "TimeoutError")
    ) {
      throw new GenerationError("timeout", "Claude request timed out");
    }
    if (error instanceof GenerationError) throw error;
    throw new GenerationError(
      "api",
      error instanceof Error ? error.message : "Claude request failed",
    );
  }

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
