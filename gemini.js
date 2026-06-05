const API_KEY = "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";

async function askGemini(question) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return data.answer;
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
