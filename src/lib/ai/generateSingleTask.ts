"use server";

import {
  generateProjectTask,
  type GeneratedProjectTask,
  type ProjectTaskGenerationInput,
  type ProjectTaskGenerationResult,
} from "./generateProjectTasks";

export async function generateSingleTask(
  input: ProjectTaskGenerationInput,
  selectedTask: GeneratedProjectTask,
): Promise<ProjectTaskGenerationResult> {
  try {
    const taskList = await generateProjectTask(input, selectedTask);
    return { ok: true, taskList, error: null };
  } catch (error) {
    return {
      ok: false,
      taskList: null,
      error: error instanceof Error ? error.message : "Unable to regenerate project task",
    };
  }
}
