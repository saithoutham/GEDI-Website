export const TOPICS = [
  'Skin cancer',
  'Cervical cancer',
  'Colorectal cancer',
  'Breast cancer',
  'Lung cancer',
  'Prostate cancer',
  'CVD - Hypertension',
  'CVD - Diabetes',
] as const;

export type TopicKey = (typeof TOPICS)[number];

export function topicToSlug(topic: string) {
  return encodeURIComponent(topic);
}

export function slugToTopic(slug: string) {
  return decodeURIComponent(slug);
}
