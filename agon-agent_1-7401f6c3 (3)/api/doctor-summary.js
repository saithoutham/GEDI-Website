import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { age, sex, smokingStatus, packYears, yearsQuit, eligibleTopics } = req.body || {};
      if (typeof age !== 'number' || !sex || !smokingStatus || !Array.isArray(eligibleTopics)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

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

      const list = eligibleTopics.length ? eligibleTopics.join(', ') : 'none listed';
      const summaryText = `I am a ${age}-year-old ${personWord}.${smokingSentence} Based on public health guidelines, I may be eligible for the following screenings: ${list}. I would like to discuss whether these are right for me.`;

      return res.status(200).json({
        summaryText,
        eligibleCount: eligibleTopics.length,
        generatedAt: new Date().toISOString(),
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
