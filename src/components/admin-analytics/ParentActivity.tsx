type ParentActivityProps = {
  data: {
    parentCount: number;
    linkedStudents: number;
    linkCount: number;
    reportsGenerated: number;
    recentReports: Array<{ month: string; updatedAt: string }>;
  };
};

export function ParentActivity({ data }: ParentActivityProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Parent Activity</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">Family Engagement Summary</h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Parent accounts" value={data.parentCount} />
        <Metric label="Linked students" value={data.linkedStudents} />
        <Metric label="Parent-student links" value={data.linkCount} />
        <Metric label="Monthly reports" value={data.reportsGenerated} />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">Recent Reports</h3>
        <div className="mt-3 space-y-2">
          {data.recentReports.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No parent reports have been generated yet.</p>
          ) : (
            data.recentReports.map((report) => (
              <div key={`${report.month}-${report.updatedAt}`} className="flex justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{report.month}</span>
                <span className="text-slate-500">{new Date(report.updatedAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
