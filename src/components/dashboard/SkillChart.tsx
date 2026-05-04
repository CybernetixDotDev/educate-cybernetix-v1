import { ProgressBar } from "./ProgressBar";

export type SkillKey =
  | "html"
  | "css"
  | "javascript"
  | "nextjs"
  | "apis"
  | "supabase"
  | "threejs"
  | "project_management";

export type SkillScore = {
  key: SkillKey;
  label: string;
  value: number;
};

type SkillChartProps = {
  skills: SkillScore[];
};

export function SkillChart({ skills }: SkillChartProps) {
  if (skills.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
        Skill mastery will appear after a few lessons and quizzes.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skills.map((skill, index) => (
        <div key={skill.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <ProgressBar
            value={skill.value}
            label={skill.label}
            tone={index % 3 === 0 ? "cyan" : index % 3 === 1 ? "emerald" : "violet"}
          />
        </div>
      ))}
    </div>
  );
}
