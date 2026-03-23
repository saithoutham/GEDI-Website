import { useMemo, useRef, useState } from 'react';
import Card from './Card';
import Button from './Button';
import { DISCLAIMER_TEXT } from '../lib/disclaimer';
import { buildDoctorSummaryText, buildPdfHtml, type SexForSummary, type SmokingStatus } from '../lib/doctorSummary';

import html2pdf from 'html2pdf.js';

export default function DoctorSummaryBox(props: {
  age: number;
  sex: SexForSummary;
  smokingStatus: SmokingStatus;
  packYears: number | null;
  yearsQuit: number | null;
  eligibleTopics: string[];
  topicDetails: Array<{
    topic: string;
    status: 'eligible' | 'needs_clinician' | 'not_eligible';
    title: string;
    rationale: string;
    sources: string[];
  }>;
  onSummaryShared?: () => void;
}) {
  const summaryText = useMemo(() => buildDoctorSummaryText(props), [props]);
  const [copied, setCopied] = useState(false);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
      props.onSummaryShared?.();
    } catch (e) {
      console.error(e);
    }
  };

  const downloadPdf = async () => {
    if (!pdfRef.current) return;

    // html2pdf uses html2canvas internally; we are not importing/using html2canvas directly.
    const opt = {
      margin: 0.5,
      filename: 'GEDI-Doctor-Summary.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all'] },
    };

    try {
      const h2p = html2pdf as unknown as () => {
        set: (o: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } };
      };
      await h2p().set(opt).from(pdfRef.current).save();
      props.onSummaryShared?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="p-6">
      <p className="text-base font-semibold text-slate-900">Doctor summary</p>
      <p className="mt-2 text-sm text-slate-600 prose-relaxed">Copy this into a message or bring it to your next visit.</p>

      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-inset ring-sky-100">
        <textarea
          readOnly
          value={summaryText}
          className="min-h-[140px] w-full resize-none bg-transparent text-sm text-slate-800 outline-none prose-relaxed"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy to Clipboard'}</Button>
        <Button type="button" variant="secondary" onClick={downloadPdf}>Download as PDF</Button>
      </div>

      <p className="mt-3 text-xs text-slate-500">{DISCLAIMER_TEXT}</p>

      {/* PDF layout */}
      <div className="sr-only">
        <div ref={pdfRef} dangerouslySetInnerHTML={{ __html: buildPdfHtml(summaryText) }} />
      </div>
    </Card>
  );
}
