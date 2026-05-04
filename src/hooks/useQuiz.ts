"use client";

import { createClient } from "@/utils/supabase/client";
import { useCallback, useMemo, useState } from "react";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options?: string[];
  correct_answer?: string | string[] | number | boolean | null;
  points?: number;
  metadata?: Record<string, unknown>;
};

export type QuizAnswer = string | string[] | number | boolean | null;

export type QuizStatus = "idle" | "in_progress" | "submitting" | "submitted" | "error";

export type QuizState = {
  status: QuizStatus;
  currentIndex: number;
  answers: Record<string, QuizAnswer>;
  score: number | null;
  passed: boolean | null;
  resultId: string | null;
  error: string | null;
};

export type SubmitQuizInput = {
  student_id: string;
  module_id?: string | null;
  lesson_id?: string | null;
  quiz_key: string;
  quiz_title?: string | null;
  passing_score?: number;
  feedback?: Record<string, unknown>;
};

export type UseQuizResult = {
  currentQuestion: QuizQuestion | null;
  answerQuestion: (questionId: string, answer: QuizAnswer) => void;
  nextQuestion: () => void;
  submitQuiz: (input: SubmitQuizInput) => Promise<{ score: number; passed: boolean; resultId: string | null } | null>;
  quizState: QuizState;
  previousQuestion: () => void;
  resetQuiz: () => void;
};

function answersMatch(expected: QuizQuestion["correct_answer"], actual: QuizAnswer) {
  if (expected === undefined || expected === null) {
    return false;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    return expected.length === actual.length && expected.every((value) => actual.includes(value));
  }

  return expected === actual;
}

export function useQuiz(questions: QuizQuestion[] = []): UseQuizResult {
  const supabase = useMemo(() => createClient(), []);
  const [quizState, setQuizState] = useState<QuizState>({
    status: questions.length > 0 ? "in_progress" : "idle",
    currentIndex: 0,
    answers: {},
    score: null,
    passed: null,
    resultId: null,
    error: null,
  });

  const currentQuestion = questions[quizState.currentIndex] ?? null;

  const answerQuestion = useCallback((questionId: string, answer: QuizAnswer) => {
    setQuizState((current) => ({
      ...current,
      status: "in_progress",
      answers: {
        ...current.answers,
        [questionId]: answer,
      },
      error: null,
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    setQuizState((current) => ({
      ...current,
      currentIndex: Math.min(current.currentIndex + 1, Math.max(questions.length - 1, 0)),
      status: questions.length > 0 ? "in_progress" : "idle",
      error: null,
    }));
  }, [questions.length]);

  const previousQuestion = useCallback(() => {
    setQuizState((current) => ({
      ...current,
      currentIndex: Math.max(current.currentIndex - 1, 0),
      error: null,
    }));
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizState({
      status: questions.length > 0 ? "in_progress" : "idle",
      currentIndex: 0,
      answers: {},
      score: null,
      passed: null,
      resultId: null,
      error: null,
    });
  }, [questions.length]);

  const submitQuiz = useCallback(
    async (input: SubmitQuizInput) => {
      if (!input.student_id) {
        setQuizState((current) => ({ ...current, status: "error", error: "student_id is required" }));
        return null;
      }

      if (!input.quiz_key) {
        setQuizState((current) => ({ ...current, status: "error", error: "quiz_key is required" }));
        return null;
      }

      setQuizState((current) => ({ ...current, status: "submitting", error: null }));

      try {
        const totalPoints = questions.reduce((sum, question) => sum + (question.points ?? 1), 0);
        const earnedPoints = questions.reduce((sum, question) => {
          const answer = quizState.answers[question.id];
          return answersMatch(question.correct_answer, answer) ? sum + (question.points ?? 1) : sum;
        }, 0);
        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;
        const passingScore = input.passing_score ?? 80;
        const passed = score >= passingScore;

        const { data, error } = await supabase
          .from("quiz_results")
          .insert({
            student_id: input.student_id,
            module_key: input.module_id ?? null,
            lesson_key: input.lesson_id ?? null,
            quiz_key: input.quiz_key,
            quiz_title: input.quiz_title ?? null,
            score,
            max_score: 100,
            passed,
            answers: quizState.answers,
            feedback: {
              ...(input.feedback ?? {}),
              total_questions: questions.length,
              earned_points: earnedPoints,
              total_points: totalPoints,
              passing_score: passingScore,
            },
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        const resultId = typeof data?.id === "string" ? data.id : null;
        setQuizState((current) => ({
          ...current,
          status: "submitted",
          score,
          passed,
          resultId,
          error: null,
        }));

        return { score, passed, resultId };
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to submit quiz";
        setQuizState((current) => ({ ...current, status: "error", error: message }));
        return null;
      }
    },
    [questions, quizState.answers, supabase],
  );

  return {
    currentQuestion,
    answerQuestion,
    nextQuestion,
    submitQuiz,
    quizState,
    previousQuestion,
    resetQuiz,
  };
}
