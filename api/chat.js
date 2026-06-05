export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question } = req.body;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: buildPrompt(question) }],
      max_tokens: 800,
      temperature: 0.4
    })
  });

  const data = await response.json();
  if (!response.ok || !data.choices) {
  console.error('OpenRouter error:', JSON.stringify(data));
  return res.status(500).json({ error: data.error?.message || 'OpenRouter error' });
}
  const answer = data.choices?.[0]?.message?.content || 'No response received.';
  res.status(200).json({ answer });
}

function buildPrompt(question) {
  return `You are a wise and compassionate Islamic guide with deep knowledge of the Quran.

A person asks: "${question}"

Instructions:
- Find the most relevant Quranic verses that address this question
- Answer warmly and directly as a knowledgeable Islamic guide
- Quote the relevant Ayats directly in your answer in this format: (Surah Name, Chapter:Verse) "verse text here"
- Be practical and relevant to the person's real life situation
- Keep the answer between 4–7 sentences
- End with an encouraging closing thought`;
}
