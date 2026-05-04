import { Table } from "@/components/admin/Table";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

type Student = {
  id: string;
  display_name: string;
  email: string | null;
  grade_level: string | null;
  last_active_at: string | null;
  lesson_progress?: Array<{ status: string; progress_percent: number }>;
  quiz_results?: Array<{ score: number; passed: boolean }>;
  session_logs?: Array<{ duration_seconds: number }>;
  streaks?: Array<{ current_count: number; longest_count: number }>;
  student_projects?: Array<{ title: string; status: string; project_tasks?: Array<{ status: string }> }>;
};

function average(scores: number[]) {
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
}

export default async function AdminStudentsPage() {
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("students")
    .select("*, lesson_progress(*), quiz_results(*), session_logs(*), streaks(*), student_projects(*, project_tasks(*))")
    .order("created_at", { ascending: false })
    .limit(100);
  const students = (data ?? []) as Student[];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Students</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Student Progress</h1>
        </header>

        <Table columns={["Student", "Lessons", "Streak", "Minutes", "Quiz Mastery", "Project"]} empty={students.length === 0}>
          {students.map((student) => {
            const lessons = student.lesson_progress ?? [];
            const completedLessons = lessons.filter((lesson) => lesson.status === "completed" || lesson.progress_percent >= 100).length;
            const minutes = Math.round((student.session_logs ?? []).reduce((sum, log) => sum + log.duration_seconds, 0) / 60);
            const mastery = average((student.quiz_results ?? []).map((quiz) => Number(quiz.score ?? 0)));
            const streak = student.streaks?.[0];
            const project = student.student_projects?.[0];
            const tasks = project?.project_tasks ?? [];
            const completedTasks = tasks.filter((task) => task.status === "completed").length;

            return (
              <tr key={student.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{student.display_name}</p>
                  <p className="text-sm text-slate-500">{student.email ?? "No email"} - {student.grade_level ?? "No grade"}</p>
                </td>
                <td className="px-4 py-3">{completedLessons} / {lessons.length}</td>
                <td className="px-4 py-3">{streak?.current_count ?? 0} current / {streak?.longest_count ?? 0} longest</td>
                <td className="px-4 py-3">{minutes}m</td>
                <td className="px-4 py-3">{mastery}%</td>
                <td className="px-4 py-3">
                  {project ? `${project.title} (${completedTasks}/${tasks.length} tasks)` : "No project"}
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </main>
  );
}
