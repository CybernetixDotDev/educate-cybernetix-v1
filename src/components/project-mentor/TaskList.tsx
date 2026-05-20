"use client";

import { createClient } from "@/utils/supabase/client";
import type { ProjectTask } from "@/hooks/useProjectProgress";
import { useMemo, useState } from "react";

type TaskListProps = {
  tasks: ProjectTask[];
  onRefresh: () => Promise<unknown>;
  onSelectTask: (task: ProjectTask) => void;
  selectedTaskId: string | null;
};

const STATUSES = ["todo", "in-progress", "completed"] as const;

function evidenceRecord(task: ProjectTask) {
  return task.evidence && typeof task.evidence === "object" ? task.evidence : {};
}

function difficulty(task: ProjectTask) {
  const evidence = evidenceRecord(task);
  return typeof evidence.difficulty === "string" ? evidence.difficulty : "medium";
}

function skills(task: ProjectTask) {
  const evidence = evidenceRecord(task);
  return task.required_skills.length > 0
    ? task.required_skills
    : Array.isArray(evidence.skill_tags)
      ? evidence.skill_tags.filter((item): item is string => typeof item === "string")
      : [];
}

export function TaskList({ tasks, onRefresh, onSelectTask, selectedTaskId }: TaskListProps) {
  const supabase = useMemo(() => createClient(), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function beginEdit(task: ProjectTask) {
    setEditingId(task.id);
    setDraftTitle(task.title);
    setDraftDescription(task.description ?? "");
  }

  async function updateTask(task: ProjectTask, patch: Partial<ProjectTask>) {
    setBusyTaskId(task.id);
    setError(null);

    const { error: updateError } = await supabase
      .from("project_tasks")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", task.id);

    setBusyTaskId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditingId(null);
    await onRefresh();
  }

  async function deleteTask(task: ProjectTask) {
    setBusyTaskId(task.id);
    setError(null);
    const { error: deleteError } = await supabase.from("project_tasks").delete().eq("id", task.id);
    setBusyTaskId(null);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await onRefresh();
  }

  if (tasks.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-teal-300 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-950">No tasks yet</p>
        <p className="mt-2 text-sm text-slate-600">Ask Cyber Mentor to turn your idea into a few tiny build steps.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-teal-700">Mission Board</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Tiny build steps</h2>
          <p className="mt-1 text-sm text-slate-500">Keep each task small enough to finish in one focused session.</p>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-5 space-y-3">
        {tasks.map((task) => {
          const selected = selectedTaskId === task.id;
          const isEditing = editingId === task.id;

          return (
            <article
              key={task.id}
              className={`rounded-2xl border p-4 transition ${
                selected ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                  />
                  <textarea
                    value={draftDescription}
                    onChange={(event) => setDraftDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void updateTask(task, { title: draftTitle, description: draftDescription })}
                      className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button type="button" onClick={() => onSelectTask(task)} className="text-left">
                      <h3 className="text-base font-black text-slate-950">{task.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{task.description}</p>
                    </button>
                    <select
                      value={task.status === "done" ? "completed" : task.status}
                      onChange={(event) => void updateTask(task, { status: event.target.value })}
                      disabled={busyTaskId === task.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">{difficulty(task)}</span>
                    {skills(task).map((skill) => (
                      <span key={skill} className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => beginEdit(task)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateTask(task, { status: "completed", completed_at: new Date().toISOString() })}
                      className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Mark Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteTask(task)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
