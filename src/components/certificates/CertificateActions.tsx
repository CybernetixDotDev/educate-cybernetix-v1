"use client";

type CertificateActionsProps = {
  loading?: boolean;
  hasCertificate: boolean;
  admin?: boolean;
  onDownload: () => void;
  onShare: () => Promise<void>;
  onRegenerate?: () => Promise<void>;
};

export function CertificateActions({
  loading = false,
  hasCertificate,
  admin = false,
  onDownload,
  onShare,
  onRegenerate,
}: CertificateActionsProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm print:hidden">
      <h2 className="text-lg font-black text-slate-950">Certificate Actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button type="button" onClick={onDownload} disabled={!hasCertificate || loading} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
          Download PDF
        </button>
        <button type="button" onClick={() => void onShare()} disabled={!hasCertificate || loading} className="rounded-xl border border-cyan-200 px-4 py-3 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50">
          Share Link
        </button>
        {admin && (
          <button type="button" onClick={() => void onRegenerate?.()} disabled={!onRegenerate || loading} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            Regenerate
          </button>
        )}
      </div>
    </section>
  );
}
