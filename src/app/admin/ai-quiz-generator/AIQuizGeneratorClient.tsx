"use client";

import { GeneratedQuizPreview } from "@/components/ai-quiz-generator/GeneratedQuizPreview";
import { QuizActions } from "@/components/ai-quiz-generator/QuizActions";
import { QuizGenerationForm, type QuizModuleOption } from "@/components/ai-quiz-generator/QuizGenerationForm";
import { generateQuiz, type GeneratedQuiz, type QuizGenerationInput } from "@/lib/ai/generateQuiz";
import { generateSingleQuestion } from "@/lib/ai/generateSingleQuestion";
import { saveGeneratedQuiz } from "@/lib/ai/saveGeneratedQuiz";
import { useState } from "react";

type AIQuizGeneratorClientProps = {
  modules: QuizModuleOption[];
};

const DEFAULT_INPUT: QuizGenerationInput = {
  module_id: "",
  lesson_id: null,
  quiz_type: "lesson",
  weak_skills: [],
  strong_skills: [],
};

export function AIQuizGeneratorClient({ modules }: AIQuizGeneratorClientProps) {
  const [input, setInput] = useState<QuizGenerationInput>(DEFAULT_INPUT);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateInput() {
    if (!input.module_id) {
      setError("module_id is required");
      return false;
    }

    if (input.quiz_type === "lesson" && !input.lesson_id) {
      setError("lesson_id is required for lesson quizzes");
      return false;
    }

    if (input.quiz_type === "remediation" && input.weak_skills.length === 0) {
      setError("Select at least one weak skill for remediation quizzes");
      return false;
    }

    if (input.quiz_type === "challenge" && input.strong_skills.length === 0) {
      setError("Select at least one strong skill for challenge quizzes");
      return false;
    }

    return true;
  }

  async function handleGenerate() {
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await generateQuiz(input);

      if (!result.ok || !result.quiz) {
        setError(result.error ?? "Quiz generation failed");
        return;
      }

      setQuiz(result.quiz);
      setSelectedQuestion(0);
      setStatus("Quiz generated");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateQuestion() {
    if (!quiz || !validateInput()) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await generateSingleQuestion(input, selectedQuestion);

      if (!result.ok || !result.quiz || !result.quiz.questions[0]) {
        setError(result.error ?? "Question regeneration failed");
        return;
      }

      setQuiz({
        ...quiz,
        questions: quiz.questions.map((question, index) =>
          index === selectedQuestion ? result.quiz!.questions[0] : question,
        ),
      });
      setStatus(`Question ${selectedQuestion + 1} regenerated`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!quiz) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await saveGeneratedQuiz(quiz);

      if (!result.ok) {
        setError(result.error ?? "Unable to save quiz");
        return;
      }

      setStatus("Quiz saved to Supabase");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <QuizGenerationForm modules={modules} value={input} onChange={setInput} />
      <QuizActions
        hasQuiz={Boolean(quiz)}
        loading={loading}
        selectedQuestion={selectedQuestion}
        onGenerate={() => void handleGenerate()}
        onRegenerateQuestion={() => void handleRegenerateQuestion()}
        onSave={() => void handleSave()}
        onSelectedQuestionChange={setSelectedQuestion}
        questionCount={quiz?.questions.length ?? 0}
      />

      {loading && <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">Generating...</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {status && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{status}</div>}

      <GeneratedQuizPreview quiz={quiz} onChange={setQuiz} />
    </div>
  );
}
