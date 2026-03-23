export type SmokingStatus = 'never' | 'former' | 'current' | '';

export type LungPathwayResult = {
  id: 'uspstf' | 'cms' | 'acs' | 'nccn' | 'acr_discussion';
  label: string;
  status: 'meets' | 'discuss' | 'not_met';
  note: string;
};

export type LungScreeningInput = {
  age: number | null;
  smokingStatus: SmokingStatus;
  packYears?: number | null;
  cigarettesPerDay?: number | null;
  yearsSmoked?: number | null;
  yearsSinceQuit?: number | null;
  limitedLifeExpectancy?: boolean | null;
  unableOrUnwillingToBeTreated?: boolean | null;
  chronicLungDisease?: boolean | null;
  familyHistoryLungCancer?: boolean | null;
  occupationalExposure?: boolean | null;
  priorCancerHistory?: boolean | null;
};

export type LungScreeningEvaluation = {
  packYears: number | null;
  status: 'eligible' | 'needs_clinician' | 'not_eligible';
  title: string;
  rationale: string;
  nextSteps: string[];
  pathways: LungPathwayResult[];
};

function normalizeNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function calculatePackYears(cigarettesPerDay: number | null | undefined, yearsSmoked: number | null | undefined): number | null {
  const cigs = normalizeNumber(cigarettesPerDay);
  const years = normalizeNumber(yearsSmoked);
  if (cigs == null || years == null) return null;
  if (cigs < 0 || years < 0) return null;
  return Math.round((cigs / 20) * years * 10) / 10;
}

function hasAdditionalRiskFactors(input: LungScreeningInput) {
  return Boolean(
    input.chronicLungDisease ||
    input.familyHistoryLungCancer ||
    input.occupationalExposure ||
    input.priorCancerHistory
  );
}

function dedupe(values: string[]) {
  return [...new Set(values)];
}

