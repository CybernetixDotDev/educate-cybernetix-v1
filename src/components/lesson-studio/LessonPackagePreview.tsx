"use client";

import type { LessonGeneratorOutput } from "@/lib/lesson-studio/types";

type LessonPackagePreviewProps = {
  lesson: LessonGeneratorOutput | null;
};

export function LessonPackagePreview({ lesson }: LessonPackagePreviewProps) {
  if (!lesson) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Generated package</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Your lesson will appear here</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Save the brief, then generate the lesson package. The output will include the hook, teaching steps, video script,
          quiz, project checklist, and transcript.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Generated package</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{lesson.hook}</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PreviewCard title="Objectives" items={lesson.objective} />
        <PreviewCard title="Teaching steps" items={lesson.teaching_steps} />
        <PreviewCard title="Project checklist" items={lesson.project_checklist} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Build task</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.build_task.title}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {(lesson.build_task.instructions ?? []).map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Checkpoints</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {lesson.checkpoint.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl bg-[#f7faf9] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Tasks</p>
            <h3 className="mt-1 font-semibold text-slate-950">First-class lesson tasks</h3>
          </div>
          <p className="text-sm text-slate-600">{lesson.tasks.length} tasks</p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {lesson.tasks.map((task, index) => (
            <article key={task.task_id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-semibold text-slate-950">{task.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{task.instruction}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">Task ID</p>
                  <p className="mt-1">{task.task_id}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">Action</p>
                  <p className="mt-1">{task.action}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">Checkpoint</p>
                  <p className="mt-1">{task.checkpoint_type}</p>
                  {task.video_url && <p className="mt-1 break-all text-xs text-slate-500">{task.video_url}</p>}
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">AI verification</p>
                  <ul className="mt-1 space-y-1">
                    {task.ai_verification_criteria.map((criterion, criterionIndex) => (
                      <li key={`${criterion}-${criterionIndex}`}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {lesson.co_op_tasks.length > 0 && (
        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Co-Op task support layer</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {lesson.co_op_tasks.map((task, index) => (
              <article key={`${task.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                <p className="mt-2 text-sm text-slate-600">Video: {task.short_video.title} · {task.short_video.duration_minutes} min</p>
                <p className="mt-2 text-sm text-teal-800">Mentor: {task.ai_mentor_support.prompt_starter}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-teal-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">Final Submission</p>
        <h3 className="mt-1 font-semibold">Completion gate</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-semibold text-teal-50">Task checkpoints</p>
            <p className="mt-2 text-sm text-teal-100">
              {lesson.final_submission.required_task_checkpoints.length} required checkpoints:
              {" "}
              {lesson.final_submission.required_task_checkpoints.join(", ")}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-semibold text-teal-50">Final project upload</p>
            <p className="mt-2 text-sm text-teal-100">{lesson.final_submission.final_project_upload.prompt}</p>
            <p className="mt-1 text-xs text-teal-200">
              Formats: {lesson.final_submission.final_project_upload.accepted_formats.join(", ")}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-semibold text-teal-50">Micro-survey</p>
            <ul className="mt-2 space-y-1 text-sm text-teal-100">
              {lesson.final_submission.micro_survey.map((question) => (
                <li key={question.question_id}>{question.question}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="font-semibold text-teal-50">AI Mentor Final Review</p>
            <p className="mt-2 text-sm text-teal-100">{lesson.final_submission.ai_mentor_final_review.review_prompt}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[#f7faf9] p-5">
        <h3 className="font-semibold text-slate-950">Lesson blocks</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {lesson.lesson_blocks.map((block, index) => (
            <div key={`${block.type}-${block.title ?? block.value ?? index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{block.type}</p>
              {block.title && <h4 className="mt-2 font-semibold text-slate-950">{block.title}</h4>}
              {block.value && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{block.value}</p>}
              {block.url && <p className="mt-2 break-all text-xs text-slate-500">{block.url}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-50 p-5">
        <h3 className="font-semibold text-slate-950">Quiz</h3>
        <div className="mt-4 space-y-3">
          {lesson.quiz.questions.map((question, index) => (
            <div key={`${question.question}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">{question.question}</p>
              {question.options && (
                <p className="mt-2 text-sm text-slate-600">Options: {question.options.join(", ")}</p>
              )}
              <p className="mt-2 text-xs font-medium text-teal-700">Answer: {String(question.answer)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextPanel title="Video script" value={lesson.video_script} />
        <TextPanel title="Transcript" value={lesson.transcript} />
      </div>

      <div className="rounded-3xl bg-teal-950 p-5 text-white">
        <h3 className="font-semibold">Recap</h3>
        <p className="mt-2 text-sm leading-6 text-teal-50">{lesson.recap}</p>
        <p className="mt-4 text-sm font-semibold text-teal-100">Next: {lesson.next_step}</p>
      </div>
    </section>
  );
}

function PreviewCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TextPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}
