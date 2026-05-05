"use client";

import { AchievementBadges } from "@/components/certificates/AchievementBadges";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";
import { ProjectSummary } from "@/components/certificates/ProjectSummary";
import { SkillMap } from "@/components/certificates/SkillMap";
import { generateCertificate, type CertificateJSON } from "@/lib/ai/generateCertificate";
import { generateMentorComments } from "@/lib/ai/generateMentorComments";
import { generateSkillMap } from "@/lib/ai/generateSkillMap";
import { saveCertificate } from "@/lib/ai/saveCertificate";
import { useState } from "react";

type StudentOption = {
  id: string;
  display_name: string;
  email: string | null;
};

type ProjectOption = {
  id: string;
  student_id: string;
  title: string;
};

type CertificateAdminClientProps = {
  students: StudentOption[];
  projects: ProjectOption[];
};

export function CertificateAdminClient({ students, projects }: CertificateAdminClientProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [projectId, setProjectId] = useState(projects.find((project) => project.student_id === students[0]?.id)?.id ?? "");
  const [certificate, setCertificate] = useState<CertificateJSON | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filteredProjects = projects.filter((project) => project.student_id === studentId);
  const selectedStudent = students.find((student) => student.id === studentId);

  function updateStudent(nextStudentId: string) {
    setStudentId(nextStudentId);
    setProjectId(projects.find((project) => project.student_id === nextStudentId)?.id ?? "");
    setCertificate(null);
  }

  async function run(action: string, callback: () => Promise<void>) {
    setLoadingAction(action);
    setStatus(null);
    setError(null);

    try {
      await callback();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Certificate action failed");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGenerate() {
    if (!studentId || !projectId) {
      setError("Select a student and project first.");
      return;
    }

    await run("generate", async () => {
      const result = await generateCertificate({ student_id: studentId, project_id: projectId });
      if (!result.ok || !result.certificate) throw new Error(result.error ?? "Unable to generate certificate");
      setCertificate(result.certificate);
      setStatus("Certificate generated. Review and edit before saving.");
    });
  }

  async function handleSkillMap() {
    if (!studentId || !projectId) return;
    await run("skill-map", async () => {
      const result = await generateSkillMap({ student_id: studentId, project_id: projectId });
      if (!result.ok || !result.certificate) throw new Error(result.error ?? "Unable to regenerate skill map");
      const nextCertificate = result.certificate;
      setCertificate((current) => current ? { ...current, skill_map: nextCertificate.skill_map } : nextCertificate);
      setStatus("Skill map regenerated.");
    });
  }

  async function handleMentorComments() {
    if (!studentId || !projectId) return;
    await run("comments", async () => {
      const result = await generateMentorComments({ student_id: studentId, project_id: projectId });
      if (!result.ok || !result.certificate) throw new Error(result.error ?? "Unable to regenerate mentor comments");
      const nextCertificate = result.certificate;
      setCertificate((current) => current ? { ...current, mentor_comments: nextCertificate.mentor_comments } : nextCertificate);
      setStatus("Mentor comments regenerated.");
    });
  }

  async function handleSave() {
    if (!certificate) return;
    await run("save", async () => {
      const result = await saveCertificate(certificate);
      if (!result.ok) throw new Error(result.error ?? "Unable to save certificate");
      setStatus("Certificate saved.");
    });
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Certificates</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Certificate Generator</h1>
          <p className="mt-2 text-slate-600">Generate completion certificates, skill maps, project summaries, badges, and mentor comments.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Student</span>
              <select value={studentId} onChange={(event) => updateStudent(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.display_name} {student.email ? `(${student.email})` : ""}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Project</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" onClick={() => void handleGenerate()} disabled={Boolean(loadingAction)} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
                Generate Certificate
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={!certificate || Boolean(loadingAction)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
                Save Certificate
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void handleGenerate()} disabled={Boolean(loadingAction)} className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-black text-violet-800 disabled:opacity-50">Regenerate Certificate</button>
            <button type="button" onClick={() => void handleSkillMap()} disabled={Boolean(loadingAction)} className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-black text-violet-800 disabled:opacity-50">Regenerate Skill Map</button>
            <button type="button" onClick={() => void handleMentorComments()} disabled={Boolean(loadingAction)} className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-black text-violet-800 disabled:opacity-50">Regenerate Mentor Comments</button>
          </div>
        </section>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {status && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">{status}</div>}

        <div className="space-y-6">
          <CertificatePreview certificate={certificate} studentName={selectedStudent?.display_name ?? "Student"} editable onChange={setCertificate} />
          {certificate && (
            <div className="grid gap-6 lg:grid-cols-2">
              <SkillMap skillMap={certificate.skill_map} editable onChange={(skill_map) => setCertificate({ ...certificate, skill_map })} />
              <ProjectSummary summary={certificate.project_summary} editable onChange={(project_summary) => setCertificate({ ...certificate, project_summary })} />
              <AchievementBadges badges={certificate.achievement_badges} editable onChange={(achievement_badges) => setCertificate({ ...certificate, achievement_badges })} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
