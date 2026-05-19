import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

type LearnPageProps = {
  searchParams: Promise<{ course?: string }>;
};

type CourseRow = {
  id: string;
  course_key: string;
  title: string;
  description: string | null;
  category: string;
  duration_weeks: number | null;
  is_published: boolean;
  order_index: number;
};

type ModuleRow = {
  id: string;
  course_id: string | null;
  module_key: string | null;
  title: string;
  description: string | null;
  order_index: number;
  week_number: number | null;
  is_published: boolean;
};

type LessonRow = {
  id: string;
  module_id: string;
  lesson_key: string | null;
  order_index: number;
};

const FALLBACK_FIRST_LESSON: Record<string, string> = {
  "week1-internet-html-css": "w1l1",
};

const FALLBACK_COURSE: CourseRow = {
  id: "12-week-tech-foundations-accelerator",
  course_key: "12-week-tech-foundations-accelerator",
  title: "12-Week Tech-Foundations Accelerator",
  description: "A 12-week teen-friendly path from web foundations to a deployed project presentation.",
  category: "programming",
  duration_weeks: 12,
  is_published: true,
  order_index: 1,
};

const FALLBACK_MODULES: ModuleRow[] = [
  ["week1-internet-html-css", 1, "Internet, HTML, and CSS"],
  ["week2-tailwind-uiux", 2, "Tailwind and UI/UX"],
  ["week3-git-github-terminal", 3, "Git, GitHub, and Terminal"],
  ["week4-javascript-fundamentals", 4, "JavaScript Fundamentals"],
  ["week5-nextjs-fundamentals", 5, "Next.js Fundamentals"],
  ["week6-apis-datafetching", 6, "APIs and Data Fetching"],
  ["week7-supabase-database-auth", 7, "Supabase Database and Auth"],
  ["week8-threejs-fundamentals", 8, "Three.js Fundamentals"],
  ["week9-project-planning", 9, "Project Planning"],
  ["week10-build-phase-1", 10, "Build Phase 1"],
  ["week11-build-phase-2", 11, "Build Phase 2"],
  ["week12-deploy-present", 12, "Deploy and Present"],
].map(([moduleKey, weekNumber, title]) => ({
  id: String(moduleKey),
  course_id: FALLBACK_COURSE.id,
  module_key: String(moduleKey),
  title: String(title),
  description: "Start or resume lessons for this module.",
  order_index: Number(weekNumber),
  week_number: Number(weekNumber),
  is_published: true,
}));

async function loadLearningCatalog() {
  const supabase = createClient(await cookies());
  const [{ data: courseRows, error: courseError }, { data: moduleRows, error: moduleError }, { data: lessonRows }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, course_key, title, description, category, duration_weeks, is_published, order_index")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("modules")
      .select("id, course_id, module_key, title, description, order_index, week_number, is_published")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("lessons")
      .select("id, module_id, lesson_key, order_index")
      .order("order_index", { ascending: true }),
  ]);

  if (courseError || moduleError || !courseRows?.length) {
    return {
      courses: [FALLBACK_COURSE],
      modules: FALLBACK_MODULES,
      lessons: [],
      usingFallback: true,
    };
  }

  return {
    courses: courseRows as CourseRow[],
    modules: (moduleRows ?? []) as ModuleRow[],
    lessons: (lessonRows ?? []) as LessonRow[],
    usingFallback: false,
  };
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const params = await searchParams;
  const { courses, modules, lessons, usingFallback } = await loadLearningCatalog();
  const selectedCourse = courses.find((course) => course.course_key === params.course || course.id === params.course) ?? courses[0];
  const selectedModules = modules.filter((module) => module.course_id === selectedCourse.id || (usingFallback && selectedCourse.id === FALLBACK_COURSE.id));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Learning Hub</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Choose a course, then continue the next module.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            12-Week Tech-Foundations Accelerator is the first course. New teen courses can be added here without changing the learning workflow.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Courses</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Course Library</h2>
            <div className="mt-5 space-y-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/learn?course=${course.course_key}`}
                  className={`block rounded-lg border p-4 transition hover:border-cyan-200 hover:bg-cyan-50 ${
                    course.id === selectedCourse.id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-slate-950">{course.title}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{course.duration_weeks ?? "Flexible"} weeks</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{course.description ?? "Course details coming soon."}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-cyan-700">{course.category}</p>
                </Link>
              ))}
            </div>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">{selectedCourse.title}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Modules</h2>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {selectedModules.map((module) => {
                const moduleKey = module.module_key ?? module.id;
                const firstLessonKey = lessons.find((lesson) => lesson.module_id === module.id)?.lesson_key ?? FALLBACK_FIRST_LESSON[moduleKey] ?? "intro";
                return (
                  <Link
                    key={module.id}
                    href={`/learn/${moduleKey}/${firstLessonKey}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-md"
                  >
                    <p className="text-sm font-bold uppercase tracking-wide text-cyan-600">
                      {module.week_number ? `Week ${module.week_number}` : `Module ${module.order_index}`}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950">{module.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{module.description ?? "Start or resume lessons for this module."}</p>
                    <p className="mt-5 text-sm font-black text-cyan-700">Open module</p>
                  </Link>
                );
              })}
              {selectedModules.length === 0 && (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  This course does not have published modules yet.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
