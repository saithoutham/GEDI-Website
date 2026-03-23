import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import SectionHeading from '../components/SectionHeading';
import Button from '../components/Button';
import { TOPICS, type TopicKey, topicToSlug } from '../lib/topics';
import { evaluate } from '../lib/eligibility';
import { getGuidelines, type Guideline } from '../lib/api';
import { ArrowRight, CheckCircle2, HelpCircle, Search, XCircle } from 'lucide-react';
import DoctorSummaryBox from '../components/DoctorSummaryBox';
import { DISCLAIMER_TEXT } from '../lib/disclaimer';
import EligibilityCheck from '../components/EligibilityCheck';
import { calculatePackYears, evaluateLungScreening } from '../lib/lungScreening';
import { ageToBand, getOrCreateSessionId, upsertUsage } from '../lib/usage';
import { safeLocalSet } from '../lib/storage';
import { useViewMode } from '../lib/viewMode';
import ClinicianPanel from '../components/ClinicianPanel';

type FormState = {
  age: number | null;
  sex: 'female' | 'male' | 'other' | '';
  smokingHistory: 'never' | 'former' | 'current' | '';
  cigarettesPerDay: number | null;
  yearsSmoked: number | null;
  yearsSinceQuit: number | null;
};

type StatusKey = 'eligible' | 'needs_clinician' | 'not_eligible';

type ResultRow = {
  topic: string;
  status: StatusKey;
  title: string;
  rationale: string;
  nextSteps: string[];
  guidelines: Guideline[];
};

