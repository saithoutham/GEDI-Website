import { supabase } from './supabaseClient';

export type TopicKey =
  | 'Skin cancer'
  | 'Cervical cancer'
  | 'Colorectal cancer'
  | 'Breast cancer'
  | 'Lung cancer'
  | 'Prostate cancer'
  | 'CVD - Hypertension'
  | 'CVD - Diabetes';

export type Guideline = {
  id: number;
  topic: TopicKey | string;
  title: string;
  age_min: number | null;
  age_max: number | null;
  sex: 'female' | 'male' | 'any';
  risk_group: 'average' | 'increased' | 'high';
  interval: string | null;
  start_age: number | null;
  stop_age: number | null;
  modality: string | null;
  summary: string | null;
  details: string | null;
  guideline_org?: string | null;
  recommendation_grade?: string | null;
  population_description?: string | null;
  source_name: string | null;
  source_url: string | null;
  last_reviewed_at: string | null;
  updated_at: string;
  created_at: string;
};

export type Resource = {
  id: number;
  topic: string;
  title: string;
  url: string;
  org: string | null;
  description: string | null;
  created_at: string;
};

export async function getGuidelines(params?: {
  topic?: string;
  q?: string;
  age_min?: number;
  age_max?: number;
  sex?: 'female' | 'male' | 'any';
  guideline_org?: string;
  grade?: string;
  sort?: 'topic' | 'title' | 'updated_at';
}): Promise<Guideline[]> {
  const sort = params?.sort === 'updated_at' ? 'updated_at' : params?.sort === 'title' ? 'title' : 'topic';
  const ascending = sort !== 'updated_at';
  const { data, error } = await supabase.from('screening_guidelines').select('*').order(sort, { ascending }).order('title', { ascending: true });
  if (error) throw error;

  const q = params?.q?.trim().toLowerCase() ?? '';

  return (data ?? []).filter((row) => {
    if (params?.topic && row.topic !== params.topic) return false;
    if (params?.sex && params.sex !== 'any' && row.sex !== params.sex && row.sex !== 'any') return false;
    if (params?.guideline_org && row.guideline_org !== params.guideline_org) return false;
    if (params?.grade && row.recommendation_grade !== params.grade) return false;

    if (typeof params?.age_min === 'number') {
      const max = row.age_max ?? row.stop_age;
      if (typeof max === 'number' && max < params.age_min) return false;
    }
    if (typeof params?.age_max === 'number') {
      const min = row.age_min ?? row.start_age;
      if (typeof min === 'number' && min > params.age_max) return false;
    }

    if (q) {
      const haystack = [
        row.topic,
        row.title,
        row.summary,
        row.details,
        row.guideline_org,
        row.source_name,
        row.modality,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export async function getResources(topic?: string): Promise<Resource[]> {
  let query = supabase.from('health_resources').select('*').order('topic', { ascending: true }).order('title', { ascending: true });
  if (topic) query = query.eq('topic', topic);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
