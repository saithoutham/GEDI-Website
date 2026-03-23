import type { TopicKey } from './topics';
import { evaluate } from './eligibility';
import { evaluateLungScreening } from './lungScreening';

export type PatientRecord = {
  id: string; // display id, e.g. "Patient 1"
  age: number;
  sex: 'female' | 'male' | 'other';
  smokingStatus: 'never' | 'former' | 'current';
  packYears: number;
  yearsSinceQuit: number | null;
};

export type PatientEligibilityRow = {
  topic: TopicKey;
  status: 'eligible' | 'needs_clinician' | 'not_eligible';
  title: string;
  rationale: string;
};

export function computeEligibilityForPatient(p: PatientRecord, topics: readonly TopicKey[]): PatientEligibilityRow[] {
  return topics.map((topic) => {
    if (topic === 'Lung cancer') {
      const lung = evaluateLungScreening({
        age: p.age,
        smokingStatus: p.smokingStatus,
        packYears: p.packYears,
        yearsSinceQuit: p.yearsSinceQuit,
      });
      return {
        topic,
        status: lung.status,
        title: lung.title,
        rationale: lung.rationale,
      };
    }

    const res = evaluate(topic, {
      age: p.age,
      sex: p.sex,
      smokingStatus: p.smokingStatus,
      packYears: p.packYears,
      yearsSinceQuit: p.yearsSinceQuit,
      // other risk fields unknown in this panel
      bmiOver25: null,
      gestationalDM: null,
      familyHistoryDM: null,
      familyHistoryCRC: null,
      ibd: null,
      highRiskBreast: null,
      highRiskProstate: null,
      hasCervix: null,
      immunocompromised: null,
      historyCIN2: null,
      personalSkinCancer: null,
      manyMoles: null,
      immunosuppressed: null,
      priorHighBP: null,
      pregnancyHTN: null,
    });

    return { topic, status: res.status, title: res.title, rationale: res.rationale };
  });
}
