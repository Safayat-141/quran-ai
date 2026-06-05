let quranData = null;

async function loadQuran() {
  if (quranData) return;
  try {
    const res = await fetch('https://api.alquran.cloud/v1/quran/en.asad');
    const json = await res.json();
    quranData = json.data.surahs;
  } catch (e) {
    console.error('Failed to load Quran:', e);
  }
}

function searchQuran(query) {
  return []; // AI handles everything now
}
