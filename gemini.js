const API_KEY = "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";

async function askGemini(question, ayats, apiKey) {
  const prompt = `You are a wise and compassionate Islamic guide with deep knowledge of the Quran.

A person asks: "${question}"

Instructions:
- Find the most relevant Quranic verses that address this question
- Answer warmly and directly as a knowledgeable Islamic guide
- Quote the relevant Ayats directly in your answer in this format: (Surah Name, Chapter:Verse) "verse text here"
- Be practical and relevant to the person's real life situation
- Keep the answer between 4–7 sentences
- End with an encouraging closing thought`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.4
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API error');
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response received.';
}

async function fetchTafsir(surah, ayat) {
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/quran-uthmani,en.maududi`
    );
    const data = await res.json();
    if (data.code !== 200) return null;
    const [arabic, tafsir] = data.data;
    return { arabic: arabic.text, english: tafsir.text };
  } catch {
    return null;
  }
}
