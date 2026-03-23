import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/Card';
import SectionHeading from '../components/SectionHeading';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EligibilityCheck from '../components/EligibilityCheck';
import { getGuidelines, getResources, type Guideline, type Resource } from '../lib/api';
import { ExternalLink, ChevronLeft } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { TOPICS, type TopicKey } from '../lib/topics';
import { WHAT_TEST_INVOLVES, nextStepsResourceHint } from '../lib/topicContent';
import AgeRangeBar from '../components/AgeRangeBar';

export default function Topic() {
  const { topic = '' } = useParams();
  const decodedTopic = useMemo(() => decodeURIComponent(topic), [topic]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gs, rs] = await Promise.all([getGuidelines({ topic: decodedTopic }), getResources(decodedTopic)]);
      setGuidelines(gs);
      setResources(rs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedTopic]);

  const isKnownTopic = useMemo(() => (TOPICS as readonly string[]).includes(decodedTopic), [decodedTopic]);
  const typedTopic = useMemo(() => (isKnownTopic ? (decodedTopic as TopicKey) : null), [decodedTopic, isKnownTopic]);

  const whoApplies = useMemo(() => {
    const first = guidelines[0];
    return first?.summary ?? null;
  }, [guidelines]);

  const firstAgeRange = useMemo(() => {
    const first = guidelines[0];
    if (!first) return null;
    const ageMin = first.age_min ?? first.start_age;
    const ageMax = first.age_max ?? first.stop_age;
    if (typeof ageMin !== 'number' || typeof ageMax !== 'number') return null;
    return { ageMin, ageMax };
  }, [guidelines]);

  const keyResource = useMemo(() => {
    if (!typedTopic) return null;
    const hint = nextStepsResourceHint(typedTopic).toLowerCase();
    const preferred = resources.find((r) => (r.title + ' ' + (r.org ?? '')).toLowerCase().includes('uspstf'));
    const hinted = resources.find((r) => (r.title + ' ' + (r.description ?? '')).toLowerCase().includes(hint));
    return preferred ?? hinted ?? resources[0] ?? null;
  }, [resources, typedTopic]);

  return (
    <div className="mx-auto max-w-6xl px-4 container-pad">
      <div className="mb-5">
        <Link to="/explore">
          <Button variant="ghost" className="pl-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <SectionHeading
        title={decodedTopic}
        subtitle="Plain-language overview, guideline summaries, and resources."
        right={
          <Link to="/explore">
            <Button variant="secondary">Refine in Explore</Button>
          </Link>
        }
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="grid gap-3">
          {/* 1) Who this applies to */}
          <Card className="p-6">
            <p className="text-base font-semibold text-slate-900">Who this applies to</p>
            {loading ? (
              <div className="mt-3 grid gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-700 prose-relaxed">
                {/* Inclusive language note: this text is pulled from the database (screening_guidelines.summary).
                    If it uses sexed terms (e.g., women/men) in anatomy-specific ways, update it in Supabase. */}
                {whoApplies ?? 'Check the guideline cards below for who this screening is for.'}
              </p>
            )}
          </Card>

          {/* Age range timeline (if available) */}
          {!loading && firstAgeRange ? (
            <AgeRangeBar ageMin={firstAgeRange.ageMin} ageMax={firstAgeRange.ageMax} />
          ) : null}

          {/* 2) What the test involves */}
          {typedTopic ? (
            <Card className="p-6">
              <p className="text-base font-semibold text-slate-900">What the test involves</p>
              <p className="mt-3 text-sm text-slate-700 prose-relaxed">{WHAT_TEST_INVOLVES[typedTopic]}</p>
            </Card>
          ) : null}

          {/* 3) Existing guideline cards */}
          {loading ? (
            <Card className="p-6">
              <Skeleton className="h-5 w-1/2" />
              <div className="mt-3 grid gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </Card>
          ) : guidelines.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-slate-700">No guideline summaries yet for this topic.</p>
            </Card>
          ) : (
            guidelines.map((g) => (
              <Card key={g.id} className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{g.title}</p>
                    <p className="mt-2 text-sm text-slate-600 prose-relaxed">{g.summary}</p>
                    {g.details ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Details</summary>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{g.details}</div>
                      </details>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {g.start_age != null || g.stop_age != null || g.age_min != null || g.age_max != null ? (
                      <Badge tone="info">
                        {`Ages ${g.age_min ?? g.start_age ?? '—'}–${g.age_max ?? g.stop_age ?? '—'}`}
                      </Badge>
                    ) : null}
                    {g.interval ? <Badge tone="success">{g.interval}</Badge> : null}
                    {g.modality ? <Badge>{g.modality}</Badge> : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {g.source_name ? (
                    <span className="rounded bg-sky-50 px-2 py-1 ring-1 ring-inset ring-sky-200">Source: {g.source_name}</span>
                  ) : null}
                  {g.source_url ? (
                    <a
                      className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-1 font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-100"
                      href={g.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </Card>
            ))
          )}

          {/* 4) Existing mini eligibility tool (unchanged) */}
          {isKnownTopic ? <EligibilityCheck topic={decodedTopic as TopicKey} /> : null}

          {/* 5) Next steps */}
          {typedTopic ? (
            <Card className="p-6">
              <p className="text-base font-semibold text-slate-900">Next steps if youre eligible</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Schedule a conversation with your primary care provider.</li>
                <li>Check whether this screening is covered by your insurance.</li>
                <li>
                  {keyResource ? (
                    <a
                      className="font-semibold text-sky-900 hover:underline"
                      href={keyResource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Review the main resource we listed for {typedTopic}.
                    </a>
                  ) : (
                    'Use the Resources section to review the main public guideline source.'
                  )}
                </li>
              </ul>
            </Card>
          ) : null}
        </div>

        {/* 6) Existing resources panel */}
        <Card className="p-6">
          <p className="text-sm font-semibold text-slate-900">Resources</p>
          <p className="mt-2 text-sm text-slate-600 prose-relaxed">Useful links for patient-facing and clinician reference.</p>
          <div className="mt-5 grid gap-3">
            {loading ? (
              <>
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/6" />
              </>
            ) : resources.length === 0 ? (
              <p className="text-sm text-slate-700">No resources added yet.</p>
            ) : (
              resources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-200 hover:bg-sky-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                      {r.org ? <p className="mt-0.5 text-xs text-slate-600">{r.org}</p> : null}
                      {r.description ? <p className="mt-2 text-sm text-slate-700">{r.description}</p> : null}
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </div>
                </a>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
