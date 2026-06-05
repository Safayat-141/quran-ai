const API_KEY = "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";

async function askGemini(question, ayats, apiKey) {
  const ayatContext = ayats.map(a =>
    `[${a.surahName} ${a.surah}:${a.ayat}] "${a.text}"`
  ).join('\n\n');

  const prompt = `You are a wise and compassionate Islamic guide with deep knowledge of the Quran. A person has come to you seeking guidance.

Based on the following Quranic verses, provide a warm, direct, and practical answer to the person's question. Speak as a guide, not as an analyst. Do not mention "the Ayats provided" or "the text given" — simply answer as if you know the Quran deeply.

Relevant Quranic verses for context:
${ayatContext}

The person asks: "${question}"

Instructions:
- Answer directly and warmly, as a knowledgeable Islamic guide would
- Naturally weave in Quranic references (e.g. "As Allah says in Al-Baqarah 2:45...")
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
      max_tokens: 600,
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