export function evaluateLungScreening(input: LungScreeningInput): LungScreeningEvaluation {
  const age = normalizeNumber(input.age);
  const packYears = normalizeNumber(input.packYears) ?? calculatePackYears(input.cigarettesPerDay, input.yearsSmoked);
  const yearsSinceQuit = normalizeNumber(input.yearsSinceQuit);
  const smokingStatus = input.smokingStatus;
  const limitedByHealth = Boolean(input.limitedLifeExpectancy || input.unableOrUnwillingToBeTreated);
  const hasRiskFactors = hasAdditionalRiskFactors(input);
  const isEverSmoker = smokingStatus === 'current' || smokingStatus === 'former';
  const quitWithin15 = smokingStatus === 'current' || (smokingStatus === 'former' && yearsSinceQuit != null && yearsSinceQuit <= 15);
  const pathwayAge50To80 = age != null && age >= 50 && age <= 80;
  const pathwayAge50To77 = age != null && age >= 50 && age <= 77;
  const pathwayAge50Plus = age != null && age >= 50;
  const hasExposure = (packYears ?? 0) >= 20;

  if (age == null) {
    return {
      packYears,
      status: 'needs_clinician',
      title: 'Add your age to check lung screening',
      rationale: 'Age is required before we can compare your smoking history against screening criteria.',
      nextSteps: ['Enter your age and smoking history, then re-check.'],
      pathways: [],
    };
  }

  if (limitedByHealth) {
    return {
      packYears,
      status: 'not_eligible',
      title: 'Screening may not help if treatment would not be possible',
      rationale:
        'Major guidelines recommend lung screening only when a person is healthy enough to benefit from follow-up testing and treatment if cancer is found.',
      nextSteps: [
        'Discuss whether screening would meaningfully change your care plan.',
        'Focus on symptom evaluation and smoking cessation support if you still smoke.',
      ],
      pathways: [
        {
          id: 'uspstf',
          label: 'USPSTF 2021',
          status: 'not_met',
          note: 'USPSTF recommends stopping when health problems limit life expectancy or curative surgery.',
        },
        {
          id: 'cms',
          label: 'CMS / Medicare',
          status: 'not_met',
          note: 'CMS requires counseling about comorbidities and willingness to undergo diagnosis and treatment.',
        },
        {
          id: 'acs',
          label: 'ACS 2023',
          status: 'not_met',
          note: 'ACS advises against screening when serious health problems limit benefit or treatment would not be pursued.',
        },
      ],
    };
  }

  if (smokingStatus === 'never') {
    return {
      packYears,
      status: 'not_eligible',
      title: 'Routine lung screening is not usually recommended for never-smokers',
      rationale:
        'Current public screening pathways are built around substantial cigarette exposure rather than average-risk screening for people who never smoked.',
      nextSteps: ['If you have symptoms or unusual exposures, discuss diagnostic evaluation with a clinician.'],
      pathways: [],
    };
  }

  if (!isEverSmoker) {
    return {
      packYears,
      status: 'needs_clinician',
      title: 'Smoking history is needed',
      rationale: 'Lung screening criteria depend on whether you currently smoke or used to smoke, and how much.',
      nextSteps: ['Choose current, former, or never smoker and enter your smoking intensity and duration.'],
      pathways: [],
    };
  }

  if (packYears == null) {
    return {
      packYears,
      status: 'needs_clinician',
      title: 'Add smoking duration and intensity',
      rationale: 'We need both how many cigarettes you smoked per day and how many years you smoked to calculate pack-years.',
      nextSteps: ['Enter cigarettes per day and years smoked, or ask your clinician to help reconstruct your pack-years.'],
      pathways: [],
    };
  }

  if (!hasExposure) {
    return {
      packYears,
      status: age >= 50 && hasRiskFactors ? 'needs_clinician' : 'not_eligible',
      title: age >= 50 && hasRiskFactors ? 'You may still want a clinician review' : 'You may not meet smoking exposure criteria',
      rationale:
        age >= 50 && hasRiskFactors
          ? 'Your calculated pack-years are below 20, so you do not meet the main screening pathways, but other risk factors may still justify a more individualized conversation.'
          : 'Most lung screening pathways use a threshold of at least 20 pack-years of smoking exposure.',
      nextSteps:
        age >= 50 && hasRiskFactors
          ? ['Confirm your smoking history and review your additional risk factors with a clinician.']
          : ['Double-check your smoking history. A pack-year equals about 20 cigarettes a day for 1 year.'],
      pathways: [
        {
          id: 'uspstf',
          label: 'USPSTF 2021',
          status: 'not_met',
          note: 'Requires at least 20 pack-years.',
        },
        {
          id: 'cms',
          label: 'CMS / Medicare',
          status: 'not_met',
          note: 'Requires at least 20 pack-years.',
        },
        {
          id: 'acs',
          label: 'ACS 2023',
          status: 'not_met',
          note: 'Requires at least 20 pack-years.',
        },
        {
          id: 'nccn',
          label: 'NCCN current high-risk pathway',
          status: 'not_met',
          note: 'Uses age 50+ and at least 20 pack-years for the core high-risk group.',
        },
        {
          id: 'acr_discussion',
          label: 'ACR discussion pathway',
          status: age >= 50 && hasRiskFactors ? 'discuss' : 'not_met',
          note:
            age >= 50 && hasRiskFactors
              ? 'ACR describes some 50+ patients with 20+ pack-years plus another risk factor as a controversial but potentially appropriate group to discuss.'
              : 'The additional-risk-factor discussion pathway still uses 20+ pack-years.',
        },
      ],
    };
  }

  const meetsUspstf = pathwayAge50To80 && quitWithin15;
  const meetsCms = pathwayAge50To77 && quitWithin15;
  const meetsAcs = pathwayAge50To80 && isEverSmoker;
  const meetsNccn = pathwayAge50Plus && isEverSmoker;
  const meetsAcrDiscussion = pathwayAge50Plus && isEverSmoker && hasRiskFactors;

  const pathways: LungPathwayResult[] = [
    {
      id: 'uspstf',
      label: 'USPSTF 2021',
      status: meetsUspstf ? 'meets' : 'not_met',
      note: meetsUspstf
        ? 'Matches age 50-80, at least 20 pack-years, and current smoking or quitting within the past 15 years.'
        : 'USPSTF keeps a 15-year quit window and stops at age 80.',
    },
    {
      id: 'cms',
      label: 'CMS / Medicare',
      status: meetsCms ? 'meets' : 'not_met',
      note: meetsCms
        ? 'Matches Medicare coverage criteria: age 50-77, 20 pack-years, and current smoking or quitting within 15 years.'
        : 'CMS is narrower than USPSTF because Medicare coverage stops at age 77 and still uses the 15-year quit window.',
    },
    {
      id: 'acs',
      label: 'ACS 2023',
      status: meetsAcs ? 'meets' : 'not_met',
      note: meetsAcs
        ? 'Matches ACS guidance for ages 50-80 with at least 20 pack-years, including former smokers beyond 15 years since quitting.'
        : 'ACS still stops at age 80.',
    },
    {
      id: 'nccn',
      label: 'NCCN current high-risk pathway',
      status: meetsNccn ? 'meets' : 'not_met',
      note: meetsNccn
        ? 'Matches the current NCCN high-risk definition of age 50+ with at least 20 pack-years.'
        : 'NCCN high-risk screening starts at age 50 with at least 20 pack-years.',
    },
    {
      id: 'acr_discussion',
      label: 'ACR discussion pathway',
      status: meetsAcrDiscussion ? 'discuss' : 'not_met',
      note: meetsAcrDiscussion
        ? 'ACR describes age 50+ with at least 20 pack-years plus another risk factor as controversial but potentially appropriate to discuss.'
        : 'No additional ACR-style risk factor pathway was identified from your answers.',
    },
  ];

  if (age > 80) {
    return {
      packYears,
      status: meetsNccn ? 'needs_clinician' : 'not_eligible',
      title: meetsNccn ? 'You may still warrant an individualized lung screening discussion' : 'Screening is usually individualized after age 80',
      rationale: meetsNccn
        ? 'You exceed the age limits used by USPSTF, CMS, and ACS, but your smoking history still fits the broader NCCN high-risk profile. Whether screening helps depends heavily on overall health and treatment goals.'
        : 'Most routine screening pathways stop by age 80, so decisions beyond that point are individualized.',
      nextSteps: meetsNccn
        ? [
            'Ask whether screening would still be reasonable based on your health, life expectancy, and willingness to pursue treatment.',
            'Insurance coverage may be more limited beyond standard age cutoffs.',
          ]
        : ['Discuss individualized benefits and harms with a clinician rather than assuming routine screening.'],
      pathways,
    };
  }

  const matchedLabels = dedupe(
    pathways.filter((pathway) => pathway.status === 'meets').map((pathway) => pathway.label)
  );

  if (matchedLabels.length > 0) {
    const coverageNote = meetsCms
      ? 'You also appear to meet current Medicare coverage criteria.'
      : meetsUspstf
        ? 'You appear to meet USPSTF-style screening criteria, but Medicare coverage is narrower and stops at age 77.'
        : 'You appear to meet ACS/NCCN criteria, but insurance coverage can be narrower than clinical guidance.';

    return {
      packYears,
      status: 'eligible',
      title: 'Likely eligible for lung cancer screening',
      rationale: `Your smoking history matches ${matchedLabels.join(' and ')}. ${coverageNote}`,
      nextSteps: [
        'Ask about annual low-dose CT screening and shared decision-making.',
        'Confirm insurance coverage, especially if you quit more than 15 years ago or are older than 77.',
        smokingStatus === 'current' ? 'Ask for smoking cessation treatment as part of the visit.' : 'Bring your quit date and smoking history to the visit.',
      ],
      pathways,
    };
  }

  if (meetsAcrDiscussion || (pathwayAge50To80 && isEverSmoker && yearsSinceQuit != null && yearsSinceQuit > 15)) {
    return {
      packYears,
      status: 'needs_clinician',
      title: 'You may have a reasonable case to discuss screening',
      rationale:
        yearsSinceQuit != null && yearsSinceQuit > 15
          ? 'You do not match USPSTF/CMS because you quit more than 15 years ago, but ACS and NCCN no longer use that quit-time cutoff.'
          : 'You do not cleanly fit the main population pathways, but you do have additional risk factors that may justify a more individualized discussion.',
      nextSteps: [
        'Discuss whether your personal risk is high enough to justify LDCT despite narrower insurance rules.',
        'Bring up any chronic lung disease, family history, prior cancer, or occupational exposures.',
      ],
      pathways,
    };
  }

  if (age < 50) {
    return {
      packYears,
      status: 'not_eligible',
      title: 'Not typically eligible yet',
      rationale: 'The major public screening pathways start at age 50.',
      nextSteps: ['If you have symptoms, this becomes a diagnostic issue rather than a screening issue.'],
      pathways,
    };
  }

  return {
    packYears,
    status: 'not_eligible',
    title: 'You do not appear to match current public screening pathways',
    rationale: 'Based on what you entered, you do not clearly fit the age, smoking, and health criteria used by the main screening pathways.',
    nextSteps: ['If your smoking history is uncertain, re-check the numbers with your clinician.'],
    pathways,
  };
}
