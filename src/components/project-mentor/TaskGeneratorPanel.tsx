"use client";

import type { GeneratedProjectTask, ProjectTasksJSON } from "@/lib/ai/generateProjectTasks";
import { useState } from "react";

type TaskGeneratorPanelProps = {
  suggestions: ProjectTasksJSON | null;
  loading: boolean;
  disabled: boolean;
  onGenerate: () => Promise<void>;
  onRegenerateSelected: () => Promise<void>;
  onAddTask: (task: GeneratedProjectTask) => void;
  onUpdateSuggestion: (taskId: string, patch: Partial<GeneratedProjectTask>) => void;
  onSave: () => Promise<void>;
};

const EMPTY_TASK: GeneratedProjectTask = {
  task_id: "",
  title: "",
  description: "",
  difficulty: "easy",
  skill_tags: [],
  order_index: 0,
  status: "todo",
};

function tags(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function TaskGeneratorPanel({
  suggestions,
  loading,
  disabled,
  onGenerate,
  onRegenerateSelected,
  onAddTask,
  onUpdateSuggestion,
  onSave,
}: TaskGeneratorPanelProps) {
  const [manualTask, setManualTask] = useState<GeneratedProjectTask>(EMPTY_TASK);

  function addManualTask() {
    if (!manualTask.title.trim()) return;
    onAddTask({
      ...manualTask,
      task_id: manualTask.task_id || crypto.randomUUID(),
      order_index: suggestions?.tasks.length ?? 0,
    });
    setManualTask(EMPTY_TASK);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Cyber Mentor Planning</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Create the next build steps</h2>
        <p className="mt-1 text-sm text-slate-500">Preview the plan, make changes, then save it to your mission board.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={disabled || loading}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Create Step Plan"}
        </button>
        <button
          type="button"
          onClick={() => void onRegenerateSelected()}
          disabled={disabled || loading}
          className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-bold text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Improve Selected Step
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!suggestions || loading}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Steps
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-900">Add your own step</p>
        <div className="mt-3 grid gap-3">
          <input
            value={manualTask.title}
            onChange={(event) => setManualTask((task) => ({ ...task, title: event.target.value }))}
            placeholder="Task title"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            value={manualTask.description}
            onChange={(event) => setManualTask((task) => ({ ...task, description: event.target.value }))}
            placeholder="Step-by-step task description"
            rows={3}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={manualTask.difficulty}
              onChange={(event) =>
                setManualTask((task) => ({ ...task, difficulty: event.target.value as GeneratedProjectTask["difficulty"] }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <input
              value={manualTask.skill_tags.join(", ")}
              onChange={(event) => setManualTask((task) => ({ ...task, skill_tags: tags(event.target.value) }))}
              placeholder="skills, comma separated"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button type="button" onClick={addManualTask} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white">
            Add Step
          </button>
        </div>
      </div>

      {suggestions && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-black text-slate-900">Suggested steps</p>
          {suggestions.tasks.map((task, index) => (
            <article key={task.task_id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-black text-teal-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    value={task.title}
                    onChange={(event) => onUpdateSuggestion(task.task_id, { title: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                  />
                  <textarea
                    value={task.description}
                    onChange={(event) => onUpdateSuggestion(task.task_id, { description: event.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select
                      value={task.difficulty}
                      onChange={(event) =>
                        onUpdateSuggestion(task.task_id, { difficulty: event.target.value as GeneratedProjectTask["difficulty"] })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                    <select
                      value={task.status}
                      onChange={(event) =>
                        onUpdateSuggestion(task.task_id, { status: event.target.value as GeneratedProjectTask["status"] })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="todo">todo</option>
                      <option value="in-progress">in-progress</option>
                      <option value="done">done</option>
                    </select>
                    <input
                      value={task.skill_tags.join(", ")}
                      onChange={(event) => onUpdateSuggestion(task.task_id, { skill_tags: tags(event.target.value) })}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
