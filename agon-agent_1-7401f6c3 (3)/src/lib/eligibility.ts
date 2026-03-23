import type { TopicKey } from './topics';
import { evaluateLungScreening } from './lungScreening';

type AnswerMap = Record<string, string | number | boolean | null | undefined>;

export type Question = {
  id: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  helper?: string;
  min?: number;
  max?: number;
};

export type EligibilityResult = {
  status: 'eligible' | 'not_eligible' | 'needs_clinician';
  title: string;
  rationale: string;
  nextSteps: string[];
  criteria?: Array<{
    label: string;
    status: 'meets' | 'discuss' | 'not_met';
    note: string;
  }>;
};

const commonQuestions: Question[] = [
  { id: 'age', label: 'Age', type: 'number', min: 0, max: 120 },
  {
    id: 'sex',
    label: 'Sex (for guideline applicability)',
    type: 'select',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'intersex', label: 'Intersex / another' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
    helper: 'Some screening guidance is anatomy-based. Use clinical context.',
  },
];

export function getQuestions(topic: TopicKey): Question[] {
  switch (topic) {
    case 'Cervical cancer':
      return [
        ...commonQuestions,
        { id: 'hasCervix', label: 'Do you currently have a cervix?', type: 'boolean' },
        { id: 'immunocompromised', label: 'Are you immunocompromised (e.g., transplant, HIV, chronic immunosuppression)?', type: 'boolean' },
        { id: 'historyCIN2', label: 'History of CIN2+ / cervical cancer?', type: 'boolean' },
      ];
    case 'Breast cancer':
      return [
        ...commonQuestions,
        { id: 'highRiskBreast', label: 'High-risk factors (e.g., BRCA mutation, strong family history, prior chest radiation)?', type: 'boolean' },
      ];
    case 'Colorectal cancer':
      return [
        ...commonQuestions,
        { id: 'familyHistoryCRC', label: 'First-degree relative with colorectal cancer or advanced adenoma?', type: 'boolean' },
        { id: 'ibd', label: 'Inflammatory bowel disease (ulcerative colitis or Crohn’s colitis)?', type: 'boolean' },
      ];
    case 'Lung cancer':
      return [
        ...commonQuestions,
        {
          id: 'smokingStatus',
          label: 'Smoking status',
          type: 'select',
          options: [
            { value: 'never', label: 'Never' },
            { value: 'former', label: 'Former' },
            { value: 'current', label: 'Current' },
          ],
        },
        {
          id: 'cigarettesPerDay',
          label: 'Average cigarettes per day',
          type: 'number',
          min: 0,
          max: 200,
          helper: 'If you smoked less than 1 pack a day, estimate the average number of cigarettes.',
        },
        {
          id: 'yearsSmoked',
          label: 'Years smoked',
          type: 'number',
          min: 0,
          max: 80,
          helper: 'We use this together with cigarettes per day to calculate pack-years for you.',
        },
        {
          id: 'yearsSinceQuit',
          label: 'If former smoker: years since quitting',
          type: 'number',
          min: 0,
          max: 80,
        },
        {
          id: 'chronicLungDisease',
          label: 'COPD, emphysema, or pulmonary fibrosis?',
          type: 'boolean',
          helper: 'Check this if a clinician has told you that you have one of these conditions.',
        },
        {
          id: 'familyHistoryLungCancer',
          label: 'First-degree relative with lung cancer?',
          type: 'boolean',
        },
        {
          id: 'occupationalExposure',
          label: 'Meaningful exposure to asbestos, radon, silica, or diesel at work or home?',
          type: 'boolean',
        },
        {
          id: 'priorCancerHistory',
          label: 'Prior cancer history (other than simple skin cancers)?',
          type: 'boolean',
        },
        {
          id: 'limitedLifeExpectancy',
          label: 'Serious health problems that make lung surgery or cancer treatment unrealistic?',
          type: 'boolean',
          helper: 'This matters because screening only helps when follow-up treatment would still be possible.',
        },
        {
          id: 'unableOrUnwillingToBeTreated',
          label: 'You would not want follow-up testing or treatment if screening found something concerning?',
          type: 'boolean',
        },
      ];
    case 'Prostate cancer':
      return [
        ...commonQuestions,
        { id: 'highRiskProstate', label: 'Higher-risk factors (e.g., Black ancestry, strong family history)?', type: 'boolean' },
      ];
    case 'Skin cancer':
      return [
        ...commonQuestions,
        { id: 'personalSkinCancer', label: 'Personal history of skin cancer?', type: 'boolean' },
        { id: 'manyMoles', label: 'Many/atypical moles or strong family history of melanoma?', type: 'boolean' },
        { id: 'immunosuppressed', label: 'Immunosuppressed (e.g., transplant medications)?', type: 'boolean' },
      ];
    case 'CVD - Hypertension':
      return [
        ...commonQuestions,
        { id: 'priorHighBP', label: 'Have you ever been told you have high blood pressure?', type: 'boolean' },
        { id: 'pregnancyHTN', label: 'History of hypertension during pregnancy?', type: 'boolean' },
      ];
    case 'CVD - Diabetes':
      return [
        ...commonQuestions,
        {
          id: 'bmiOver25',
          label: 'Do you have overweight/obesity (BMI ≥ 25; or ≥ 23 for some Asian populations)?',
          type: 'boolean',
        },
        { id: 'gestationalDM', label: 'History of gestational diabetes?', type: 'boolean' },
        { id: 'familyHistoryDM', label: 'First-degree relative with type 2 diabetes?', type: 'boolean' },
      ];
    default:
      return commonQuestions;
  }
}

