async function askGemini(question, ayats, apiKey) {
  apiKey = "AQ.Ab8RN6JwNUiIcwA9ROew1CiHfJVMR9aWv82CmneoZwDVOZLE_Q";
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

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gemini API error');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
}

async function fetchTafsir(surah, ayat) {
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/quran-uthmani,en.maududi`
    );
    const data = await res.json();
    if (data.code !== 200) return null;
    const [arabic, tafsir] = data.data;
    return {
      arabic: arabic.text,
      english: tafsir.text
    };
  } catch {
    return null;
  }
}
