import "server-only";

import { compileMentorPrompt, type MentorRequest } from "@/lib/mentor/promptCompiler";

export type CompilePromptInput = MentorRequest | string;

export function compilePrompt(input: CompilePromptInput): string {
  if (typeof input === "string") return input;
  return compileMentorPrompt(input);
}
