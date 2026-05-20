import type { CurriculumLessonJson, CurriculumQuizJson } from "@/lib/curriculum/validateLessonJson";

type LessonPreviewProps = {
  lesson?: CurriculumLessonJson | null;
  quiz?: CurriculumQuizJson | null;
};

export function LessonPreview({ lesson, quiz }: LessonPreviewProps) {
  if (!lesson && !quiz) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
        Upload valid lesson or quiz JSON to preview it here.
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {lesson && (
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Lesson Preview</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{lesson.title}</h2>
          <div className="mt-4 rounded-lg bg-cyan-50 p-4">
            <h3 className="text-sm font-semibold text-cyan-950">Objectives</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyan-900">
              {lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          </div>
          <div className="mt-5 space-y-4">
            {lesson.content.map((block, index) => (
              <article key={`${block.type}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">{block.type}</p>
                {block.title && <h4 className="mt-1 font-semibold text-slate-950">{block.title}</h4>}
                {block.type === "code" ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-50"><code>{block.value}</code></pre>
                ) : block.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.url ?? block.value} alt={block.alt ?? block.title ?? ""} className="mt-2 max-h-72 w-full rounded-lg object-cover" />
                ) : block.type === "video" ? (
                  <a href={block.url ?? block.value} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-cyan-700 hover:text-cyan-900">
                    Open video
                  </a>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{block.value ?? block.url}</p>
                )}
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-teal-50 p-4">
            <h3 className="text-sm font-semibold text-teal-950">Tasks</h3>
            <div className="mt-3 space-y-3">
              {lesson.tasks.map((task, index) => (
                <article key={task.task_id} className="rounded-lg border border-teal-100 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{task.task_id}</p>
                  <h4 className="mt-1 font-semibold text-slate-950">{index + 1}. {task.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{task.instruction}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Action: {task.action}</p>
                  <p className="mt-1 text-xs text-slate-500">Checkpoint: {task.checkpoint_type}</p>
                  {task.video_url && (
                    <a href={task.video_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-teal-700 hover:text-teal-900">
                      Open task video
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-slate-950 p-4 text-white">
            <h3 className="text-sm font-semibold text-teal-100">Final Submission</h3>
            <p className="mt-2 text-sm text-slate-200">
              Required checkpoints: {lesson.final_submission.required_task_checkpoints.join(", ")}
            </p>
            <p className="mt-2 text-sm text-slate-200">
              Final project: {lesson.final_submission.final_project_upload.prompt}
            </p>
            <div className="mt-3 rounded-lg bg-white/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-100">Micro-survey</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {lesson.final_submission.micro_survey.map((question) => (
                  <li key={question.question_id}>{question.question}</li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-sm text-slate-200">{lesson.final_submission.ai_mentor_final_review.review_prompt}</p>
          </div>
        </div>
      )}

      {(quiz ?? lesson?.quiz) && (
        <div className={lesson ? "mt-6 border-t border-slate-200 pt-6" : ""}>
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Quiz Preview</p>
          <div className="mt-4 space-y-3">
            {(quiz ?? lesson?.quiz)?.questions.map((question, index) => (
              <div key={`${question.question}-${index}`} className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{index + 1}. {question.question}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {question.options.map((option) => <li key={option}>{option}</li>)}
                </ul>
                <p className="mt-3 text-sm font-semibold text-emerald-700">Answer: {question.answer}</p>
                <p className="mt-1 text-sm text-slate-500">{question.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
