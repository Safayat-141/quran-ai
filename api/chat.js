export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { question } = req.body;

  try {
    // ── STEP 1: Scope check + Ayat retrieval ──
    const retrievalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: retrievalPrompt(question) }],
        max_tokens: 600,
        temperature: 0.2
      })
    });

    const retrievalData = await retrievalResponse.json();
    const ayats = retrievalData.choices?.[0]?.message?.content || '';

    // ── STEP 2: Reason from Ayats ──
    const reasoningResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: reasoningPrompt(question, ayats) }],
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

function retrievalPrompt(question) {
  return `You are a Quranic scholar. Determine if the following question is within the scope of spiritual guidance, faith, personal struggles, ethics, relationships, emotions, or life challenges.

Question: "${question}"

If the question is OUT OF SCOPE (e.g. geography, sports, coding, math, science facts, general trivia), respond with exactly one word: DECLINE

If the question IS within scope, list exactly 2-3 relevant Ayats in this EXACT format only:
(Surah Name, Chapter:Verse) "exact verse text here"

CRITICAL RULES for listing Ayats:
- Only cite an Ayat if you can quote its COMPLETE and FULL text
- If you are uncertain about the full text of a verse, do NOT include it
- Never truncate a verse — if you cannot recall it fully, skip it and choose another
- Prefer shorter, well-known verses that you can quote with full confidence
- Quality over quantity — 2 accurate complete verses is better than 4 with one truncated

Example:
(Al-Baqarah, 2:286) "Allah does not burden a soul beyond that it can bear."

Only list Ayats or the word DECLINE. Nothing else.`;
}

function reasoningPrompt(question, ayats) {
  return `You are a wise Islamic guide. A person has asked: "${question}"

CORE RULES — these take priority over everything else:

1. SCOPE — If the retrieved Ayats say "DECLINE", respond with only this: "I'm only able to offer guidance from the Holy Quran. For worldly knowledge, please use a general search engine. Is there something spiritual I can help you with?" Then stop. Do not add anything else.

2. EMOTIONAL DISTRESS — If the person expresses pain, sadness, hopelessness, or says things like "I hate my life" or "I'm struggling", always respond with warmth, empathy and relevant Quranic comfort. Never decline these.

3. CRISIS LANGUAGE — If the person expresses suicidal thoughts or says "I want to die", respond with genuine compassion and Quranic hope. Add this as a separate final line: "If you are in crisis, please reach out to someone you trust or contact a mental health helpline in your country."

4. VERSE ACCURACY — Only cite verses directly relevant to the question. Never use generic filler verses. Every cited verse must meaningfully address the specific topic.

5. DISCLAIMER — Every response that is not a decline must end with this exact line on its own line: "For religious rulings, please consult a qualified scholar."

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
- Then the disclaimer on its own line
- Total: 9-11 sentences`;
}