function num(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function evaluate(topic: TopicKey, answers: AnswerMap): EligibilityResult {
  const age = num(answers.age);
  if (age == null) {
    return {
      status: 'needs_clinician',
      title: 'Add your age to continue',
      rationale: 'Age is required to estimate whether screening is typically recommended.',
      nextSteps: ['Enter an age and re-check.'],
    };
  }

  switch (topic) {
    case 'Cervical cancer': {
      const hasCervix = Boolean(answers.hasCervix);
      const immuno = Boolean(answers.immunocompromised);
      const cin2 = Boolean(answers.historyCIN2);
      if (!hasCervix) {
        return {
          status: 'not_eligible',
          title: 'Cervical screening may not apply',
          rationale: 'Cervical screening is anatomy-based. If you do not have a cervix, routine cervical screening may not be indicated (exceptions exist).',
          nextSteps: ['Confirm with a clinician if you had prior high-grade lesions (CIN2+) or cancer.'],
        };
      }
      if (cin2 || immuno) {
        return {
          status: 'needs_clinician',
          title: 'You may need a specialized schedule',
          rationale: 'History of CIN2+ or immunocompromised status often changes screening intervals and follow-up pathways.',
          nextSteps: ['Discuss personalized screening with your clinician.'],
        };
      }
      if (age < 21) {
        return {
          status: 'not_eligible',
          title: 'Not typically recommended yet',
          rationale: 'Most major guidelines start routine screening around age 21 for average risk.',
          nextSteps: ['Ask about HPV vaccination and any symptoms that should be evaluated.'],
        };
      }
      if (age > 65) {
        return {
          status: 'needs_clinician',
          title: 'Depends on your prior screening history',
          rationale: 'Stopping after 65 is often based on “adequate prior screening” and risk factors.',
          nextSteps: ['Review your screening history with your clinician.'],
        };
      }
      return {
        status: 'eligible',
        title: 'Likely eligible for cervical cancer screening',
        rationale: 'Average-risk individuals with a cervix in this age range are typically recommended to screen at regular intervals.',
        nextSteps: [
          'Choose an evidence-based option (Pap every ~3y; hrHPV every ~5y; or co-test every ~5y, depending on local guidance).',
          'Follow up abnormal results using established algorithms.',
        ],
      };
    }

    case 'Breast cancer': {
      const highRisk = Boolean(answers.highRiskBreast);
      if (highRisk) {
        return {
          status: 'needs_clinician',
          title: 'High-risk pathway may apply',
          rationale: 'High-risk factors often warrant earlier screening and/or additional imaging (e.g., MRI).',
          nextSteps: ['Discuss risk assessment and a personalized screening plan.'],
        };
      }
      if (age < 40) {
        return {
          status: 'not_eligible',
          title: 'Routine screening usually starts later',
          rationale: 'Many guidelines begin routine mammography around age 40 for average risk.',
          nextSteps: ['If you have symptoms or strong family history, talk to a clinician.'],
        };
      }
      if (age >= 40 && age <= 74) {
        return {
          status: 'eligible',
          title: 'Likely eligible for screening mammography',
          rationale: 'Average-risk adults in this age range commonly qualify for mammography at regular intervals.',
          nextSteps: ['Schedule screening and discuss interval (annual vs every 2 years) based on preference and local guidance.'],
        };
      }
      return {
        status: 'needs_clinician',
        title: 'Screening depends on overall health',
        rationale: 'Beyond typical age ranges, screening decisions are individualized based on health status and life expectancy.',
        nextSteps: ['Discuss whether to continue screening with your clinician.'],
      };
    }

    case 'Colorectal cancer': {
      const fam = Boolean(answers.familyHistoryCRC);
      const ibd = Boolean(answers.ibd);
      if (fam || ibd) {
        return {
          status: 'needs_clinician',
          title: 'You may need earlier or different screening',
          rationale: 'Family history and inflammatory bowel disease can change start age and modality.',
          nextSteps: ['Discuss a risk-based plan (often earlier start and colonoscopy-based strategies).'],
        };
      }
      if (age < 45) {
        return {
          status: 'not_eligible',
          title: 'Not typically recommended yet',
          rationale: 'Average-risk routine screening often starts around age 45.',
          nextSteps: ['If you have symptoms or higher-risk factors, consult a clinician.'],
        };
      }
      if (age >= 45 && age <= 75) {
        return {
          status: 'eligible',
          title: 'Likely eligible for colorectal cancer screening',
          rationale: 'Average-risk adults in this age range typically qualify for screening using stool-based tests or colonoscopy.',
          nextSteps: [
            'Pick an option you can complete consistently (FIT yearly; colonoscopy every ~10y; other options vary).',
            'Follow up any abnormal stool test with diagnostic colonoscopy.',
          ],
        };
      }
      return {
        status: 'needs_clinician',
        title: 'Decision is individualized',
        rationale: 'For older adults, screening is based on prior screening, health status, and preferences.',
        nextSteps: ['Review benefits and risks with your clinician.'],
      };
    }

    case 'Prostate cancer': {
      const highRisk = Boolean(answers.highRiskProstate);
      if (highRisk && age >= 45 && age < 55) {
        return {
          status: 'needs_clinician',
          title: 'Consider earlier discussion',
          rationale: 'Higher-risk groups may consider earlier shared decision-making.',
          nextSteps: ['Discuss PSA screening risks/benefits with a clinician.'],
        };
      }
      if (age >= 55 && age <= 69) {
        return {
          status: 'eligible',
          title: 'Shared decision-making recommended',
          rationale: 'Many guidelines recommend individual decision-making for PSA screening in this age range.',
          nextSteps: ['Discuss preferences and possible screening interval with your clinician.'],
        };
      }
      if (age >= 70) {
        return {
          status: 'not_eligible',
          title: 'Routine screening is often discouraged',
          rationale: 'Potential harms may outweigh benefits for routine PSA screening in older adults.',
          nextSteps: ['If you have symptoms, seek evaluation promptly.'],
        };
      }
      return {
        status: 'not_eligible',
        title: 'Screening discussion usually happens later',
        rationale: 'Average-risk screening discussions commonly start in later midlife.',
        nextSteps: ['If you are higher risk, consider discussing earlier.'],
      };
    }

    case 'CVD - Hypertension': {
      if (age < 18) {
        return {
          status: 'needs_clinician',
          title: 'Pediatric guidance differs',
          rationale: 'Hypertension screening and thresholds differ for children and adolescents.',
          nextSteps: ['Discuss with a pediatric clinician.'],
        };
      }
      return {
        status: 'eligible',
        title: 'Blood pressure checks are recommended',
        rationale: 'Adults are typically recommended to have routine blood pressure screening; elevated readings should be confirmed.',
        nextSteps: [
          'Have BP measured with proper technique.',
          'If elevated, confirm with home or ambulatory BP monitoring.',
        ],
      };
    }

    case 'CVD - Diabetes': {
      const bmi = Boolean(answers.bmiOver25);
      const gest = Boolean(answers.gestationalDM);
      const fam = Boolean(answers.familyHistoryDM);
      if (age < 35) {
        if (bmi || gest || fam) {
          return {
            status: 'needs_clinician',
            title: 'Consider earlier screening based on risk',
            rationale: 'Risk factors can justify earlier diabetes screening.',
            nextSteps: ['Discuss screening with a clinician.'],
          };
        }
        return {
          status: 'not_eligible',
          title: 'Routine screening often starts later',
          rationale: 'Average-risk recommendations commonly start around age 35.',
          nextSteps: ['Maintain healthy lifestyle and reassess over time.'],
        };
      }
      if (age >= 35 && age <= 70) {
        if (!bmi && !gest && !fam) {
          return {
            status: 'eligible',
            title: 'You may qualify for screening',
            rationale: 'Many recommendations target adults in this age range; risk factors further support screening.',
            nextSteps: ['Ask about HbA1c or fasting plasma glucose and typical re-screen intervals (~3 years if normal).'],
          };
        }
        return {
          status: 'eligible',
          title: 'Likely eligible for diabetes screening',
          rationale: 'Age plus risk factors increases the likelihood that screening is recommended.',
          nextSteps: ['Consider HbA1c, fasting glucose, or OGTT and discuss prevention if prediabetes is found.'],
        };
      }
      return {
        status: 'needs_clinician',
        title: 'Individualized screening decision',
        rationale: 'For older adults, screening depends on overall health and clinical context.',
        nextSteps: ['Discuss with your clinician.'],
      };
    }

    case 'Skin cancer': {
      const personal = Boolean(answers.personalSkinCancer);
      const moles = Boolean(answers.manyMoles);
      const immuno = Boolean(answers.immunosuppressed);
      if (personal || moles || immuno) {
        return {
          status: 'eligible',
          title: 'You may benefit from clinician skin exams',
          rationale: 'Higher-risk factors can support periodic clinician exams and closer monitoring.',
          nextSteps: ['Schedule a skin check and perform regular self-skin exams (ABCDE).'],
        };
      }
      return {
        status: 'needs_clinician',
        title: 'Screening is often risk-based',
        rationale: 'Routine population-wide skin cancer screening is not universally recommended; decisions are individualized.',
        nextSteps: ['Use sun protection, watch for changing lesions, and seek evaluation for any concerning changes.'],
      };
    }

    case 'Lung cancer': {
      const lung = evaluateLungScreening({
        age,
        smokingStatus: String(answers.smokingStatus || '') as 'never' | 'former' | 'current' | '',
        packYears: num(answers.packYears),
        cigarettesPerDay: num(answers.cigarettesPerDay),
        yearsSmoked: num(answers.yearsSmoked),
        yearsSinceQuit: num(answers.yearsSinceQuit),
        chronicLungDisease: Boolean(answers.chronicLungDisease),
        familyHistoryLungCancer: Boolean(answers.familyHistoryLungCancer),
        occupationalExposure: Boolean(answers.occupationalExposure),
        priorCancerHistory: Boolean(answers.priorCancerHistory),
        limitedLifeExpectancy: Boolean(answers.limitedLifeExpectancy),
        unableOrUnwillingToBeTreated: Boolean(answers.unableOrUnwillingToBeTreated),
      });

      return {
        status: lung.status,
        title: lung.title,
        rationale: lung.rationale,
        nextSteps: lung.nextSteps,
        criteria: lung.pathways,
      };
    }

    default:
      return {
        status: 'needs_clinician',
        title: 'Not enough data',
        rationale: 'This topic needs a custom eligibility rule set.',
        nextSteps: ['Use the Explore page and consult guideline sources.'],
      };
  }
}
