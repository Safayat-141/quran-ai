let quranData = null;

async function loadQuran() {
  if (quranData) return;
  const res = await fetch('https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_en.json');
  quranData = await res.json();
}

function searchQuran(query) {
  if (!quranData) return [];

  const keywords = query.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));

  const results = [];

  for (const surah of quranData) {
    for (const ayat of surah.verses) {
      const text = ayat.text.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      if (score > 0) {
        results.push({
          surah: surah.id,
          surahName: surah.transliteration,
          ayat: ayat.id,
          text: ayat.text,
          score
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 6);
}

const STOPWORDS = new Set([
  'what','does','when','where','which','that','this','with','from',
  'have','will','should','would','could','about','some','they','them',
  'their','been','were','there','here','then','than','also','into',
  'your','more','much','such','very','just','like','even','only',
  'said','each','make','know','need','want','life','allah','quran'
]);
