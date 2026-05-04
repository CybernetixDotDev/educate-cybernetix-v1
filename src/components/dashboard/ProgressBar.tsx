type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  tone?: "cyan" | "emerald" | "violet" | "amber";
  showValue?: boolean;
};

const toneClasses: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  cyan: "from-cyan-400 to-blue-500",
  emerald: "from-emerald-400 to-teal-500",
  violet: "from-violet-400 to-fuchsia-500",
  amber: "from-amber-300 to-orange-500",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "cyan",
  showValue = true,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const percent = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
          <span>{label}</span>
          {showValue && <span className="tabular-nums text-slate-500">{percent}%</span>}
        </div>
      )}
      <div
        className="h-3 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round((percent / 100) * safeMax)}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneClasses[tone]} transition-[width] duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
