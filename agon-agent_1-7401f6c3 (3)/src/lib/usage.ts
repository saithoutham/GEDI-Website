import { safeSessionGet, safeSessionSet } from './storage';

export const SESSION_KEY = 'gedi_session_id';

export function getOrCreateSessionId(): string {
  const existing = safeSessionGet(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  safeSessionSet(SESSION_KEY, id);
  return id;
}

export function ageToBand(age: number): string {
  if (age < 18) return 'under-18';
  if (age <= 29) return '18-29';
  if (age <= 39) return '30-39';
  if (age <= 49) return '40-49';
  if (age <= 59) return '50-59';
  if (age <= 69) return '60-69';
  return '70-plus';
}

export async function upsertUsage(payload: {
  session_id: string;
  age_band?: string | null;
  sex_input?: string | null;
  topics_viewed?: string[];
  eligibility_run?: boolean;
  summary_copied?: boolean;
}) {
  const res = await fetch('/api/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`usage upsert failed: ${t || res.status}`);
  }
  return res.json();
}
