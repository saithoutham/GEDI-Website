import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import SectionHeading from '../components/SectionHeading';
import Badge from '../components/Badge';
import { getGuidelines, type Guideline } from '../lib/api';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useViewMode } from '../lib/viewMode';

function formatAgeRange(g: Guideline) {
  const min = g.age_min ?? g.start_age;
  const max = g.age_max ?? g.stop_age;
  if (min == null && max == null) return 'Age: see details';
  if (min != null && max == null) return `Age: ${min}+`;
  if (min == null && max != null) return `Age: up to ${max}`;
  return `Age: ${min}–${max}`;
}

export default function Explore() {
  const { viewMode } = useViewMode();
  const [items, setItems] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [q, setQ] = useState('');
  const [sex, setSex] = useState<'any' | 'female' | 'male'>('any');
  const [age, setAge] = useState<number>(50);
  const [useAgeFilter, setUseAgeFilter] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getGuidelines({
        q: q.trim() ? q.trim() : undefined,
        sex,
        age_min: useAgeFilter ? age : undefined,
        age_max: useAgeFilter ? age : undefined,
        sort: 'topic',
      });
      setItems(data);
      setSchemaReady(true);
    } catch (err) {
      console.error('Fetch error:', err);
      setSchemaReady(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => fetchItems(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sex, age, useAgeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Guideline[]>();
    for (const g of items) {
      const k = g.topic;
      map.set(k, [...(map.get(k) ?? []), g]);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl px-4 container-pad">
      <SectionHeading
        title="Guideline Library"
        subtitle="Search, filter, and review evidence summaries across preventive care topics."
        right={
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
            <SlidersHorizontal className="h-4 w-4" />
            Live filters
          </div>
        }
      />

      {!schemaReady ? (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
          Some clinician details may not show until the database upgrade is applied.
        </div>
      ) : null}

      <Card className="mt-6 p-5 sm:p-6">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:items-start">
          <label className="block h-full">
            <span className="block min-h-5 text-xs font-semibold text-slate-700">Search</span>
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5 ring-1 ring-inset ring-sky-200">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g., mammography, FIT, Pap, prostate, ACS, USPSTF"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <p className="mt-2 min-h-8 text-xs text-slate-500">Search topic names, summaries, details, organizations, and source names.</p>
          </label>

          <label className="block h-full">
            <span className="block min-h-5 text-xs font-semibold text-slate-700">Sex</span>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as any)}
              className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-700"
            >
              <option value="any">Any / inclusive</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <p className="mt-2 min-h-8 text-xs text-slate-500">Use this when you want guideline cards filtered by sex-specific applicability.</p>
          </label>

          <div className="grid h-full gap-2">
            <div className="flex min-h-5 items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Age filter</span>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={useAgeFilter}
                  onChange={(e) => setUseAgeFilter(e.target.checked)}
                />
                Apply
              </label>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={85}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full"
                disabled={!useAgeFilter}
              />
              <div className="w-14 rounded-xl bg-sky-50 px-2 py-1 text-center text-sm font-semibold text-sky-900 ring-1 ring-inset ring-sky-200">
                {age}
              </div>
            </div>
            <p className="min-h-8 text-xs text-slate-500">Turn this on to narrow guideline summaries to the selected age.</p>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-2/3" />
                <div className="mt-3 grid gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </Card>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-slate-700">No guideline summaries match your filters.</p>
          </Card>
        ) : (
          <div className="grid gap-5">
            <p className="text-sm text-slate-600">{items.length} guideline summaries matched your current filters.</p>
            {grouped.map(([topic, gs]) => (
              <div key={topic} className="grid gap-3">
                <h3 className="text-sm font-semibold tracking-tight text-slate-900">{topic}</h3>
                <div className="grid gap-3">
                  {gs.map((g) => (
                    <Card key={g.id} className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{g.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{g.summary}</p>
                          {g.details ? (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                                Details
                              </summary>
                              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{g.details}</div>
                            </details>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <Badge tone="info">{formatAgeRange(g)}</Badge>
                          <Badge>{`Sex: ${g.sex}`}</Badge>
                          {g.interval ? <Badge tone="success">{g.interval}</Badge> : null}
                          {g.modality ? <Badge tone="neutral">{g.modality}</Badge> : null}
                          {viewMode === 'clinician' && g.recommendation_grade ? (
                            <Badge tone="info">{`Grade ${g.recommendation_grade}`}</Badge>
                          ) : null}
                          {viewMode === 'clinician' && g.guideline_org ? (
                            <Badge tone="neutral">{g.guideline_org}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {g.source_name ? (
                          <span className="rounded bg-sky-50 px-2 py-1 ring-1 ring-inset ring-sky-200">
                            Source: {g.source_name}
                          </span>
                        ) : null}
                        {g.source_url ? (
                          <a
                            className="rounded bg-sky-50 px-2 py-1 font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-100"
                            href={g.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open source
                          </a>
                        ) : null}
                        {g.last_reviewed_at ? (
                          <span>
                            Last reviewed: {new Date(g.last_reviewed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                          </span>
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Note: These summaries are for educational use and quality improvement. Always confirm with your local
        protocols and the full guideline documents.
      </p>
    </div>
  );
}
