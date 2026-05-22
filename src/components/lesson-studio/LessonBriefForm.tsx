"use client";

import type { CheckpointType, HandsOnTaskRequirement, LessonBrief, QuizDifficulty, SkillLevel } from "@/lib/lesson-studio/types";

type LessonBriefFormProps = {
  value: LessonBrief;
  blueprints: Array<{ id: string; title: string; updated_at: string | null }>;
  selectedBlueprintId: string | null;
  onSelectBlueprint: (id: string) => void;
  onChange: (value: LessonBrief) => void;
};

const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const quizDifficulties: QuizDifficulty[] = ["easy", "medium", "hard"];
const checkpointTypes: CheckpointType[] = ["screenshot", "file", "link", "text"];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinLines(values: string[]) {
  return values.join("\n");
}

function taskCheckpointTypes(task: HandsOnTaskRequirement) {
  return task.checkpoint_types?.length ? task.checkpoint_types : [task.checkpoint_type];
}

export function LessonBriefForm({ value, blueprints, selectedBlueprintId, onSelectBlueprint, onChange }: LessonBriefFormProps) {
  function update<K extends keyof LessonBrief>(key: K, nextValue: LessonBrief[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function updateTask(index: number, patch: Partial<HandsOnTaskRequirement>) {
    update(
      "hands_on_task_requirements",
      value.hands_on_task_requirements.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)),
    );
  }

  function addTask() {
    if (value.hands_on_task_requirements.length >= 7) return;
    update("hands_on_task_requirements", [
      ...value.hands_on_task_requirements,
      {
        task_name: `Task ${value.hands_on_task_requirements.length + 1}`,
        instruction: "",
        short_video_requirement: "2-5 minute walkthrough video",
        student_action: "",
        checkpoint_types: ["screenshot"],
        checkpoint_type: "screenshot",
        ai_verification_criteria: [],
        ai_mentor_guidance: "",
        expected_output: "",
        difficulty_level: value.quiz_difficulty,
      },
    ]);
  }

  function removeTask(index: number) {
    update(
      "hands_on_task_requirements",
      value.hands_on_task_requirements.filter((_, taskIndex) => taskIndex !== index),
    );
  }

  function updateFinalProject<K extends keyof LessonBrief["final_project_submission_requirements"]>(
    key: K,
    nextValue: LessonBrief["final_project_submission_requirements"][K],
  ) {
    update("final_project_submission_requirements", {
      ...value.final_project_submission_requirements,
      [key]: nextValue,
    });
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Lesson brief</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Start with a clear teaching plan</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Define the lesson once, save it as a blueprint, then generate a structured lesson package from the same brief.
          </p>
        </div>

        {blueprints.length > 0 && (
          <label className="min-w-64 text-sm font-medium text-slate-700">
            Reuse a blueprint
            <select
              value={selectedBlueprintId ?? ""}
              onChange={(event) => onSelectBlueprint(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
            >
              <option value="">New blueprint</option>
              {blueprints.map((blueprint) => (
                <option key={blueprint.id} value={blueprint.id}>
                  {blueprint.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Lesson title
          <input
            value={value.lesson_title}
            onChange={(event) => update("lesson_title", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="How the Internet Works"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Subject area
          <input
            value={value.subject_area}
            onChange={(event) => update("subject_area", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="Web development"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Age range
          <input
            value={value.age_range}
            onChange={(event) => update("age_range", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="Ages 12-16"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Skill level
          <select
            value={value.skill_level}
            onChange={(event) => update("skill_level", event.target.value as SkillLevel)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
          >
            {skillLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700 lg:col-span-2">
          Learning objectives
          <textarea
            value={joinLines(value.learning_objectives)}
            onChange={(event) => update("learning_objectives", splitLines(event.target.value))}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder={"Understand DNS\nExplain client vs server\nDraw a request-response flow"}
          />
        </label>

        <label className="text-sm font-medium text-slate-700 lg:col-span-2">
          Required project outcome
          <input
            value={value.required_project_outcome}
            onChange={(event) => update("required_project_outcome", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="Student creates a simple internet request-response diagram."
          />
        </label>

        <div className="space-y-4 rounded-3xl border border-teal-100 bg-teal-50/60 p-5 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">Hands-On Task Requirements</h3>
              <p className="mt-1 text-sm text-slate-600">Define 5-7 guided tasks that the generated lesson must follow.</p>
            </div>
            <button
              type="button"
              onClick={addTask}
              disabled={value.hands_on_task_requirements.length >= 7}
              className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Task
            </button>
          </div>

          <div className="space-y-4">
            {value.hands_on_task_requirements.map((task, index) => (
              <article key={`${task.task_name}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Task {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Task Name
                    <input
                      value={task.task_name}
                      onChange={(event) => updateTask(index, { task_name: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Difficulty Level
                    <select
                      value={task.difficulty_level}
                      onChange={(event) => updateTask(index, { difficulty_level: event.target.value as QuizDifficulty })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    >
                      {quizDifficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                    Instruction (2-3 sentences)
                    <textarea
                      value={task.instruction}
                      onChange={(event) => updateTask(index, { instruction: event.target.value })}
                      className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Short Video Requirement
                    <input
                      value={task.short_video_requirement}
                      onChange={(event) => updateTask(index, { short_video_requirement: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                      placeholder="2-5 minute guided demo"
                    />
                  </label>
                  <div className="text-sm font-medium text-slate-700">
                    Checkpoint Types
                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {checkpointTypes.map((type) => {
                        const selected = taskCheckpointTypes(task).includes(type);
                        return (
                          <label key={type} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const current = taskCheckpointTypes(task);
                                const next = event.target.checked
                                  ? [...current, type]
                                  : current.filter((item) => item !== type);
                                const safeNext = next.length > 0 ? next : ["screenshot" as CheckpointType];
                                updateTask(index, { checkpoint_types: safeNext, checkpoint_type: safeNext[0] });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600"
                            />
                            {type}
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Select every format this checkpoint can accept.</p>
                  </div>
                  <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                    Student Action
                    <textarea
                      value={task.student_action}
                      onChange={(event) => updateTask(index, { student_action: event.target.value })}
                      className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    AI Verification Criteria
                    <textarea
                      value={joinLines(task.ai_verification_criteria)}
                      onChange={(event) => updateTask(index, { ai_verification_criteria: splitLines(event.target.value) })}
                      className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    AI Mentor Guidance
                    <textarea
                      value={task.ai_mentor_guidance}
                      onChange={(event) => updateTask(index, { ai_mentor_guidance: event.target.value })}
                      className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 lg:col-span-2">
                    Expected Output
                    <input
                      value={task.expected_output}
                      onChange={(event) => updateTask(index, { expected_output: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:col-span-2 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-slate-950">Final Project Submission Requirements</h3>
            <p className="mt-1 text-sm text-slate-600">Define the completion gate at the end of the lesson.</p>
          </div>
          <label className="text-sm font-medium text-slate-700">
            Required uploads
            <select
              multiple
              value={value.final_project_submission_requirements.required_uploads}
              onChange={(event) =>
                updateFinalProject(
                  "required_uploads",
                  Array.from(event.target.selectedOptions).map((option) => option.value as CheckpointType),
                )
              }
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            >
              {checkpointTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Submission checklist
            <textarea
              value={joinLines(value.final_project_submission_requirements.submission_checklist)}
              onChange={(event) => updateFinalProject("submission_checklist", splitLines(event.target.value))}
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Stretch goals
            <textarea
              value={joinLines(value.final_project_submission_requirements.stretch_goals)}
              onChange={(event) => updateFinalProject("stretch_goals", splitLines(event.target.value))}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Completion criteria
            <textarea
              value={joinLines(value.final_project_submission_requirements.completion_criteria)}
              onChange={(event) => updateFinalProject("completion_criteria", splitLines(event.target.value))}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Micro-survey questions
            <textarea
              value={joinLines(value.final_project_submission_requirements.micro_survey_questions)}
              onChange={(event) => updateFinalProject("micro_survey_questions", splitLines(event.target.value))}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            AI mentor feedback rules
            <textarea
              value={joinLines(value.final_project_submission_requirements.ai_mentor_feedback_rules)}
              onChange={(event) => updateFinalProject("ai_mentor_feedback_rules", splitLines(event.target.value))}
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            />
          </label>
        </div>

        <label className="text-sm font-medium text-slate-700 lg:col-span-2">
          Task verification criteria
          <textarea
            value={joinLines(value.task_verification_criteria ?? [])}
            onChange={(event) => update("task_verification_criteria", splitLines(event.target.value))}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder={"Diagram includes browser, DNS, server, and response\nStudent labels the request-response order\nStudent explains the flow in their own words"}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Required tools/software
          <textarea
            value={joinLines(value.required_tools)}
            onChange={(event) => update("required_tools", splitLines(event.target.value))}
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder={"Browser\nNotebook\nVS Code"}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Safety or compliance constraints
          <textarea
            value={joinLines(value.safety_constraints)}
            onChange={(event) => update("safety_constraints", splitLines(event.target.value))}
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder={"No external account setup required\nAvoid collecting personal data"}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Estimated duration
          <input
            value={value.estimated_duration}
            onChange={(event) => update("estimated_duration", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="30 minutes"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Tone/style
          <input
            value={value.tone_style}
            onChange={(event) => update("tone_style", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="Warm, simple, confident, StarterSchool-style"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Number of quiz questions
          <input
            type="number"
            min={1}
            max={20}
            value={value.quiz_question_count}
            onChange={(event) => update("quiz_question_count", Number(event.target.value))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Quiz difficulty
          <select
            value={value.quiz_difficulty}
            onChange={(event) => update("quiz_difficulty", event.target.value as QuizDifficulty)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
          >
            {quizDifficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700 lg:col-span-2">
          Optional reference notes
          <textarea
            value={value.reference_notes}
            onChange={(event) => update("reference_notes", event.target.value)}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder="Notes the generator should consider, but not override the brief."
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Optional example assets
          <textarea
            value={joinLines(value.example_assets)}
            onChange={(event) => update("example_assets", splitLines(event.target.value))}
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder={"https://example.com/diagram.png\nStarter project screenshot"}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Optional branding/theme tags
          <textarea
            value={joinLines(value.branding_theme_tags)}
            onChange={(event) => update("branding_theme_tags", splitLines(event.target.value))}
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-teal-500 focus:bg-white"
            placeholder={"premium\ncreator identity\ntech foundations"}
          />
        </label>
      </div>
    </section>
  );
}
