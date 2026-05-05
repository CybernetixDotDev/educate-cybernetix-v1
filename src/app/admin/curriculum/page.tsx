import { JsonUploadPanel } from "@/components/curriculum/JsonUploadPanel";
import { LessonList, type CurriculumLesson } from "@/components/curriculum/LessonList";
import { ModuleList, type CurriculumModule } from "@/components/curriculum/ModuleList";
import { VersionHistory, type CurriculumVersion } from "@/components/curriculum/VersionHistory";
import { requireRole } from "@/lib/auth/roles";
import { getLessonVersions } from "@/lib/curriculum/getLessonVersions";
import { getQuizVersions } from "@/lib/curriculum/getQuizVersions";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type CurriculumPageProps = {
  searchParams: Promise<{
    moduleId?: string;
    lessonId?: string;
  }>;
};

type QuizRow = {
  id: string;
  lesson_id: string;
  current_version_id: string | null;
};

async function CurriculumContent({ moduleId, lessonId }: { moduleId?: string; lessonId?: string }) {
  const role = await requireRole(["admin"]);
  if (!role) redirect("/auth?next=/admin/curriculum");

  const supabase = createClient(await cookies());
  const [{ data: moduleRows, error: moduleError }, { data: lessonRows, error: lessonError }, { data: quizRows }] =
    await Promise.all([
      supabase.from("modules").select("id, title, description, order_index").order("order_index", { ascending: true }),
      supabase.from("lessons").select("id, module_id, title, order_index, current_version_id").order("order_index", { ascending: true }),
      supabase.from("quizzes").select("id, lesson_id, current_version_id"),
    ]);

  if (moduleError) throw new Error(moduleError.message);
  if (lessonError) throw new Error(lessonError.message);

  const modules = (moduleRows ?? []) as CurriculumModule[];
  const quizzes = (quizRows ?? []) as QuizRow[];
  const selectedModuleId = moduleId ?? modules[0]?.id ?? null;
  const moduleLessons = ((lessonRows ?? []) as CurriculumLesson[])
    .filter((lesson) => lesson.module_id === selectedModuleId)
    .map((lesson) => ({
      ...lesson,
      quizzes: quizzes.filter((quiz) => quiz.lesson_id === lesson.id),
    }));
  const selectedLessonId = lessonId ?? moduleLessons[0]?.id ?? null;
  const selectedLesson = moduleLessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const selectedQuiz = selectedLesson ? quizzes.find((quiz) => quiz.lesson_id === selectedLesson.id) ?? null : null;
  const lessonVersions = selectedLesson ? ((await getLessonVersions(selectedLesson.id)) as CurriculumVersion[]) : [];
  const quizVersions = selectedQuiz ? ((await getQuizVersions(selectedQuiz.id)) as CurriculumVersion[]) : [];

  return (
    <main className="p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Curriculum Pipeline</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Content publishing and version control</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Upload lesson or quiz JSON, validate against the official schema, preview, publish, and roll back safely.
          </p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <ModuleList modules={modules} selectedModuleId={selectedModuleId} />
          <LessonList moduleId={selectedModuleId} lessons={moduleLessons} selectedLessonId={selectedLessonId} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <JsonUploadPanel lessonId={selectedLessonId} />
          <div className="space-y-6">
            <VersionHistory
              title={selectedLesson ? `${selectedLesson.title} lesson versions` : "Lesson versions"}
              kind="lesson"
              ownerId={selectedLesson?.id ?? null}
              versions={lessonVersions}
              currentVersionId={selectedLesson?.current_version_id ?? null}
            />
            <VersionHistory
              title={selectedLesson ? `${selectedLesson.title} quiz versions` : "Quiz versions"}
              kind="quiz"
              ownerId={selectedQuiz?.id ?? null}
              versions={quizVersions}
              currentVersionId={selectedQuiz?.current_version_id ?? null}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Fallback() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="h-96 animate-pulse rounded-lg bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}

export default async function CurriculumPage({ searchParams }: CurriculumPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<Fallback />}>
      <CurriculumContent moduleId={params.moduleId} lessonId={params.lessonId} />
    </Suspense>
  );
}

