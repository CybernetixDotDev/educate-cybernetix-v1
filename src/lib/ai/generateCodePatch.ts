"use server";

export type GenerateCodePatchResult = {
  ok: boolean;
  patch_diff: string | null;
  error: string | null;
};

function buildUnifiedDiff(originalCode: string, improvedCode: string) {
  const originalLines = originalCode.split("\n");
  const improvedLines = improvedCode.split("\n");
  const maxLength = Math.max(originalLines.length, improvedLines.length);
  const diffLines = ["--- original", "+++ improved", "@@ -1 +1 @@"];

  for (let index = 0; index < maxLength; index += 1) {
    const original = originalLines[index];
    const improved = improvedLines[index];

    if (original === improved) {
      if (original !== undefined) diffLines.push(` ${original}`);
      continue;
    }

    if (original !== undefined) diffLines.push(`-${original}`);
    if (improved !== undefined) diffLines.push(`+${improved}`);
  }

  return diffLines.join("\n");
}

export async function generateCodePatch(originalCode: string, improvedCode: string): Promise<GenerateCodePatchResult> {
  try {
    if (!originalCode.trim()) throw new Error("original code is required");
    if (!improvedCode.trim()) throw new Error("improved code is required");

    return { ok: true, patch_diff: buildUnifiedDiff(originalCode, improvedCode), error: null };
  } catch (error) {
    return { ok: false, patch_diff: null, error: error instanceof Error ? error.message : "Unable to generate code patch" };
  }
}
