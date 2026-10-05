import { ZodError } from "zod";

export type MutationResult = { error?: string };

export function adminErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return issue ? `${issue.path.join(".") || "Input"}: ${issue.message}` : "Review the submitted fields.";
  }
  if (error instanceof Error && /^(A (?:project|form|event) already uses|(?:Project|Form|Event|Member|Faculty member) not found\.|This form has \d+ responses?\.)/.test(error.message)) return error.message;
  return fallback;
}
