"use server";

export type GeneratePatchDiffResult = {
  ok: boolean;
  patch_diff: string | null;
  error: string | null;
};

function buildSimpleUnifiedDiff(originalCode: string, correctedCode: string) {
  const originalLines = originalCode.split("\n");
  const correctedLines = correctedCode.split("\n");
  const maxLength = Math.max(originalLines.length, correctedLines.length);
  const diffLines = ["--- original", "+++ corrected", "@@ -1 +1 @@"];

  for (let index = 0; index < maxLength; index += 1) {
    const original = originalLines[index];
    const corrected = correctedLines[index];

    if (original === corrected) {
      if (original !== undefined) diffLines.push(` ${original}`);
      continue;
    }

    if (original !== undefined) diffLines.push(`-${original}`);
    if (corrected !== undefined) diffLines.push(`+${corrected}`);
  }

  return diffLines.join("\n");
}

export async function generatePatchDiff(originalCode: string, correctedCode: string): Promise<GeneratePatchDiffResult> {
  try {
    if (!originalCode.trim()) throw new Error("original code is required");
    if (!correctedCode.trim()) throw new Error("corrected code is required");

    return { ok: true, patch_diff: buildSimpleUnifiedDiff(originalCode, correctedCode), error: null };
  } catch (error) {
    return { ok: false, patch_diff: null, error: error instanceof Error ? error.message : "Unable to generate patch diff" };
  }
}
