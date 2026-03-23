import type { TopicKey } from './topics';

export const WHAT_TEST_INVOLVES: Record<TopicKey, string> = {
  'Lung cancer':
    'A low-dose CT scan (LDCT) takes about 10 minutes. You lie on a table and a machine scans your chest. No needles, no dye required for standard screening.',
  'Colorectal cancer':
    'Options include a stool test (FIT) done at home once a year, or a colonoscopy done in a clinic every 10 years. Your doctor can help you choose.',
  'Breast cancer':
    'A mammogram is an X-ray of the breast. It takes about 20 minutes and is done at a radiology clinic or hospital.',
  'Cervical cancer':
    'A Pap smear or HPV test is done during a routine pelvic exam. It takes a few minutes and is typically part of a regular checkup.',
  'Prostate cancer':
    'A PSA blood test measures a protein in your blood. It involves a simple blood draw at a lab or clinic.',
  'Skin cancer':
    'A skin exam is a visual check by a dermatologist or primary care provider. It usually takes 10 to 15 minutes.',
  'CVD - Hypertension':
    'Blood pressure is measured with a cuff on your arm. It takes under a minute and can be done at a clinic, pharmacy, or at home.',
  'CVD - Diabetes':
    'A fasting blood sugar or A1C test is done with a blood draw. Results are usually available within a few days.',
};

export function nextStepsResourceHint(topic: TopicKey) {
  // Basic keyword for picking the most relevant resource from the panel.
  if (topic === 'Lung cancer') return 'lung';
  if (topic === 'Cervical cancer') return 'cervical';
  if (topic === 'Colorectal cancer') return 'colorectal';
  if (topic === 'Breast cancer') return 'breast';
  if (topic === 'Prostate cancer') return 'prostate';
  if (topic === 'Skin cancer') return 'skin';
  if (topic === 'CVD - Hypertension') return 'blood pressure';
  return 'diabetes';
}
