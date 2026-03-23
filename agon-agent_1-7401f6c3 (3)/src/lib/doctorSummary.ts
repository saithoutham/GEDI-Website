import { DISCLAIMER_TEXT } from './disclaimer';

export type SexForSummary = 'male' | 'female' | 'other';
export type SmokingStatus = 'never' | 'current' | 'former';

export function buildDoctorSummaryText(params: {
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
}): string {
  const { age, sex, smokingStatus, packYears, yearsQuit, eligibleTopics, topicDetails } = params;

  const personWord = sex === 'male' ? 'man' : sex === 'female' ? 'woman' : 'person';

  let smokingSentence = '';
  if (smokingStatus === 'current') {
    smokingSentence = packYears != null
      ? ` I have a ${packYears} pack-year smoking history and I currently smoke.`
      : ' I currently smoke.';
  } else if (smokingStatus === 'former') {
    const quitPart = yearsQuit != null ? ` and quit ${yearsQuit} years ago` : '';
    smokingSentence = packYears != null
      ? ` I have a ${packYears} pack-year smoking history${quitPart}.`
      : ` I used to smoke${quitPart}.`;
  }

  const likelyEligible = topicDetails.filter((item) => item.status === 'eligible');
  const discussTopics = topicDetails.filter((item) => item.status === 'needs_clinician');
  const list = eligibleTopics.length ? eligibleTopics.join(', ') : 'none listed';
  const likelyLines = likelyEligible.length
    ? likelyEligible.map((item) => `- ${item.topic}: ${item.title}. ${item.rationale}`).join('\n')
    : '- No topics were marked clearly eligible.';
  const discussLines = discussTopics.length
    ? discussTopics.map((item) => `- ${item.topic}: ${item.title}. ${item.rationale}`).join('\n')
    : '- No additional borderline topics were flagged.';
  const sourceLines = topicDetails.length
    ? topicDetails
        .filter((item) => item.sources.length > 0)
        .map((item) => `- ${item.topic}: ${item.sources.join('; ')}`)
        .join('\n')
    : '- No source list available.';

  return `GEDI Screening Summary

I am a ${age}-year-old ${personWord}.${smokingSentence}

Likely eligible topics: ${list}.

Reasons these topics were flagged:
${likelyLines}

Topics that may still need clinician review:
${discussLines}

Sources to review:
${sourceLines}

I would like to discuss whether these screenings are right for me and which ones are covered or recommended in my case.`;
}

export function buildPdfHtml(summaryText: string) {
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 0; margin: 0;">
    <div style="display: flex; align-items: center; gap: 12px; padding: 0.15in 0 0.1in 0; border-bottom: 1px solid #e2e8f0;">
      <img src="/alcsi-logo.png" alt="ALCSI logo" style="height: 40px; width: auto; border-radius: 6px;" />
      <div>
        <div style="font-size: 18px; font-weight: 700;">GEDI Screening Hub</div>
        <div style="font-size: 12px; margin-top: 2px;">An ALCSI Initiative | American Lung Cancer Screening Initiative</div>
      </div>
    </div>
    <div style="font-size: 12px; line-height: 1.55; padding: 0.18in 0; white-space: pre-wrap;">${escapeHtml(summaryText)}</div>
    <div style="font-size: 10px; color: #475569; padding-top: 0.15in; border-top: 1px solid #e2e8f0;">${escapeHtml(
      DISCLAIMER_TEXT
    )}</div>
  </div>
  `.trim();
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
