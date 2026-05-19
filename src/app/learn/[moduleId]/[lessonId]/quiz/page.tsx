"use client";

import { QuizQuestion } from "@/components/learning/QuizQuestion";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { type QuizAnswer, useQuiz } from "@/hooks/useQuiz";
import { useStudent } from "@/hooks/useStudent";
import { getCanonicalLessonId, getLesson, type Lesson } from "@/lib/lessons/getLesson";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function getSkill(questionMetadata: Record<string, unknown> | undefined) {
  return typeof questionMetadata?.skill === "string" ? questionMetadata.skill : "general";
}

function isCorrect(expected: unknown, actual: QuizAnswer | undefined) {
  if (expected === null || expected === undefined) {
    return Boolean(actual);
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    return expected.length === actual.length && expected.every((item) => actual.includes(item));
  }

  return expected === actual;
}

export default function QuizPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>();
  const router = useRouter();
  const moduleId = params.moduleId;
  const lessonId = params.lessonId;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { completeLesson } = useLessonProgress({ studentId: student?.id ?? null, moduleId });
  const questions = useMemo(() => lesson?.quiz.questions ?? [], [lesson]);
  const {
    currentQuestion,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
    quizState,
  } = useQuiz(questions);
  const currentAnswer = currentQuestion ? quizState.answers[currentQuestion.id] : undefined;
  const isFinalQuestion = quizState.currentIndex >= questions.length - 1;
  const answered = currentQuestion ? quizState.answers[currentQuestion.id] !== undefined : false;
  const skillFeedback = useMemo(() => {
    const totals = new Map<string, { correct: number; total: number }>();

    for (const question of questions) {
      const skill = getSkill(question.metadata);
      const current = totals.get(skill) ?? { correct: 0, total: 0 };
      current.total += 1;

      if (isCorrect(question.correct_answer, quizState.answers[question.id])) {
        current.correct += 1;
      }

      totals.set(skill, current);
    }

    const scored = Array.from(totals.entries()).map(([skill, value]) => ({
      skill,
      score: value.total > 0 ? Math.round((value.correct / value.total) * 100) : 0,
    }));

    return {
      strong: scored.filter((item) => item.score >= 80).map((item) => item.skill),
      weak: scored.filter((item) => item.score < 80).map((item) => item.skill),
    };
  }, [questions, quizState.answers]);

  useEffect(() => {
    let active = true;
    const canonicalLessonId = getCanonicalLessonId(moduleId, lessonId);

    if (canonicalLessonId !== lessonId) {
      router.replace(`/learn/${moduleId}/${canonicalLessonId}/quiz`);
    }

    void getLesson(moduleId, canonicalLessonId)
      .then((loadedLesson) => {
        if (active) {
          setLesson(loadedLesson);
          setLessonError(null);

          if (loadedLesson.lessonId !== canonicalLessonId) {
            router.replace(`/learn/${loadedLesson.moduleId}/${loadedLesson.lessonId}/quiz`);
          }
        }
      })
      .catch((error) => {
        if (active) {
          setLessonError(error instanceof Error ? error.message : "Unable to load quiz");
        }
      });

    return () => {
      active = false;
    };
  }, [lessonId, moduleId, router]);

  async function handleSubmit() {
    if (!student || !lesson) {
      return;
    }

    const result = await submitQuiz({
      student_id: student.id,
      module_id: moduleId,
      lesson_id: lesson.lessonId,
      quiz_key: lesson.quiz.quiz_key,
      quiz_title: lesson.quiz.title,
      passing_score: lesson.quiz.passing_score,
      feedback: {
        strong_skills: skillFeedback.strong,
        weak_skills: skillFeedback.weak,
      },
    });

    if (result?.passed) {
      await completeLesson(lesson.lessonId, {
        module_id: moduleId,
        lesson_title: lesson.title,
        score: result.score,
        completed_steps: ["lesson_quiz_passed"],
        metadata: {
          quiz_result_id: result.resultId,
          strong_skills: skillFeedback.strong,
          weak_skills: skillFeedback.weak,
        },
      });
    }
  }

  if (lessonError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Quiz unavailable</h1>
          <p className="mt-2 text-slate-600">{lessonError}</p>
        </section>
      </main>
    );
  }

  if (!lesson || studentLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-24 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (quizState.status === "submitted") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Mastery Feedback</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">{quizState.score ?? 0}%</h1>
          <p className="mt-3 text-slate-600">
            {quizState.passed
              ? "Strong work. This lesson is now marked complete."
              : "Good attempt. Review the weak skills, ask the mentor for a hint, and retry when ready."}
          </p>

          <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-4">
              <h2 className="text-sm font-semibold text-emerald-950">Strong Skills</h2>
              <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                {skillFeedback.strong.length > 0 ? (
                  skillFeedback.strong.map((skill) => <li key={skill}>- {skill}</li>)
                ) : (
                  <li>No strong skills detected yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <h2 className="text-sm font-semibold text-amber-950">Weak Skills</h2>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {skillFeedback.weak.length > 0 ? (
                  skillFeedback.weak.map((skill) => <li key={skill}>- {skill}</li>)
                ) : (
                  <li>No priority weak skills detected.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={resetQuiz}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
            >
              Retry Quiz
            </button>
            <Link
              href={`/learn/${moduleId}/${lesson.lessonId}`}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Return to Lesson
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">{lesson.quiz.title}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">{lesson.title}</h1>
          </div>
          <Link href={`/learn/${moduleId}/${lesson.lessonId}`} className="text-sm font-semibold text-cyan-700">
            Return to Lesson
          </Link>
        </div>

        {(studentError || quizState.error) && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {studentError ?? quizState.error}
          </div>
        )}

        <div className="rounded-lg bg-white p-3 shadow-sm">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-cyan-500"
              style={{ width: `${questions.length > 0 ? ((quizState.currentIndex + 1) / questions.length) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Question {quizState.currentIndex + 1} of {questions.length}
          </p>
        </div>

        {currentQuestion && (
          <QuizQuestion
            question={currentQuestion}
            answer={currentAnswer}
            onAnswer={(answer) => answerQuestion(currentQuestion.id, answer)}
          />
        )}

        <div className="flex flex-wrap justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={previousQuestion}
            disabled={quizState.currentIndex === 0}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Previous
          </button>
          {isFinalQuestion ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!student || !answered || quizState.status === "submitting"}
              className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {quizState.status === "submitting" ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={!answered}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
