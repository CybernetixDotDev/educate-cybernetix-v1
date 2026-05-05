"use client";

type StepLearningGoalsProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

const GOALS = [
  "Web development",
  "Game development",
  "3D/Three.js",
  "AI literacy",
  "Entrepreneurship",
  "Debugging mastery",
  "Project building",
];

export function StepLearningGoals({ value, onChange }: StepLearningGoalsProps) {
  function toggle(goal: string) {
    onChange(value.includes(goal) ? value.filter((item) => item !== goal) : [...value, goal]);
  }

  return (
    <div>
      <p className="text-sm font-bold text-slate-700">What do you want to get stronger at?</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => {
          const selected = value.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggle(goal)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                selected
                  ? "border-cyan-300 bg-cyan-50 text-cyan-900 ring-4 ring-cyan-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50"
              }`}
            >
              {goal}
            </button>
          );
        })}
      </div>
    </div>
  );
}

