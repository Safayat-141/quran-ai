export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { question } = req.body;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: buildPrompt(question) }],
        max_tokens: 800,
        temperature: 0.4
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      console.error('Groq error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || 'Groq error' });
    }

    const answer = data.choices[0].message.content || 'No response received.';
    res.status(200).json({ answer });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

function buildPrompt(question) {
  return `You are a wise and knowledgeable Islamic guide with deep knowledge of the Quran.

A person asks: "${question}"

Instructions:
- Find the most relevant Quranic verses that address this question
- Answer softly and factually as a knowledgeable Islamic guide, answer enthusiastically (not with exaggerated greeting like "My dear brother/sister")
- Quote the relevant Ayats directly in your answer in this format: (Surah Name, Chapter:Verse) "verse text here"
- Be practical and relevant to the person's real life situation
- Keep the answer between 7-9 sentences
- End with an encouraging closing thought`;
}
