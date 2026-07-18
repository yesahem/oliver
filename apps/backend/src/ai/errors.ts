export type GenerationErrorKind =
  | "timeout"
  | "api"
  | "invalid_response"
  | "write";

export class GenerationError extends Error {
  constructor(
    public readonly kind: GenerationErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export const GENERATION_ERROR_MESSAGES: Record<GenerationErrorKind, string> = {
  timeout: "Generation timed out.",
  api: "Unable to generate code.",
  invalid_response: "AI returned an invalid response.",
  write: "Unable to save generated files.",
};
