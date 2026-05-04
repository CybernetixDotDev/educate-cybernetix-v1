"use client";

import { BuilderChatPanel } from "@/components/project-mentor/BuilderChatPanel";
import { ProjectOverview } from "@/components/project-mentor/ProjectOverview";
import { TaskGeneratorPanel } from "@/components/project-mentor/TaskGeneratorPanel";
import { TaskList } from "@/components/project-mentor/TaskList";
import { useProjectProgress, type ProjectTask } from "@/hooks/useProjectProgress";
import { useStudent } from "@/hooks/useStudent";
import { generateProjectTasks, type GeneratedProjectTask, type ProjectTasksJSON } from "@/lib/ai/generateProjectTasks";
import { generateSingleTask } from "@/lib/ai/generateSingleTask";
import { saveProjectTasks } from "@/lib/ai/saveProjectTasks";
import Link from "next/link";
import { useMemo, useState } from "react";

function taskFromProjectTask(task: ProjectTask): GeneratedProjectTask {
  const evidence = task.evidence && typeof task.evidence === "object" ? task.evidence : {};
  const difficulty =
    evidence.difficulty === "easy" || evidence.difficulty === "medium" || evidence.difficulty === "hard"
      ? evidence.difficulty
      : "medium";

  return {
    task_id: typeof evidence.task_id === "string" ? evidence.task_id : task.id,
    title: task.title,
    description: task.description ?? "",
    difficulty,
    skill_tags: task.required_skills,
    order_index: task.position,
    status: task.status === "completed" ? "done" : task.status === "in-progress" ? "in-progress" : "todo",
  };
}

export function ProjectMentorClient() {
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { project, tasks, loading: projectLoading, error: projectError, refresh } = useProjectProgress({
    studentId: student?.id ?? null,
  });
  const [suggestions, setSuggestions] = useState<ProjectTasksJSON | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageLoading = studentLoading || projectLoading;
  const projectId = project?.id ?? null;
  const selectedGeneratedTask = useMemo(
    () => (selectedTask ? taskFromProjectTask(selectedTask) : suggestions?.tasks[0] ?? null),
    [selectedTask, suggestions],
  );

  async function run(action: string, callback: () => Promise<void>) {
    setLoadingAction(action);
    setError(null);
    setStatus(null);

    try {
      await callback();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Project mentor action failed");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGenerate() {
    if (!projectId) {
      setError("Create or select a project before generating tasks.");
      return;
    }

    await run("generate", async () => {
      const result = await generateProjectTasks({ project_id: projectId });
      if (!result.ok || !result.taskList) throw new Error(result.error ?? "Unable to generate tasks");
      setSuggestions(result.taskList);
      setStatus("AI task list generated. Review and edit before saving.");
    });
  }

  async function handleRegenerateSelected() {
    if (!projectId || !selectedGeneratedTask) {
      setError("Select an existing or generated task to regenerate.");
      return;
    }

    await run("regenerate", async () => {
      const result = await generateSingleTask({ project_id: projectId }, selectedGeneratedTask);
      if (!result.ok || !result.taskList) throw new Error(result.error ?? "Unable to regenerate task");
      const replacement = result.taskList.tasks[0];
      if (!replacement) throw new Error("AI did not return a replacement task");

      setSuggestions((current) => {
        if (!current) return { project_id: projectId, tasks: [replacement] };
        const targetId = selectedGeneratedTask.task_id;
        const exists = current.tasks.some((task) => task.task_id === targetId);
        return {
          project_id: current.project_id,
          tasks: exists
            ? current.tasks.map((task) => (task.task_id === targetId ? replacement : task))
            : [...current.tasks, replacement],
        };
      });
      setStatus("Selected task regenerated.");
    });
  }

  function handleAddTask(task: GeneratedProjectTask) {
    if (!projectId) return;
    setSuggestions((current) => ({
      project_id: current?.project_id ?? projectId,
      tasks: [...(current?.tasks ?? []), task],
    }));
    setStatus("Manual task added to preview.");
  }

  function handleUpdateSuggestion(taskId: string, patch: Partial<GeneratedProjectTask>) {
    setSuggestions((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) => (task.task_id === taskId ? { ...task, ...patch } : task)),
          }
        : current,
    );
  }

  async function handleSave() {
    if (!suggestions) return;

    await run("save", async () => {
      const result = await saveProjectTasks(suggestions);
      if (!result.ok) throw new Error(result.error ?? "Unable to save project tasks");
      setSuggestions(null);
      await refresh();
      setStatus("Tasks saved to your project.");
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-violet-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-cyan-700 hover:text-cyan-900">
              Dashboard
            </Link>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-violet-700">
              {student ? `${student.display_name}'s builder workspace` : "Builder workspace"}
            </p>
          </div>
          <Link
            href={projectId ? `/mentor?project_id=${projectId}&mode=builder` : "/mentor"}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm"
          >
            Open Full Mentor
          </Link>
        </header>

        {(studentError || projectError || error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {studentError ?? projectError ?? error}
          </div>
        )}
        {status && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">{status}</div>}

        <ProjectOverview project={project} tasks={tasks} loading={pageLoading} />

        <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
          <div className="space-y-6">
            <TaskList
              tasks={tasks}
              onRefresh={refresh}
              onSelectTask={setSelectedTask}
              selectedTaskId={selectedTask?.id ?? null}
            />
            <TaskGeneratorPanel
              suggestions={suggestions}
              loading={Boolean(loadingAction)}
              disabled={!projectId}
              onGenerate={handleGenerate}
              onRegenerateSelected={handleRegenerateSelected}
              onAddTask={handleAddTask}
              onUpdateSuggestion={handleUpdateSuggestion}
              onSave={handleSave}
            />
          </div>
          <BuilderChatPanel studentId={student?.id ?? null} projectId={projectId} />
        </div>
      </div>
    </main>
  );
}
