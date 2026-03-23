import { useEffect, useMemo, useState } from 'react';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import { cn } from '../lib/cn';
import { evaluate, getQuestions, type EligibilityResult, type Question } from '../lib/eligibility';
import { calculatePackYears } from '../lib/lungScreening';
import type { TopicKey } from '../lib/topics';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

function Field({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (q.type === 'number') {
    return (
      <label className="block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">{q.label}</span>
          {q.helper ? <span className="text-xs text-slate-500">{q.helper}</span> : null}
        </div>
        <input
          type="number"
          value={typeof value === 'number' ? value : value == null ? '' : String(value)}
          min={q.min}
          max={q.max}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
        />
      </label>
    );
  }

  if (q.type === 'select') {
    return (
      <label className="block">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">{q.label}</span>
          {q.helper ? <span className="text-xs text-slate-500">{q.helper}</span> : null}
        </div>
        <select
          value={value == null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
        >
          <option value="" disabled>
            Select
          </option>
          {(q.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex items-start justify-between gap-4 rounded-xl bg-sky-50 p-3 ring-1 ring-inset ring-sky-200">
      <div>
        <div className="text-sm font-semibold text-slate-900">{q.label}</div>
        {q.helper ? <div className="mt-1 text-xs text-slate-600">{q.helper}</div> : null}
      </div>
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-sky-700"
      />
    </label>
  );
}

function ResultCard({ result }: { result: EligibilityResult }) {
  const meta =
    result.status === 'eligible'
      ? {
          icon: CheckCircle2,
          titleTone: 'text-emerald-800',
          badge: <Badge tone="success">Likely eligible</Badge>,
          ring: 'ring-emerald-200',
          bg: 'bg-emerald-50',
        }
      : result.status === 'not_eligible'
        ? {
            icon: XCircle,
            titleTone: 'text-rose-800',
            badge: <Badge tone="warning">Not typically recommended</Badge>,
            ring: 'ring-rose-200',
            bg: 'bg-rose-50',
          }
        : {
            icon: HelpCircle,
            titleTone: 'text-sky-900',
            badge: <Badge tone="info">Needs clinician review</Badge>,
            ring: 'ring-sky-200',
            bg: 'bg-sky-50',
          };

  const Icon = meta.icon;

  return (
    <div className={cn('mt-4 rounded-2xl p-4 ring-1 ring-inset', meta.bg, meta.ring)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white/70 ring-1 ring-inset ring-white/60">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('text-sm font-semibold', meta.titleTone)}>{result.title}</p>
            {meta.badge}
          </div>
          <p className="mt-2 text-sm text-slate-700 prose-relaxed">{result.rationale}</p>
          {result.criteria?.length ? (
            <div className="mt-3 grid gap-2">
              {result.criteria.map((criterion) => (
                <div key={criterion.label} className="rounded-xl bg-white/70 px-3 py-2 ring-1 ring-inset ring-white/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900">{criterion.label}</p>
                    <Badge
                      tone={criterion.status === 'meets' ? 'success' : criterion.status === 'discuss' ? 'info' : 'warning'}
                    >
                      {criterion.status === 'meets' ? 'Matches' : criterion.status === 'discuss' ? 'Discuss' : 'Not met'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-700">{criterion.note}</p>
                </div>
              ))}
            </div>
          ) : null}
          {result.nextSteps?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.nextSteps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function EligibilityCheck({
  topic,
  initialAnswers,
}: {
  topic: TopicKey;
  initialAnswers?: Record<string, string | number | boolean | null | undefined>;
}) {
  const questions = useMemo(() => getQuestions(topic), [topic]);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean | null | undefined>>(initialAnswers ?? {});
  const [result, setResult] = useState<EligibilityResult | null>(initialAnswers ? evaluate(topic, initialAnswers) : null);

  useEffect(() => {
    if (!initialAnswers) return;
    setAnswers(initialAnswers);
    setResult(evaluate(topic, initialAnswers));
  }, [initialAnswers, topic]);

  const derivedPackYears = useMemo(() => {
    if (topic !== 'Lung cancer') return null;
    const cigs = typeof answers.cigarettesPerDay === 'number' ? answers.cigarettesPerDay : null;
    const years = typeof answers.yearsSmoked === 'number' ? answers.yearsSmoked : null;
    return calculatePackYears(cigs, years);
  }, [answers.cigarettesPerDay, answers.yearsSmoked, topic]);

  const setAnswer = (id: string, v: string | number | boolean | null | undefined) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  };

  const onCheck = () => {
    const r = evaluate(topic, answers);
    setResult(r);
  };

  const onReset = () => {
    setAnswers(initialAnswers ?? {});
    setResult(initialAnswers ? evaluate(topic, initialAnswers) : null);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">Check if you qualify</p>
          <p className="mt-1 text-sm text-slate-600 prose-relaxed">
            Answer a few quick questions to see whether screening is typically recommended. This is educational and not medical advice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReset} type="button">
            Reset
          </Button>
          <Button onClick={onCheck} type="button">
            Check
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {questions.map((q) => (
          <Field
            key={q.id}
            q={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v as string | number | boolean | null | undefined)}
          />
        ))}
      </div>

      {topic === 'Lung cancer' ? (
        <div className="mt-4 rounded-2xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-200">
          <p className="text-sm font-semibold text-slate-900">Calculated pack-years</p>
          <p className="mt-1 text-sm text-slate-700">
            {derivedPackYears == null ? 'Enter cigarettes per day and years smoked to calculate this.' : `${derivedPackYears} pack-years`}
          </p>
          <p className="mt-1 text-xs text-slate-500">1 pack-year is about 20 cigarettes per day for 1 year.</p>
        </div>
      ) : null}

      {result ? <ResultCard result={result} /> : null}

      <p className="mt-4 text-xs text-slate-500">
        If you have symptoms, are pregnant, immunocompromised, or have prior abnormal results, your plan may differ.
      </p>
    </Card>
  );
}
