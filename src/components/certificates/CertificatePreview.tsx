"use client";

import type { CertificateJSON } from "@/lib/ai/generateCertificate";

type CertificatePreviewProps = {
  certificate: CertificateJSON | null;
  studentName?: string;
  onChange?: (certificate: CertificateJSON) => void;
  editable?: boolean;
};

export function CertificatePreview({ certificate, studentName = "Student", onChange, editable = false }: CertificatePreviewProps) {
  if (!certificate) {
    return (
      <section className="rounded-2xl border border-dashed border-cyan-300 bg-white/90 p-8 text-center shadow-sm">
        <p className="text-sm font-black text-cyan-900">No certificate generated yet</p>
        <p className="mt-2 text-sm text-slate-600">Generate or select a certificate to preview it here.</p>
      </section>
    );
  }

  function updateText(key: keyof CertificateJSON["certificate_text"], value: string) {
    if (!onChange || !certificate) return;
    onChange({ ...certificate, certificate_text: { ...certificate.certificate_text, [key]: value } });
  }

  return (
    <section className="rounded-3xl border border-cyan-200 bg-white p-8 text-center shadow-sm print:border-slate-300 print:shadow-none">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">Educate Cybernetix</p>
      {editable ? (
        <input
          value={certificate.certificate_text.title}
          onChange={(event) => updateText("title", event.target.value)}
          className="mx-auto mt-4 w-full max-w-3xl rounded-xl border border-slate-200 px-3 py-2 text-center text-4xl font-black text-slate-950"
        />
      ) : (
        <h1 className="mt-4 text-4xl font-black text-slate-950">{certificate.certificate_text.title}</h1>
      )}
      {editable ? (
        <input
          value={certificate.certificate_text.subtitle}
          onChange={(event) => updateText("subtitle", event.target.value)}
          className="mx-auto mt-3 w-full max-w-2xl rounded-xl border border-slate-200 px-3 py-2 text-center text-sm text-slate-600"
        />
      ) : (
        <p className="mt-3 text-lg text-slate-600">{certificate.certificate_text.subtitle}</p>
      )}

      <div className="mx-auto my-8 h-px max-w-xl bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Presented to</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{studentName}</p>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-700">
        For completing the Educate Cybernetix program and presenting the project{" "}
        <span className="font-black">{certificate.project_summary.title}</span>.
      </p>

      {editable ? (
        <textarea
          value={certificate.mentor_comments}
          onChange={(event) => onChange?.({ ...certificate, mentor_comments: event.target.value })}
          rows={4}
          className="mx-auto mt-6 w-full max-w-3xl rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm leading-6 text-slate-700"
        />
      ) : (
        <p className="mx-auto mt-6 max-w-3xl text-sm leading-6 text-slate-700">{certificate.mentor_comments}</p>
      )}

      <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-6 sm:flex-row">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Completion Date</p>
          <p className="mt-1 font-black text-slate-950">{certificate.certificate_text.completion_date}</p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-px w-56 bg-slate-400" />
          <p className="mt-2 text-sm font-black text-slate-950">{certificate.certificate_text.mentor_signature}</p>
          <p className="text-xs text-slate-500">Mentor Signature</p>
        </div>
      </div>
    </section>
  );
}
