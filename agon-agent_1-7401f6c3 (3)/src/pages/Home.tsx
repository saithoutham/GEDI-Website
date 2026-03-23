import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { TOPICS } from '../lib/topics';
import { safeLocalGet, safeLocalRemove } from '../lib/storage';
import Badge from '../components/Badge';
import { ClipboardList, ShieldCheck } from 'lucide-react';

function topicLabelFromSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export default function Home() {
  const [flagged, setFlagged] = useState<string[]>([]);

  useEffect(() => {
    const raw = safeLocalGet('gedi_flagged_topics');
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFlagged(parsed.filter((x): x is string => typeof x === 'string'));
      }
    } catch {
      // ignore
    }
  }, []);

  const bannerTopics = useMemo(() => flagged.slice(0, 3).map(topicLabelFromSlug), [flagged]);

  return (
    <div className="mx-auto max-w-6xl px-4 container-pad">
      <div className="grid gap-5">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex flex-wrap items-center gap-2">
                <Badge tone="info">
                  <ShieldCheck className="h-3.5 w-3.5" /> Clinician-friendly
                </Badge>
                <Badge tone="neutral">Evidence summaries + links</Badge>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Find out which health screenings you might need — in 30 seconds.
              </h1>
              <p className="mt-3 text-base text-slate-600 prose-relaxed">
                Use the Eligibility Finder to quickly triage preventive needs, then open guideline cards for the details.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link to="/eligibility" className="w-full sm:w-auto">
                  <Button className="w-full px-5 py-3 text-base sm:w-auto">
                    Check My Eligibility <ClipboardList className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/explore" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto px-5 py-3 text-base">
                    Browse Guidelines
                  </Button>
                </Link>
              </div>
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-200">
                <p className="text-sm font-semibold text-sky-900">What you'll get</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Likely eligible topics (grouped)</li>
                  <li>A doctor summary you can copy or print</li>
                  <li>Direct links to public sources</li>
                </ul>
              </div>
            </div>
          </div>

          {flagged.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-200">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-slate-700 prose-relaxed">
                  Last time you checked, you may have been eligible for{' '}
                  <span className="font-semibold">{bannerTopics.join(' and ')}</span>. Ready to review or share with your doctor?
                </p>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-sky-900 hover:bg-sky-100"
                  onClick={() => {
                    safeLocalRemove('gedi_flagged_topics');
                    setFlagged([]);
                  }}
                  aria-label="Dismiss"
                >
                  X
                </button>
              </div>
              <div className="mt-3">
                <Link to="/eligibility" className="text-sm font-semibold text-sky-900 hover:underline">
                  Review Results
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-7">
            <p className="text-xs font-semibold text-slate-600">Browse by condition</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TOPICS.map((t) => (
                <Link
                  key={t}
                  to={`/topic/${encodeURIComponent(t)}`}
                  className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-100"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/explore" className="font-semibold text-sky-900 hover:underline">
              Explore Guidelines
            </Link>
            <Link to="/about" className="font-semibold text-sky-900 hover:underline">
              About
            </Link>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-900">Fast</p>
            <p className="mt-2 text-sm text-slate-600 prose-relaxed">Most people finish in under a minute.</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-900">Clear</p>
            <p className="mt-2 text-sm text-slate-600 prose-relaxed">Plain language that's easy to share.</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-900">Helpful</p>
            <p className="mt-2 text-sm text-slate-600 prose-relaxed">Links to public guideline sources for details.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
