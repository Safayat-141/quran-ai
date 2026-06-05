const API_KEY = "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";

async function askGemini(question, ayats, apiKey) {
  const ayatContext = ayats.map(a =>
    `[${a.surahName} ${a.surah}:${a.ayat}] "${a.text}"`
  ).join('\n\n');

  const prompt = `You are a wise Islamic guide. Your ONLY source of knowledge is the Quran.

Below are the relevant Ayats retrieved for the user's question:

${ayatContext}

The user asks: "${question}"

Instructions:
- Answer ONLY based on the Ayats above. Do not use any outside knowledge.
- Be compassionate, clear, and practical.
- Cite the Surah and Ayat number (e.g. Al-Baqarah 2:45) when you reference a verse.
- If the retrieved Ayats do not clearly address the question, say so honestly.
- Keep the answer between 3–6 sentences.`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-001:free',
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
