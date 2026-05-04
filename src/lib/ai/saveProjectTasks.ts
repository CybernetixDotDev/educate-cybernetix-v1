"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ProjectTasksJSON } from "./generateProjectTasks";

export type SaveProjectTasksResult = {
  ok: boolean;
  error: string | null;
};

function validate(taskList: ProjectTasksJSON) {
  const errors: string[] = [];
  if (!taskList.project_id) errors.push("project_id is required");
  if (!Array.isArray(taskList.tasks) || taskList.tasks.length === 0) errors.push("at least one task is required");

  taskList.tasks.forEach((task, index) => {
    if (!task.title.trim()) errors.push(`task ${index + 1} needs a title`);
    if (!["easy", "medium", "hard"].includes(task.difficulty)) errors.push(`task ${index + 1} has invalid difficulty`);
    if (!["todo", "in-progress", "done"].includes(task.status)) errors.push(`task ${index + 1} has invalid status`);
  });

  return errors;
}

function databaseStatus(status: string) {
  return status === "done" ? "completed" : status;
}

export async function saveProjectTasks(taskList: ProjectTasksJSON): Promise<SaveProjectTasksResult> {
  const errors = validate(taskList);
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  const supabase = createClient(await cookies());
  const now = new Date().toISOString();
  const rows = taskList.tasks.map((task, index) => ({
    student_project_id: taskList.project_id,
    title: task.title,
    description: task.description,
    status: databaseStatus(task.status),
    position: Number.isFinite(task.order_index) ? task.order_index : index,
    required_skills: task.skill_tags,
    evidence: {
      ai_generated: true,
      task_id: task.task_id,
      difficulty: task.difficulty,
      skill_tags: task.skill_tags,
      order_index: task.order_index,
      source_schema: "project_mentor_task_json",
    },
    completed_at: task.status === "done" ? now : null,
    updated_at: now,
  }));

  const { error } = await supabase.from("project_tasks").insert(rows);
  if (error) return { ok: false, error: error.message };

  await supabase.from("student_projects").update({ updated_at: now }).eq("id", taskList.project_id);
  revalidatePath("/project-mentor");
  return { ok: true, error: null };
}
