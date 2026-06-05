async function askGemini(question) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'API error');
  }

  const data = await res.json();
  return data.answer || 'No response received.';
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