function uniqueSources(guidelines: Guideline[]) {
  const seen = new Set<string>();
  return guidelines.filter((g) => {
    const key = `${g.source_name ?? ''}|${g.source_url ?? ''}`;
    if (!g.source_name && !g.source_url) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupMeta(key: 'Likely Eligible' | 'May Want to Discuss with Your Doctor' | 'Not Typically Recommended') {
  if (key === 'Likely Eligible') {
    return { bg: 'bg-emerald-50', ring: 'ring-emerald-200', titleColor: 'text-emerald-900' };
  }
  if (key === 'May Want to Discuss with Your Doctor') {
    return { bg: 'bg-amber-50', ring: 'ring-amber-200', titleColor: 'text-amber-900' };
  }
  return { bg: 'bg-slate-50', ring: 'ring-slate-200', titleColor: 'text-slate-900' };
}

function oneSentence(reason: string) {
  const s = reason.replace(/\s+/g, ' ').trim();
  const idx = s.indexOf('.');
  if (idx === -1) return s;
  return s.slice(0, idx + 1);
}

function appliesToSex(g: Guideline, sex: FormState['sex']) {
  if (!sex || sex === 'other') return true;
  if (g.sex === 'any') return true;
  return g.sex === sex;
}

function ageMatch(g: Guideline, age: number) {
  const min = g.age_min ?? g.start_age;
  const max = g.age_max ?? g.stop_age;
  if (min != null && age < min) return false;
  if (max != null && age > max) return false;
  return true;
}

function statusIcon(status: StatusKey) {
  if (status === 'eligible') return CheckCircle2;
  if (status === 'not_eligible') return XCircle;
  return HelpCircle;
}

function toSlug(topic: string) {
  return encodeURIComponent(topic);
}

export default function Eligibility() {
  const { viewMode } = useViewMode();

  const [form, setForm] = useState<FormState>({
    age: 55,
    sex: '',
    smokingHistory: '',
    cigarettesPerDay: null,
    yearsSmoked: null,
    yearsSinceQuit: null,
  });
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [usageLogged, setUsageLogged] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSessionId(getOrCreateSessionId());
    } catch {
      setSessionId('');
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getGuidelines({ sort: 'topic' });
      setGuidelines(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const derivedPackYears = useMemo(
    () => calculatePackYears(form.cigarettesPerDay, form.yearsSmoked),
    [form.cigarettesPerDay, form.yearsSmoked]
  );

  const lungScreening = useMemo(
    () =>
      evaluateLungScreening({
        age: form.age,
        smokingStatus: form.smokingHistory,
        cigarettesPerDay: form.cigarettesPerDay,
        yearsSmoked: form.yearsSmoked,
        yearsSinceQuit: form.yearsSinceQuit,
      }),
    [form.age, form.cigarettesPerDay, form.smokingHistory, form.yearsSmoked, form.yearsSinceQuit]
  );

  const results = useMemo(() => {
    if (!submitted || typeof form.age !== 'number') return null;
    const age = form.age;

    if (age < 18) {
      return {
        eligible: [] as ResultRow[],
        needs: [] as ResultRow[],
        not: [] as ResultRow[],
        notice:
          'Most screening guidelines are for adults 18 and older. Talk to a pediatrician for guidance specific to your age.',
      };
    }

    const rows: ResultRow[] = (TOPICS as readonly TopicKey[]).map((t) => {
      const base = evaluate(t, {
        age,
        sex: form.sex || null,
        bmiOver25: null,
        gestationalDM: null,
        familyHistoryDM: null,
        familyHistoryCRC: null,
        ibd: null,
        highRiskBreast: null,
        highRiskProstate: null,
        hasCervix: t === 'Cervical cancer' ? (form.sex === 'female' ? true : null) : null,
        immunocompromised: null,
        historyCIN2: null,
        personalSkinCancer: null,
        manyMoles: null,
        immunosuppressed: null,
        priorHighBP: null,
        pregnancyHTN: null,
        smokingStatus: form.smokingHistory || null,
        cigarettesPerDay: form.cigarettesPerDay,
        yearsSmoked: form.yearsSmoked,
        packYears: derivedPackYears,
        yearsSinceQuit: form.yearsSinceQuit,
      });

      let status: StatusKey = base.status;
      let title = base.title;
      let rationale = base.rationale;
      let nextSteps = base.nextSteps;

      if (age > 80) {
        // Edge case requirement: older adults vary.
        if (t === 'Lung cancer' || t === 'Colorectal cancer' || t === 'Breast cancer') {
          status = 'not_eligible';
          title = 'Needs a personalized conversation';
          rationale = "Guidelines for adults over 80 vary. Your doctor can help decide what's right for you.";
          nextSteps = ['Ask whether screening would still help based on your overall health and treatment goals.'];
        }
      }

      if (t === 'Lung cancer') {
        status = lungScreening.status;
        title = lungScreening.title;
        rationale = lungScreening.rationale;
        nextSteps = lungScreening.nextSteps;
      }

      if (form.sex === 'other' && (t === 'Cervical cancer' || t === 'Prostate cancer')) {
        // Edge case requirement: anatomy-specific topics should not hard-exclude.
        status = 'needs_clinician';
        title = 'May still apply depending on your anatomy';
        rationale =
          'Some screening guidelines are based on anatomy. If you have a cervix or a prostate, your doctor can help choose the right screening plan.';
        nextSteps = ['Refine this result with more details if this topic may apply to your body.'];
      }

      const matching = guidelines
        .filter((g) => g.topic === t)
        .filter((g) => appliesToSex(g, form.sex))
        .filter((g) => ageMatch(g, age));

      return { topic: t, status, title, rationale, nextSteps, guidelines: matching };
    });

    const eligible = rows.filter((r) => r.status === 'eligible');
    const needs = rows.filter((r) => r.status === 'needs_clinician');
    const not = rows.filter((r) => r.status === 'not_eligible');

    const notice = eligible.length === 0
      ? "Based on what you entered, no major screenings appear urgent right now. That's good news. Keep up with regular checkups and revisit this as you get older."
      : null;

    return { eligible, needs, not, notice };
  }, [derivedPackYears, form.age, form.cigarettesPerDay, form.sex, form.smokingHistory, form.yearsSinceQuit, form.yearsSmoked, guidelines, lungScreening, submitted]);

  const sexForSummary = useMemo(() => {
    if (form.sex === 'male' || form.sex === 'female') return form.sex;
    return 'other' as const;
  }, [form.sex]);

  const eligibleTopics = useMemo(() => {
    if (!results) return [];
    return results.eligible.map((r) => r.topic);
  }, [results]);

  // Log once per session when results are viewed.
  useEffect(() => {
    if (!submitted || !results) return;
    if (usageLogged) return;
    if (!sessionId) return;
    if (typeof form.age !== 'number') return;

    const sexInput = (form.sex === 'male' || form.sex === 'female' ? form.sex : 'other') as 'male' | 'female' | 'other';
    const payload = {
      session_id: sessionId,
      age_band: ageToBand(form.age),
      sex_input: sexInput,
      topics_viewed: [],
      eligibility_run: true,
      summary_copied: false,
    };

    upsertUsage(payload).finally(() => setUsageLogged(true));

    // Store eligible topic slugs for home banner.
    try {
      safeLocalSet('gedi_flagged_topics', JSON.stringify(eligibleTopics.map((t) => toSlug(t))));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, results, sessionId]);

  const markSummaryShared = async () => {
    if (!sessionId) return;
    if (typeof form.age !== 'number') return;
    const sexInput = (form.sex === 'male' || form.sex === 'female' ? form.sex : 'other') as 'male' | 'female' | 'other';
    await upsertUsage({
      session_id: sessionId,
      age_band: ageToBand(form.age),
      sex_input: sexInput,
      eligibility_run: true,
      summary_copied: true,
    });
  };

  const appendTopicViewed = async (topicName: string) => {
    if (!sessionId) return;
    if (typeof form.age !== 'number') return;
    const sexInput = (form.sex === 'male' || form.sex === 'female' ? form.sex : 'other') as 'male' | 'female' | 'other';
    await upsertUsage({
      session_id: sessionId,
      age_band: ageToBand(form.age),
      sex_input: sexInput,
      topics_viewed: [toSlug(topicName)],
      eligibility_run: true,
      summary_copied: false,
    });
  };

  const buildInitialAnswers = (topic: TopicKey) => ({
    age: form.age,
    sex: form.sex === 'other' ? 'prefer_not' : form.sex || undefined,
    smokingStatus: form.smokingHistory || undefined,
    cigarettesPerDay: form.cigarettesPerDay,
    yearsSmoked: form.yearsSmoked,
    packYears: derivedPackYears,
    yearsSinceQuit: form.yearsSinceQuit,
    hasCervix: topic === 'Cervical cancer' ? form.sex === 'female' : undefined,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 container-pad">
      <SectionHeading
        title="Eligibility Finder"
        subtitle="Answer 5 quick questions to see which screenings you might need, then refine any result with more detail."
      />

      {viewMode === 'clinician' ? (
        <div className="mt-6">
          <ClinicianPanel />
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold text-slate-900">Your info</p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Search className="h-4 w-4" /> 5 quick questions
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">Age</span>
              <input
                type="number"
                value={form.age ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, age: e.target.value === '' ? null : Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">Sex</span>
              <select
                value={form.sex}
                onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value as FormState['sex'] }))}
                className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
              {form.sex === 'other' ? (
                <p className="mt-2 text-xs text-slate-500 prose-relaxed">
                  Some screening guidelines are based on anatomy — for example, whether you have a cervix or a prostate.
                  Where this applies, we will note it and suggest discussing with your doctor.
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">Smoking history</span>
              <select
                value={form.smokingHistory}
                onChange={(e) =>
                  setForm((p) => {
                    const smokingHistory = e.target.value as FormState['smokingHistory'];
                    return {
                      ...p,
                      smokingHistory,
                      yearsSinceQuit: smokingHistory === 'former' ? p.yearsSinceQuit : null,
                      cigarettesPerDay: smokingHistory === 'never' ? null : p.cigarettesPerDay,
                      yearsSmoked: smokingHistory === 'never' ? null : p.yearsSmoked,
                    };
                  })
                }
                className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
              >
                <option value="">Select</option>
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">Average cigarettes per day</span>
              <input
                type="number"
                value={form.cigarettesPerDay ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, cigarettesPerDay: e.target.value === '' ? null : Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
                placeholder="e.g., 20"
                disabled={form.smokingHistory === '' || form.smokingHistory === 'never'}
              />
              <p className="mt-2 text-xs text-slate-500">We use this with years smoked to calculate pack-years automatically.</p>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">Years smoked</span>
              <input
                type="number"
                value={form.yearsSmoked ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, yearsSmoked: e.target.value === '' ? null : Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
                placeholder="e.g., 25"
                disabled={form.smokingHistory === '' || form.smokingHistory === 'never'}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-900">If former smoker: years since quitting</span>
              <input
                type="number"
                value={form.yearsSinceQuit ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, yearsSinceQuit: e.target.value === '' ? null : Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-inset ring-sky-200 outline-none focus:ring-sky-600"
                placeholder="e.g., 10"
                disabled={form.smokingHistory !== 'former'}
              />
            </label>

            <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-200">
              <p className="text-sm font-semibold text-slate-900">Calculated pack-years</p>
              <p className="mt-1 text-sm text-slate-700">
                {derivedPackYears == null ? 'Enter cigarettes per day and years smoked to calculate this.' : `${derivedPackYears} pack-years`}
              </p>
              <p className="mt-1 text-xs text-slate-500">1 pack-year is about 20 cigarettes per day for 1 year.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setSubmitted(true)} type="button" disabled={typeof form.age !== 'number' || form.age <= 0}>
              See results <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSubmitted(false);
                setExpandedTopic(null);
                setForm({ age: 55, sex: '', smokingHistory: '', cigarettesPerDay: null, yearsSmoked: null, yearsSinceQuit: null });
              }}
              type="button"
            >
              Reset
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="p-6">
            <p className="text-base font-semibold text-slate-900">Your results</p>
            <p className="mt-2 text-sm text-slate-600 prose-relaxed">These results help you decide what to ask about at your next visit.</p>

            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading guideline summaries</p>
            ) : !submitted || !results ? (
              <div className="mt-4 rounded-2xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-200">
                <p className="text-sm text-slate-700">Fill out the form and click “See results”.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {results.notice ? (
                  <div className="rounded-2xl bg-sky-50 p-4 text-sm text-slate-700 ring-1 ring-inset ring-sky-200">
                    {results.notice}
                  </div>
                ) : null}

                {(
                  [
                    { key: 'Likely Eligible' as const, list: results.eligible },
                    { key: 'May Want to Discuss with Your Doctor' as const, list: results.needs },
                    { key: 'Not Typically Recommended' as const, list: results.not },
                  ]
                ).map((group) => {
                  const mg = groupMeta(group.key);
                  return (
                    <div key={group.key} className={`rounded-2xl p-4 ring-1 ring-inset ${mg.bg} ${mg.ring}`}>
                      <p className={`text-sm font-semibold ${mg.titleColor}`}>{group.key}</p>

                      <div className="mt-3 grid gap-3">
                        {group.list.length === 0 ? (
                          <div className="rounded-xl bg-white/70 p-3 ring-1 ring-inset ring-white/60">
                            <p className="text-sm text-slate-600">No conditions in this section.</p>
                          </div>
                        ) : (
                          group.list.map((r) => {
                            const Icon = statusIcon(r.status);
                            const isExpanded = expandedTopic === r.topic;
                            const sources = uniqueSources(r.guidelines).slice(0, 3);
                            return (
                              <div key={r.topic} className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-sky-100">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <div className="inline-flex items-center gap-2">
                                      <Icon className="h-4 w-4 text-slate-700" />
                                      <p className="text-sm font-semibold text-slate-900">{r.topic}</p>
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{r.title}</p>
                                    <p className="mt-2 text-sm text-slate-700 prose-relaxed">{oneSentence(r.rationale)}</p>
                                    {r.nextSteps.length ? (
                                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                        {r.nextSteps.slice(0, 2).map((step) => (
                                          <li key={step}>{step}</li>
                                        ))}
                                      </ul>
                                    ) : null}
                                    {r.topic === 'Lung cancer' && lungScreening.pathways.length ? (
                                      <div className="mt-3 grid gap-2">
                                        {lungScreening.pathways
                                          .filter((pathway) => pathway.status !== 'not_met')
                                          .map((pathway) => (
                                            <div key={pathway.id} className="rounded-xl bg-sky-50 px-3 py-2 ring-1 ring-inset ring-sky-200">
                                              <p className="text-xs font-semibold text-slate-900">{pathway.label}</p>
                                              <p className="mt-1 text-xs text-slate-700">{pathway.note}</p>
                                            </div>
                                          ))}
                                      </div>
                                    ) : null}
                                    {sources.length ? (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {sources.map((source) =>
                                          source.source_url ? (
                                            <a
                                              key={`${r.topic}-${source.id}`}
                                              href={source.source_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-100"
                                            >
                                              {source.source_name ?? 'Open source'}
                                            </a>
                                          ) : (
                                            <span
                                              key={`${r.topic}-${source.id}`}
                                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-900 ring-1 ring-inset ring-sky-200"
                                            >
                                              {source.source_name}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex w-full flex-col gap-2 sm:w-52">
                                    <Link
                                      to={`/topic/${topicToSlug(r.topic)}`}
                                      className="inline-flex w-full items-center justify-center rounded-xl bg-sky-50 px-3 py-2 text-center text-sm font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-100"
                                      onClick={() => {
                                        appendTopicViewed(r.topic);
                                      }}
                                    >
                                      View Details
                                    </Link>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="w-full justify-center text-center"
                                      onClick={() => {
                                        setExpandedTopic((current) => (current === r.topic ? null : r.topic));
                                      }}
                                    >
                                      {isExpanded ? 'Hide Detailed Check' : 'Refine with More Details'}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="w-full justify-center text-center"
                                      onClick={async () => {
                                        const text = `${r.topic}: ${r.title}. ${oneSentence(r.rationale)}`;
                                        try {
                                          await navigator.clipboard.writeText(text);
                                          markSummaryShared();
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }}
                                    >
                                      Copy Doctor Summary
                                    </Button>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <div className="mt-4">
                                    <EligibilityCheck topic={r.topic as TopicKey} initialAnswers={buildInitialAnswers(r.topic as TopicKey)} />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}

                {typeof form.age === 'number' ? (
                  <DoctorSummaryBox
                    age={form.age}
                    sex={sexForSummary}
                    smokingStatus={(form.smokingHistory || 'never') as 'never' | 'current' | 'former'}
                    packYears={derivedPackYears}
                    yearsQuit={form.yearsSinceQuit}
                    eligibleTopics={eligibleTopics}
                    topicDetails={results.eligible.concat(results.needs).map((item) => ({
                      topic: item.topic,
                      status: item.status,
                      title: item.title,
                      rationale: oneSentence(item.rationale),
                      sources: uniqueSources(item.guidelines)
                        .slice(0, 2)
                        .map((g) => g.source_name ?? g.source_url ?? 'Guideline source'),
                    }))}
                    onSummaryShared={markSummaryShared}
                  />
                ) : null}

                <p className="text-xs text-slate-500">{DISCLAIMER_TEXT}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
