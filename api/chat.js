export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { question } = req.body;

  try {
    // ── STEP 1: Get relevant Surah:Verse references from Groq ──
    const refResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: referencePrompt(question) }],
        max_tokens: 200,
        temperature: 0.2
      })
    });

    const refData = await refResponse.json();
    const refText = refData.choices?.[0]?.message?.content?.trim() || '';

    // Handle out-of-scope
    if (refText === 'DECLINE') {
      return res.status(200).json({
        answer: "I'm only able to offer guidance from the Holy Quran. For worldly knowledge, please use a general search engine. Is there something spiritual I can help you with?"
      });
    }

    // ── STEP 2: Parse references e.g. "2:286, 3:159, 25:68" ──
    const references = refText
      .split(',')
      .map(r => r.trim())
      .filter(r => /^\d+:\d+$/.test(r))
      .slice(0, 4);

    if (references.length === 0) {
      return res.status(200).json({
        answer: "I couldn't find directly relevant verses for your question. Could you rephrase it?"
      });
    }

    // ── STEP 3: Fetch exact verified text from alquran.cloud ──
    const ayatResults = await Promise.all(
      references.map(async (ref) => {
        try {
          const r = await fetch(
            `https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.asad`
          );
          const d = await res.json();
          if (d.code !== 200) return null;
          const [arabic, english] = d.data;
          return {
            ref,
            surahName: english.surah.englishName,
            arabic: arabic.text,
            english: english.text
          };
        } catch {
          return null;
        }
      })
    );

    const validAyats = ayatResults.filter(Boolean);

    if (validAyats.length === 0) {
      return res.status(200).json({
        answer: "I couldn't retrieve the verses at this moment. Please try again."
      });
    }

    // ── STEP 4: Format verified Ayats for the prompt ──
    const ayatContext = validAyats.map(a =>
      `(${a.surahName}, ${a.ref}) "${a.english}"`
    ).join('\n\n');

    // ── STEP 5: Groq reasons from verified Ayats ──
    const reasoningResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: reasoningPrompt(question, ayatContext) }],
        max_tokens: 1200,
        temperature: 0.4
      })
    });

    const reasoningData = await reasoningResponse.json();

    if (!reasoningResponse.ok || !reasoningData.choices) {
      console.error('Groq error:', JSON.stringify(reasoningData));
      return res.status(500).json({ error: reasoningData.error?.message || 'Groq error' });
    }

    const answer = reasoningData.choices[0].message.content || 'No response received.';
    res.status(200).json({ answer });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

function referencePrompt(question) {
  return `You are a Quranic scholar. Your task has two parts:

1. Determine if this question is within scope: spiritual guidance, faith, personal struggles, ethics, relationships, emotions, life challenges.

2. If OUT OF SCOPE (geography, sports, coding, math, science, general trivia) — respond with exactly: DECLINE

If IN SCOPE — respond with only the most relevant Surah:Verse references, comma-separated, like this:
5:32, 17:33, 25:68

Question: "${question}"

Rules:
- Return ONLY the reference numbers or DECLINE
- No text, no explanation, no Ayat text
- Maximum 4 references
- Only include references you are highly confident are directly relevant`;
}

function reasoningPrompt(question, ayats) {
  return `You are a wise Islamic guide. A person has asked: "${question}"

CORE RULES — these take priority over everything else:

1. SCOPE — If the retrieved Ayats say "DECLINE", respond with only this: "I'm only able to offer guidance from the Holy Quran. For worldly knowledge, please use a general search engine. Is there something spiritual I can help you with?" Then stop. Do not add anything else.

2. EMOTIONAL DISTRESS — If the person expresses pain, sadness, hopelessness, or says things like "I hate my life" or "I'm struggling", always respond with warmth, empathy and relevant Quranic comfort. Never decline these.

3. CRISIS LANGUAGE — If the person expresses suicidal thoughts or says "I want to die", respond with genuine compassion and Quranic hope.

4. VERSE ACCURACY — Only cite verses directly relevant to the question. Never use generic filler verses. Every cited verse must meaningfully address the specific topic.

The Quranic Ayats for this question (ground truth — 100% accurate):
${ayats}

GREETING RULES — apply exactly one:
- If the question contains "assalamu alaikum" → start with "Wa alaikum assalam!"
- If the question contains "hi" or "hello" → start with "Hello!"
- Otherwise → start directly with the response, no greeting

RESPONSE FORMAT (only if not declined):
- Write as natural flowing conversation — no headings, no labels, no bullet points
- Open with 2-3 sentences of your own understanding of the topic. No Ayats yet.
- Introduce each Ayat naturally in full using: (Surah Name, Chapter:Verse) "verse text" — then 1-2 sentences on what it means for this situation
- Flow into a practical conclusion drawn from the Ayats
- End with one warm encouraging sentence
- Total: 9-11 sentences`;
}
