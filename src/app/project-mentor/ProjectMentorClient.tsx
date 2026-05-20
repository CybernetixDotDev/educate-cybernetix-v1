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
    <main className="min-h-screen bg-[#f7faf9] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="rounded-3xl border border-teal-100 bg-white p-7 shadow-sm sm:p-9">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-teal-700 hover:text-teal-900">
              Back to home
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-teal-700">
              {student ? `${student.display_name}'s project mission` : "Project mission"}
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Build something real, one small step at a time.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Cyber Mentor turns your project idea into tiny tasks, helps when code breaks, and keeps the mission moving.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-900">
              You are here: My Project &rarr; Next step: Finish one task
            </div>
          </div>
          <Link
            href={projectId ? `/mentor?project_id=${projectId}&intent=project` : "/mentor?intent=project"}
            className="mt-6 inline-flex rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Ask Cyber Mentor
          </Link>
        </header>

        {(studentError || projectError || error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {studentError ?? projectError ?? error}
          </div>
        )}
        {status && <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{status}</div>}

        <ProjectOverview project={project} tasks={tasks} loading={pageLoading} />

        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
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
