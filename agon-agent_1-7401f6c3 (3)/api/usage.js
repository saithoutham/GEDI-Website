import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const {
        session_id,
        age_band,
        sex_input,
        topics_viewed,
        eligibility_run,
        summary_copied,
      } = req.body || {};

      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ error: 'session_id is required' });
      }

      // Upsert behavior without a unique constraint: try to update existing row by session_id.
      // If none updated, insert a new row.

      const mergeTopics = (prev, next) => {
        const a = Array.isArray(prev) ? prev : [];
        const b = Array.isArray(next) ? next : [];
        const set = new Set([...a, ...b].filter((x) => typeof x === 'string'));
        return Array.from(set);
      };

      const payload = {
        session_id,
        age_band: age_band ?? null,
        sex_input: sex_input ?? null,
        topics_viewed: Array.isArray(topics_viewed) ? topics_viewed : null,
        eligibility_run: typeof eligibility_run === 'boolean' ? eligibility_run : Boolean(eligibility_run),
        summary_copied: typeof summary_copied === 'boolean' ? summary_copied : Boolean(summary_copied),
      };

      const { data: existing, error: existingErr } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (existingErr) throw existingErr;

      if (existing && existing.length) {
        const row = existing[0];
        const mergedTopics = mergeTopics(row.topics_viewed, payload.topics_viewed);
        const { data, error } = await supabase
          .from('usage_logs')
          .update({
            age_band: payload.age_band ?? row.age_band ?? null,
            sex_input: payload.sex_input ?? row.sex_input ?? null,
            topics_viewed: mergedTopics,
            eligibility_run: Boolean(row.eligibility_run) || Boolean(payload.eligibility_run),
            summary_copied: Boolean(row.summary_copied) || Boolean(payload.summary_copied),
          })
          .eq('id', row.id)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      const { data, error } = await supabase
        .from('usage_logs')
        .insert({
          ...payload,
          topics_viewed: payload.topics_viewed ?? [],
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
