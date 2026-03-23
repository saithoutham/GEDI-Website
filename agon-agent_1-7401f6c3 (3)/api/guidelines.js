import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { topic, q, age_min, age_max, sex, guideline_org, grade, sort = 'topic' } = req.query;

      let query = supabase.from('screening_guidelines').select('*');

      if (topic) query = query.eq('topic', topic);
      if (sex && sex !== 'any') query = query.in('sex', [sex, 'any']);

      // Phase 3 note: these columns may not exist yet if schema migrations haven't been applied.
      // We only add filters when the params are present; if the columns do not exist in the DB,
      // Supabase will return an error. Apply the Phase 3 schema changes before using these params.
      if (guideline_org) query = query.eq('guideline_org', guideline_org);
      if (grade) query = query.eq('recommendation_grade', grade);

      if (age_min) query = query.lte('age_min', Number(age_min));
      if (age_max) query = query.gte('age_max', Number(age_max));

      if (q) {
        // Simple title/topic search (Supabase like is case-sensitive; use ilike via text pattern if supported)
        query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,topic.ilike.%${q}%`);
      }

      const orderCol = ['topic', 'title', 'updated_at'].includes(sort) ? sort : 'topic';
      query = query.order(orderCol, { ascending: orderCol !== 'updated_at' });
      query = query.order('title', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const {
        topic,
        title,
        age_min,
        age_max,
        sex,
        risk_group,
        interval,
        start_age,
        stop_age,
        modality,
        summary,
        details,
        source_name,
        source_url,
        last_reviewed_at,
      } = req.body;

      if (!topic || !title) return res.status(400).json({ error: 'topic and title are required' });

      const { data, error } = await supabase
        .from('screening_guidelines')
        .insert({
          topic,
          title,
          age_min,
          age_max,
          sex: sex || 'any',
          risk_group: risk_group || 'average',
          interval,
          start_age,
          stop_age,
          modality,
          summary,
          details,
          source_name,
          source_url,
          last_reviewed_at,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...patch } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { data, error } = await supabase
        .from('screening_guidelines')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const { error } = await supabase.from('screening_guidelines').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
